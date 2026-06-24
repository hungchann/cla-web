/**
 * 🎤 Audio Recording Service
 *
 *
 * - Ghi âm audio với expo-av
 * - Fallback system cho tương thích tối đa
 * - Primary config: M4A/AAC (chất lượng tốt)
 * - Fallback config: 3GP/AMR-NB (tương thích tối đa)
 * - Auto-fallback khi primary config thất bại
 * - Tương thích iOS & Android
 * - State management với listeners
 * - Error handling và cleanup
 * - Integration với Marutek transcription
 *
 */

import { MARUTEK_CONFIG } from "@/lib/constants";
import { ensureAIConsent } from "@/services/aiConsentGate";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { logger } from "@/services/logger";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { AppState, AppStateStatus, NativeEventSubscription } from "react-native";
import {
  EmptyTranscriptionError,
  TranscriptionAggregateError,
  testMarutekServer,
  transcribeAudioWithFallback,
} from "./marutekTranscribeService";

/** Tối đa chờ server trả bản ghi chuyển lời (tránh treo khi không có phản hồi). */
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
  private recorder: Audio.Recording | null = null;
  private state: RecordingState = {
    isRecording: false,
    isProcessing: false,
    currentUri: null,
    error: null,
  };
  private lastStartTimestamp: number | null = null;
  private lastStopTimestamp: number | null = null;
  private appState: AppStateStatus = AppState.currentState;
  private appStateSubscription: NativeEventSubscription | null = null;

  private listeners: ((state: RecordingState) => void)[] = [];

  // Subscribe to state changes
  subscribe(listener: (state: RecordingState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Update state and notify listeners
  private updateState(updates: Partial<RecordingState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  // Get current state
  getState(): RecordingState {
    return { ...this.state };
  }

  private getRecordingDirectory(): string | null {
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      return null;
    }
    return (baseDir.endsWith("/") ? baseDir : `${baseDir}/`) + "recordings";
  }

  private getFileExtensionFromUri(uri: string | null): string {
    if (!uri) {
      return ".m4a";
    }
    const match = uri.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (match && match[1]) {
      return `.${match[1].toLowerCase()}`;
    }
    return ".m4a";
  }

  private async persistRecordingFile(originalUri: string): Promise<string> {
    const recordingsDir = this.getRecordingDirectory();
    if (!recordingsDir) {
      logger.warn(
        "🎤 [AUDIO_SERVICE] Document directory unavailable; using temporary recording URI",
      );
      return originalUri;
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      }
    } catch (directoryError) {
      logger.warn(
        "🎤 [AUDIO_SERVICE] Unable to verify recordings directory, attempting to create:",
        directoryError,
      );
      try {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      } catch (createError) {
        logger.warn(
          "🎤 [AUDIO_SERVICE] Failed to create recordings directory, keeping original URI:",
          createError,
        );
        return originalUri;
      }
    }

    const extension = this.getFileExtensionFromUri(originalUri);
    const targetUri = `${recordingsDir}/recording-${Date.now()}${extension}`;

    try {
      await FileSystem.moveAsync({
        from: originalUri,
        to: targetUri,
      });
      return targetUri;
    } catch (moveError) {
      logger.warn(
        "🎤 [AUDIO_SERVICE] Failed to persist recording, using original URI:",
        moveError,
      );
      return originalUri;
    }
  }

  private ensureAppStateSubscription() {
    if (this.appStateSubscription) {
      return;
    }
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange.bind(this),
    );
  }

  private async cleanupRecorder(): Promise<void> {
    if (!this.recorder) {
      return;
    }

    try {
      await this.recorder.stopAndUnloadAsync();
    } catch (error) {
      logger.warn("🎤 [AUDIO_SERVICE] Cleanup error while stopping recorder:", error);
    } finally {
      this.recorder = null;
    }
  }

  private handleAppStateChange(nextState: AppStateStatus) {
    this.appState = nextState;
    if (nextState !== "active" && this.state.isRecording) {
      logger.warn("🎤 [AUDIO_SERVICE] App moved to", nextState, "- stopping recording.");
      this.cancelRecording().catch((error) => {
        logger.error(
          "🎤 [AUDIO_SERVICE] Error stopping recording after app went background:",
          error,
        );
      });
      this.updateState({
        isRecording: false,
        isProcessing: false,
        error: "Ứng dụng chuyển nền nên ghi âm đã dừng, hãy thử lại khi mở ứng dụng.",
      });
    }
  }

  // Reset recorder completely
  async resetRecorder(): Promise<void> {
    try {
      logger.debug("🎤 [AUDIO_SERVICE] Resetting recorder...");

      // Stop and cleanup current recorder
      if (this.recorder) {
        try {
          await this.recorder.stopAndUnloadAsync();
        } catch (error) {
          logger.warn("🎤 [AUDIO_SERVICE] Error stopping recorder:", error);
        }
        this.recorder = null;
      }

      // Clear state
      this.updateState({
        isRecording: false,
        isProcessing: false,
        currentUri: null,
        error: null,
      });

      // Reset timestamps
      this.lastStartTimestamp = null;
      this.lastStopTimestamp = null;

      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      logger.debug("🎤 [AUDIO_SERVICE] Recorder reset complete");
    } catch (error) {
      logger.error("🎤 [AUDIO_SERVICE] Error resetting recorder:", error);
    }
  }

  // Start recording using expo-av (temporary until expo-audio is stable)
  async startRecording(): Promise<void> {
    try {
      if (this.state.isRecording || this.state.isProcessing) {
        logger.debug("🎤 [AUDIO_SERVICE] Recording already in progress, resetting first...");
        await this.resetRecorder();
      }

      if (this.appState !== "active") {
        const message =
          "Ứng dụng đang ở chế độ nền, không thể kích hoạt micro. Vui lòng mở lại ứng dụng để ghi âm.";
        logger.warn(
          "🎤 [AUDIO_SERVICE] startRecording blocked by inactive app state:",
          this.appState,
        );
        this.updateState({
          isRecording: false,
          isProcessing: false,
          error: message,
        });
        throw new Error(message);
      }

      logger.debug("🎤 [AUDIO_SERVICE] startRecording invoked");

      const aiConsented = await ensureAIConsent();
      if (!aiConsented) {
        throw new Error(
          "AI consent is required for speaking and pronunciation features that use voice analysis.",
        );
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Microphone permission denied");
      }

      logger.debug("🎤 [AUDIO_SERVICE] Microphone permission granted");

      this.ensureAppStateSubscription();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      logger.debug("🎤 [AUDIO_SERVICE] Audio mode configured");

      this.recorder = new Audio.Recording();
      await this.recorder.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await this.recorder.startAsync();

      this.lastStartTimestamp = Date.now();

      this.updateState({
        isRecording: true,
        isProcessing: false,
        error: null,
      });

      logger.debug("🎤 [AUDIO_SERVICE] Recording started with high-quality preset");
    } catch (error) {
      logger.error("Error starting recording:", error);
      this.cleanupRecorder2();
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

  private async cleanupRecorder2(): Promise<void> {
    if (!this.recorder) {
      return;
    }

    try {
      await this.recorder.stopAndUnloadAsync();
    } catch (error) {
      logger.warn("🎤 [AUDIO_SERVICE] Cleanup error while stopping recorder:", error);
    } finally {
      this.recorder = null;
    }
  }

  // Stop recording and transcribe
  async stopRecordingAndTranscribe(): Promise<RecordingResult> {
    try {
      if (!this.state.isRecording || !this.recorder) {
        throw new Error("No active recording to stop");
      }

      logger.debug("🎤 [AUDIO_SERVICE] stopRecording invoked");
      this.updateState({
        isRecording: false,
        isProcessing: true,
        error: null,
      });

      // Stop recording and get URI
      await this.recorder.stopAndUnloadAsync();
      this.lastStopTimestamp = Date.now();
      const recordingDuration = this.lastStartTimestamp
        ? this.lastStopTimestamp - this.lastStartTimestamp
        : null;
      if (recordingDuration != null) {
        logger.debug("🎤 [AUDIO_SERVICE] Recording duration(ms):", recordingDuration);
      }
      let uri = this.recorder.getURI();
      this.recorder = null;

      this.updateState({
        currentUri: uri,
      });

      if (!uri) {
        throw new Error("No recording URI available");
      }

      uri = await this.persistRecordingFile(uri);

      this.updateState({
        currentUri: uri,
      });

      // Transcribe audio using iFLYTEK service
      if (recordingDuration != null && recordingDuration < 800) {
        logger.warn(
          "🎤 [AUDIO_SERVICE] Recording was very short (<800ms). Waiting briefly before transcription.",
        );
      }

      // Ensure file is flushed to disk before uploading
      await new Promise((resolve) => setTimeout(resolve, 150));

      logger.debug("🎤 [AUDIO_SERVICE] Starting transcription...");
      logger.debug("  - URI:", uri);
      logger.debug("  - File exists check needed");

      // Test server availability before transcription
      logger.debug("🎤 [AUDIO_SERVICE] Testing server availability...");
      try {
        const serverAvailable = await testMarutekServer();
        logger.debug("🎤 [AUDIO_SERVICE] Server available:", serverAvailable);

        if (!serverAvailable) {
          logger.warn(
            "🎤 [AUDIO_SERVICE] Server test failed, but will still attempt transcription",
          );
        }
      } catch (serverTestError) {
        logger.warn("🎤 [AUDIO_SERVICE] Server test error:", serverTestError);
        logger.warn("🎤 [AUDIO_SERVICE] Will still attempt transcription");
      }

      // Validate audio file before transcription
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        logger.debug("🎤 [AUDIO_SERVICE] Audio file validation:");
        logger.debug("  - Exists:", fileInfo.exists);
        logger.debug("  - Is Directory:", fileInfo.isDirectory);

        if (!fileInfo.exists) {
          throw new Error("Audio file does not exist");
        }

        // Check file size if available
        if ("size" in fileInfo && fileInfo.size !== undefined) {
          logger.debug("  - Size:", fileInfo.size, "bytes");

          if (fileInfo.size === 0) {
            throw new Error("Audio file is empty");
          }

          if (fileInfo.size < 1000) {
            logger.warn(
              "🎤 [AUDIO_SERVICE] Warning: Audio file is very small (",
              fileInfo.size,
              "bytes)",
            );
            logger.warn("  - This might be too short for meaningful transcription");
            logger.warn("  - Consider recording for at least 2-3 seconds");
          }

          if (fileInfo.size > 10 * 1024 * 1024) {
            // 10MB
            logger.warn(
              "🎤 [AUDIO_SERVICE] Warning: Audio file is very large (",
              fileInfo.size,
              "bytes)",
            );
            logger.warn("  - This might cause timeout issues");
          }
        } else {
          logger.debug("  - Size: Not available");
        }
      } catch (fileError) {
        logger.error("🎤 [AUDIO_SERVICE] Audio file validation failed:", fileError);
        throw new Error(
          `Audio file validation failed: ${fileError instanceof Error ? fileError.message : "Unknown error"}`,
        );
      }

      try {
        // Determine content type based on file extension
        const isWav = uri.toLowerCase().includes(".wav");
        const isM4a = uri.toLowerCase().includes(".m4a");
        const contentType = isWav ? "audio/wav" : isM4a ? "audio/mp4" : "application/octet-stream";
        const filename = isWav ? "recording.wav" : isM4a ? "recording.m4a" : "recording.audio";

        logger.debug("🎤 [AUDIO_SERVICE] Transcription config:");
        logger.debug("  - Content Type:", contentType);
        logger.debug("  - Filename:", filename);
        logger.debug("  - Language: zh-CN");
        logger.debug("  - Endpoint:", MARUTEK_CONFIG.API_URL);

        try {
          const transcriptionResult = await withTimeout(
            transcribeAudioWithFallback(uri, {
              language: "zh-CN",
              endpoint: MARUTEK_CONFIG.API_URL,
              filename,
              contentType,
            }),
            TRANSCRIPTION_TIMEOUT_MS,
            TRANSCRIPTION_TIMEOUT_MESSAGE,
          );

          logger.debug("🎤 [AUDIO_SERVICE] Transcription result:");
          logger.debug("  - Success:", transcriptionResult.success);
          logger.debug("  - Transcription:", transcriptionResult.transcription);
          logger.debug("  - Confidence:", transcriptionResult.confidence);
          logger.debug("  - Word Count:", transcriptionResult.wordCount);
          logger.debug("  - Language Code:", transcriptionResult.languageCode);
          logger.debug("  - Request ID:", transcriptionResult.requestId);
          logger.debug("  - Timestamp:", transcriptionResult.timestamp);
          logger.debug("  - Full result:", JSON.stringify(transcriptionResult, null, 2));

          this.updateState({
            isProcessing: false,
          });

          return {
            text: transcriptionResult.transcription,
            accuracy: transcriptionResult.confidence,
            details: [],
          };
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
              "Máy chủ trả về bản chuyển lời trống — có thể bạn chưa gửi lên cái gì (im lặng, quá ngắn, hoặc mic không thu được).",
              "Hãy nói to, rõ và ghi ít nhất 2–3 giây rồi thử lại.",
            ];
          } else if (transcriptionError instanceof TranscriptionAggregateError) {
            const onlyEmptyResults =
              transcriptionError.errors.length > 0 &&
              transcriptionError.errors.every((e) => e instanceof EmptyTranscriptionError);
            if (onlyEmptyResults) {
              fallbackDetails.errorType = "empty";
              fallbackDetails.details = [
                "Máy chủ trả về bản chuyển lời trống — có thể bạn chưa gửi lên cái gì (không có lời trong bản ghi).",
                "Thử nói to, rõ và ghi ít nhất 2–3 giây; kiểm tra mic đã bật chưa.",
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
                "Đã gửi bản ghi nhưng không nhận được phản hồi trong thời gian cho phép.",
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
                  ? "Không nhận được lời nói — có thể bạn chưa gửi lên cái gì."
                  : transcriptionError instanceof Error &&
                      transcriptionError.message === TRANSCRIPTION_TIMEOUT_MESSAGE
                    ? "Hết thời gian chờ phản hồi từ máy chủ. Vui lòng thử lại."
                    : "Không thể gửi bản ghi âm đến máy chủ.",
          });

          return fallbackDetails;
        }
      } catch (transcribeError) {
        logger.error("🎤 [AUDIO_SERVICE] Transcription error:", transcribeError);
        logger.error("🎤 [AUDIO_SERVICE] Error details:", {
          message: transcribeError instanceof Error ? transcribeError.message : "Unknown error",
          stack: transcribeError instanceof Error ? transcribeError.stack : undefined,
          name: transcribeError instanceof Error ? transcribeError.name : undefined,
        });
        logger.warn("Marutek transcription failed, using fallback:", transcribeError);

        // Fallback: Return mock result when server is down
        this.updateState({
          isProcessing: false,
        });

        return {
          text: "",
          accuracy: undefined,
          errorType: "network",
          details: ["Không thể kết nối đến server Marutek.", "Ghi âm đã được lưu thành công."],
          troubleshooting: [
            "Vui lòng kiểm tra kết nối mạng và thử lại.",
            "Hoặc thử ghi âm lâu hơn (ít nhất 2-3 giây).",
          ],
        };
      }
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
      if (this.state.isRecording && this.recorder) {
        await this.recorder.stopAndUnloadAsync();
        this.recorder = null;
      }

      // Clear any cached audio files to prevent conflicts
      try {
        if (this.state.currentUri) {
          const fileInfo = await FileSystem.getInfoAsync(this.state.currentUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(this.state.currentUri, { idempotent: true });
            logger.debug("🎤 [AUDIO_SERVICE] Cleared previous audio file");
          }
        }
      } catch (cleanupError) {
        logger.warn("🎤 [AUDIO_SERVICE] Cleanup warning:", cleanupError);
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
    try {
      if (this.recorder) {
        await this.recorder.stopAndUnloadAsync();
        this.recorder = null;
      }

      this.updateState({
        isRecording: false,
        isProcessing: false,
        currentUri: null,
        error: null,
      });

      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
    } catch (error) {
      logger.error("Error during cleanup:", error);
    }
  }
}

// Export singleton instance
export const audioRecordingService = new AudioRecordingService();
