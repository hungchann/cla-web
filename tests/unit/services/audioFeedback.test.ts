import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  playAnswerFeedback,
  playQuizResultSound,
  playTranslationResultSound,
  cleanupAudio,
} from "@/services/audioFeedback";

const playedPaths: string[] = [];

class MockAudio {
  src: string;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  constructor(src: string) {
    this.src = src;
    playedPaths.push(src);
  }
}

describe("audioFeedback", () => {
  beforeEach(() => {
    playedPaths.length = 0;
    Object.defineProperty(globalThis.window, "Audio", {
      value: MockAudio,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanupAudio();
    vi.restoreAllMocks();
  });

  it("plays correct sound when answer is correct", async () => {
    await playAnswerFeedback(true);
    expect(playedPaths).toContain("/sound/correct_TracNghiem.wav");
  });

  it("plays incorrect sound when answer is wrong", async () => {
    await playAnswerFeedback(false);
    expect(playedPaths).toContain("/sound/wrong_TracNghiem.wav");
  });

  it("maps translation score < 50 to under-50 sound", async () => {
    await playTranslationResultSound(30);
    expect(playedPaths).toContain("/sound/correct_up_50_.mp3");
  });

  it("maps translation score 50-79 to 50-70 sound", async () => {
    await playTranslationResultSound(60);
    expect(playedPaths).toContain("/sound/correct_50-70_.mp3");
  });

  it("maps translation score 80-89 to 80-90 sound", async () => {
    await playTranslationResultSound(85);
    expect(playedPaths).toContain("/sound/correct_80-90_.mp3");
  });

  it("maps translation score >= 90 to over-90 sound", async () => {
    await playTranslationResultSound(95);
    expect(playedPaths).toContain("/sound/correct_up_90_.mp3");
  });

  it("quiz result sound respects score threshold (low score)", async () => {
    await playQuizResultSound(20);
    expect(playedPaths).toContain("/sound/correct_up_50_.mp3");
  });

  it("quiz result sound respects score threshold (high score)", async () => {
    await playQuizResultSound(95);
    expect(playedPaths).toContain("/sound/correct_up_90_.mp3");
  });
});
