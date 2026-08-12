import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { speakChinese, stopSpeech } from "@/lib/utils/speech";

interface MockUtterance {
  lang: string;
  voice: MockVoice | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

interface MockVoice {
  lang: string;
  name: string;
}

function mockSpeechSynthesis(autoEnd = true) {
  const utteranceInstances: MockUtterance[] = [];
  const speechSynthesis = {
    cancel: vi.fn(),
    speak: vi.fn((u: MockUtterance) => {
      utteranceInstances.push(u);
      if (autoEnd) {
        // Kích hoạt onend ngay để promise resolve
        queueMicrotask(() => u.onend?.());
      }
    }),
    getVoices: vi.fn((): MockVoice[] => []),
  };
  Object.defineProperty(globalThis, "speechSynthesis", {
    value: speechSynthesis,
    configurable: true,
  });
  return { speechSynthesis, utteranceInstances };
}

describe("speakChinese", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      value: class {
        lang = "";
        voice: unknown = null;
        onend: (() => void) | null = null;
        onerror: ((e: { error: string }) => void) | null = null;
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when speechSynthesis unavailable", async () => {
    Object.defineProperty(globalThis, "speechSynthesis", {
      value: undefined,
      configurable: true,
    });
    await expect(speakChinese("你好")).resolves.toBeUndefined();
  });

  it("cancels existing speech before speaking", async () => {
    const { speechSynthesis } = mockSpeechSynthesis();
    await speakChinese("你好");
    expect(speechSynthesis.cancel).toHaveBeenCalled();
  });

  it("sets Chinese language on utterance", async () => {
    mockSpeechSynthesis();
    await speakChinese("你好");
    expect(globalThis.SpeechSynthesisUtterance).toBeDefined();
  });

  it("resolves when speech ends", async () => {
    const { utteranceInstances } = mockSpeechSynthesis(false);
    let resolved = false;
    const promise = speakChinese("你好").then(() => {
      resolved = true;
    });
    utteranceInstances[0].onend?.();
    await promise;
    expect(resolved).toBe(true);
  });

  it("resolves on error other than interrupted", async () => {
    const { utteranceInstances } = mockSpeechSynthesis(false);
    let resolved = false;
    const promise = speakChinese("你好").then(() => {
      resolved = true;
    });
    utteranceInstances[0].onerror?.({ error: "not-allowed" });
    await promise;
    expect(resolved).toBe(true);
  });

  it("uses a Chinese voice when available", async () => {
    const { speechSynthesis, utteranceInstances } = mockSpeechSynthesis();
    speechSynthesis.getVoices.mockReturnValue([
      { lang: "en-US", name: "Alex" },
      { lang: "zh-CN", name: "Ting-Ting" },
    ]);
    await speakChinese("你好");
    expect(utteranceInstances[0].voice).toEqual({ lang: "zh-CN", name: "Ting-Ting" });
  });
});

describe("stopSpeech", () => {
  it("cancels speech synthesis", async () => {
    const { speechSynthesis } = mockSpeechSynthesis();
    await stopSpeech();
    expect(speechSynthesis.cancel).toHaveBeenCalled();
  });

  it("does nothing when unavailable", async () => {
    Object.defineProperty(globalThis, "speechSynthesis", {
      value: undefined,
      configurable: true,
    });
    await expect(stopSpeech()).resolves.toBeUndefined();
  });
});
