/**
 * 🎤 Web Audio Recording Service
 *
 * - Recording audio using browser MediaRecorder API
 * - Blob based in-memory storage (Blob URL)
 * - State management with listeners (maintained for React UI compatibility)
 * - Integration with Marutek transcription
 */

import { MARUTEK_CONFIG } from "@/lib/constants";
import { ensureAIConsent } from "@/services/aiConsentGate";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { logger } from "@/services/logger";
import {
  EmptyTranscriptionError,
  TranscriptionAggregateError,
  testMarutekServer,
  transcribeAudioWithFallback,
} from "./marutekTranscribeService";

const TRANSCRIPTION_TIMEOUT_MS = 90_000;
const TRANSCRIPTION_TIMEOUT_MESSAGE = "TRANSCRIPTION_TIMEOUT";

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise
      .then((value) => {
        clearTimeout(id);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  currentUri: string | null;
  error: string | null;
}

export interface RecordingResult {
  text: string;
  accuracy?: number;
  details?: string[];
  errorType?: "empty" | "network" | "server" | "unknown";
  troubleshooting?: string[];
}

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private state: RecordingState = {
    isRecording: false,
    isProcessing: false,
    currentUri: null,
    error: null,
  };
  private lastStartTimestamp: number | null = null;
  private lastStopTimestamp: number | null = null;
  private listeners: ((state: RecordingState) => void)[] = [];

  // Subscribe to state changes (UI components use this to react)
  subscribe(listener: (state: RecordingState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private updateState(updates: Partial<RecordingState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  getState(): RecordingState {
    return { ...this.state };
  }

  private getSupportedMimeType(): string {
    if (globalThis.window === undefined || typeof MediaRecorder === "undefined") {
      return "audio/webm";
    }
    const candidateTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
    ];
    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "audio/webm";
  }

  private cleanupTracks() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          logger.warn("Failed to stop track:", e);
        }
      });
      this.mediaStream = null;
    }
  }

  async resetRecorder(): Promise<void> {
    try {
      logger.debug("🎤 [AUDIO_SERVICE] Resetting recorder...");

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        try {
          this.mediaRecorder.stop();
        } catch (error) {
          logger.warn("🎤 [AUDIO_SERVICE] Error stopping mediaRecorder:", error);
        }
      }
      this.mediaRecorder = null;
      this.cleanupTracks();
      this.audioChunks = [];

      // Revoke old object URL to prevent memory leaks
      if (this.state.currentUri && this.state.currentUri.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(this.state.currentUri);
        } catch (e) {
          logger.warn("Failed to revoke object URL:", e);
        }
      }

      this.updateState({
        isRecording: false,
        isProcessing: false,
        currentUri: null,
        error: null,
      });

      this.lastStartTimestamp = null;
      this.lastStopTimestamp = null;

      logger.debug("🎤 [AUDIO_SERVICE] Recorder reset complete");
    } catch (error) {
      logger.error("🎤 [AUDIO_SERVICE] Error resetting recorder:", error);
    }
  }

  // Start recording using standard MediaRecorder API
  async startRecording(): Promise<void> {
    try {
      if (this.state.isRecording || this.state.isProcessing) {
        logger.debug("🎤 [AUDIO_SERVICE] Recording already in progress, resetting first...");
        await this.resetRecorder();
      }

      if (globalThis.window === undefined || typeof navigator === "undefined" || !navigator.mediaDevices) {
        throw new Error("Ghi âm không được hỗ trợ trên môi trường này.");
      }

      logger.debug("🎤 [AUDIO_SERVICE] startRecording invoked");

      const aiConsented = await ensureAIConsent();
      if (!aiConsented) {
        throw new Error(
          "AI consent is required for speaking and pronunciation features that use voice analysis.",
        );
      }

      // Request media stream from user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;

      const mimeType = this.getSupportedMimeType();
      logger.debug("🎤 [AUDIO_SERVICE] Using MIME Type:", mimeType);

      this.audioChunks = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      recorder.start(100); // chunk every 100ms
      this.mediaRecorder = recorder;
      this.lastStartTimestamp = Date.now();

      this.updateState({
        isRecording: true,
        isProcessing: false,
        error: null,
      });

      logger.debug("🎤 [AUDIO_SERVICE] Recording started successfully");
    } catch (error) {
      logger.error("Error starting recording:", error);
      this.cleanupTracks();
      const message = isAIConsentRequiredError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : "Failed to start recording";
      this.updateState({
        isRecording: false,
        isProcessing: false,
        error: message,
      });
      throw error;
    }
  }

  // Stop recording and transcribe
  async stopRecordingAndTranscribe(): Promise<RecordingResult> {
    try {
      if (!this.state.isRecording || !this.mediaRecorder) {
        throw new Error("No active recording to stop");
      }

      logger.debug("🎤 [AUDIO_SERVICE] stopRecording invoked");
      
      this.updateState({
        isRecording: false,
        isProcessing: true,
        error: null,
      });

      return new Promise<RecordingResult>((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error("MediaRecorder is null"));
          return;
        }

        this.mediaRecorder.onstop = async () => {
          try {
            this.lastStopTimestamp = Date.now();
            const recordingDuration = this.lastStartTimestamp
              ? this.lastStopTimestamp - this.lastStartTimestamp
              : 0;

            logger.debug("🎤 [AUDIO_SERVICE] Recording duration (ms):", recordingDuration);

            // Combine chunks into a single audio blob
            const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            
            // Create a temporary Blob URL
            const uri = URL.createObjectURL(audioBlob);
            this.updateState({ currentUri: uri });

            // Stop all audio tracks
            this.cleanupTracks();

            if (recordingDuration < 800) {
              logger.warn("🎤 [AUDIO_SERVICE] Recording was very short. Transcription might fail.");
            }

            logger.debug("🎤 [AUDIO_SERVICE] Starting transcription of:", uri);

            // Validate blob size
            if (audioBlob.size === 0) {
              throw new Error("Audio recording yielded empty data");
            }

            // Test server availability before uploading
            try {
              const serverAvailable = await testMarutekServer();
              if (!serverAvailable) {
                logger.warn("🎤 [AUDIO_SERVICE] Server test failed, but trying anyway");
              }
            } catch (serverError) {
              logger.warn("🎤 [AUDIO_SERVICE] Server availability test errored:", serverError);
            }

            // Determine file extension
            let extension = ".webm";
            if (mimeType.includes("mp4")) extension = ".mp4";
            else if (mimeType.includes("wav")) extension = ".wav";
            else if (mimeType.includes("ogg")) extension = ".ogg";

            const transcriptionResult = await withTimeout(
              transcribeAudioWithFallback(uri, {
                language: "zh-CN",
                endpoint: MARUTEK_CONFIG.API_URL,
                filename: `recording${extension}`,
                contentType: mimeType,
              }),
              TRANSCRIPTION_TIMEOUT_MS,
              TRANSCRIPTION_TIMEOUT_MESSAGE,
            );

            this.updateState({ isProcessing: false });
            resolve({
              text: transcriptionResult.transcription,
              accuracy: transcriptionResult.confidence,
              details: [],
            });

          } catch (transcriptionError) {
            logger.error("🎤 [AUDIO_SERVICE] Transcription error:", transcriptionError);

            const fallbackDetails: RecordingResult = {
              text: "",
              details: [],
              accuracy: undefined,
              troubleshooting: [
                "Server Marutek không phản hồi hoặc trả về kết quả rỗng",
                "Vui lòng kiểm tra kết nối mạng và thử lại",
                "Hoặc thử ghi âm lâu hơn (ít nhất 2-3 giây)",
              ],
            };

            if (transcriptionError instanceof EmptyTranscriptionError) {
              fallbackDetails.errorType = "empty";
              fallbackDetails.details = [
                "Máy chủ trả về bản chuyển lời trống — có thể do ghi âm im lặng hoặc quá ngắn.",
                "Hãy nói to, rõ và ghi ít nhất 2–3 giây rồi thử lại.",
              ];
            } else if (transcriptionError instanceof TranscriptionAggregateError) {
              const onlyEmptyResults =
                transcriptionError.errors.length > 0 &&
                transcriptionError.errors.every((e) => e instanceof EmptyTranscriptionError);
              if (onlyEmptyResults) {
                fallbackDetails.errorType = "empty";
                fallbackDetails.details = [
                  "Máy chủ trả về bản chuyển lời trống — có thể do mic chưa bật hoặc không thu được giọng nói.",
                  "Thử nói to, rõ và ghi ít nhất 2–3 giây; kiểm tra lại mic.",
                ];
              } else {
                fallbackDetails.errorType = "server";
                fallbackDetails.details = transcriptionError.errors.map((error, index) => {
                  if (error instanceof EmptyTranscriptionError) {
                    return `Lần ${index + 1}: kết quả rỗng (${error.details.method})`;
                  }
                  return `Lần ${index + 1}: ${error.message}`;
                });
              }
            } else if (transcriptionError instanceof Error) {
              if (transcriptionError.message === TRANSCRIPTION_TIMEOUT_MESSAGE) {
                fallbackDetails.errorType = "network";
                fallbackDetails.details = [
                  "Đã gửi bản ghi nhưng hết thời gian chờ phản hồi từ máy chủ.",
                  "Vui lòng kiểm tra kết nối mạng và thử lại.",
                ];
              } else {
                fallbackDetails.errorType = "unknown";
                fallbackDetails.details = [transcriptionError.message];
              }
            }

            this.updateState({
              isProcessing: false,
              error:
                transcriptionError instanceof EmptyTranscriptionError
                  ? "Chưa nhận dạng được giọng nói, hãy thử nói rõ hơn."
                  : transcriptionError instanceof TranscriptionAggregateError &&
                    transcriptionError.errors.length > 0 &&
                    transcriptionError.errors.every((e) => e instanceof EmptyTranscriptionError)
                    ? "Không nhận dạng được giọng nói — có thể bản ghi không có âm thanh."
                    : transcriptionError instanceof Error &&
                      transcriptionError.message === TRANSCRIPTION_TIMEOUT_MESSAGE
                      ? "Hết thời gian chờ phản hồi từ máy chủ. Vui lòng thử lại."
                      : "Không thể gửi bản ghi âm đến máy chủ.",
            });

            resolve(fallbackDetails);
          }
        };

        this.mediaRecorder.stop();
      });

    } catch (error) {
      logger.error("Error stopping recording or transcribing:", error);
      this.updateState({
        isRecording: false,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Failed to process recording",
      });
      throw error;
    }
  }

  // Cancel current recording
  async cancelRecording(): Promise<void> {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
      this.cleanupTracks();
      this.audioChunks = [];

      if (this.state.currentUri && this.state.currentUri.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(this.state.currentUri);
        } catch (cleanupError) {
          logger.warn("🎤 [AUDIO_SERVICE] Object URL revoke warning:", cleanupError);
        }
      }

      this.updateState({
        isRecording: false,
        isProcessing: false,
        currentUri: null,
        error: null,
      });
    } catch (error) {
      logger.error("Error canceling recording:", error);
      this.updateState({
        isRecording: false,
        isProcessing: false,
        error: error instanceof Error ? error.message : "Failed to cancel recording",
      });
    }
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    await this.cancelRecording();
  }
}

// Export singleton instance
export const audioRecordingService = new AudioRecordingService();
