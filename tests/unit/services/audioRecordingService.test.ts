import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { audioRecordingService } from "@/services/audioRecordingService";
import { registerAIConsentPrompt, unregisterAIConsentPrompt } from "@/services/aiConsentGate";
import { acceptAIConsent } from "@/lib/ai/aiConsentStorage";

describe("audioRecordingService — state & subscription", () => {
  beforeEach(() => {
    localStorage.clear();
    unregisterAIConsentPrompt();
  });

  afterEach(() => {
    localStorage.clear();
    unregisterAIConsentPrompt();
    vi.restoreAllMocks();
    return audioRecordingService.cleanup();
  });

  it("starts in idle state", () => {
    expect(audioRecordingService.getState()).toEqual({
      isRecording: false,
      isProcessing: false,
      currentUri: null,
      error: null,
    });
  });

  it("notifies subscribers on state change", async () => {
    const listener = vi.fn();
    const unsubscribe = audioRecordingService.subscribe(listener);

    try {
      await audioRecordingService.startRecording();
    } catch {
      // ghi âm fail trong môi trường test — listener vẫn được gọi với state error
    }

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("unsubscribe removes listener", async () => {
    const listener = vi.fn();
    const unsubscribe = audioRecordingService.subscribe(listener);
    unsubscribe();

    try {
      await audioRecordingService.startRecording();
    } catch {
      // ignore
    }

    expect(listener).not.toHaveBeenCalled();
  });

  it("startRecording throws when recording unsupported (no navigator.mediaDevices)", async () => {
    await expect(audioRecordingService.startRecording()).rejects.toThrow(
      "Ghi âm không được hỗ trợ trên môi trường này.",
    );
  });

  it("startRecording requires AI consent", async () => {
    // Mock mediaDevices để vượt qua check đầu, nhưng chặn ở consent
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
      configurable: true,
    });
    registerAIConsentPrompt(() => Promise.resolve(false));

    await expect(audioRecordingService.startRecording()).rejects.toThrow(/AI consent/i);
  });

  it("cancelRecording returns to idle state", async () => {
    await audioRecordingService.cancelRecording();
    expect(audioRecordingService.getState().isRecording).toBe(false);
    expect(audioRecordingService.getState().isProcessing).toBe(false);
    expect(audioRecordingService.getState().error).toBeNull();
  });

  it("stopRecordingAndTranscribe throws when no active recording", async () => {
    await expect(audioRecordingService.stopRecordingAndTranscribe()).rejects.toThrow(
      "No active recording to stop",
    );
  });
});

describe("audioRecordingService — with consent", () => {
  beforeEach(async () => {
    localStorage.clear();
    await acceptAIConsent();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    return audioRecordingService.cleanup();
  });

  it("starts recording and sets isRecording true", async () => {
    const track = { stop: vi.fn() };
    const mockRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      state: "inactive",
      mimeType: "audio/webm",
      ondataavailable: null,
    };
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }),
      },
      configurable: true,
    });
    const MockMediaRecorder = function () {
      return mockRecorder;
    } as unknown as typeof MediaRecorder;
    (MockMediaRecorder as unknown as { isTypeSupported: () => boolean }).isTypeSupported = () => true;
    Object.defineProperty(globalThis, "MediaRecorder", {
      value: MockMediaRecorder,
      configurable: true,
    });

    await audioRecordingService.startRecording();

    expect(audioRecordingService.getState().isRecording).toBe(true);
    expect(mockRecorder.start).toHaveBeenCalled();
  });
});
