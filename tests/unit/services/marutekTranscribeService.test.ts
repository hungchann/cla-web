import { describe, it, expect } from "vitest";
import { compareTexts } from "@/services/marutekTranscribeService";

describe("compareTexts", () => {
  it("returns 100% accuracy for identical texts", () => {
    const result = compareTexts("你好 世界", "你好 世界");
    expect(result.accuracy).toBe(100);
    expect(result.correctWords).toEqual(["你好", "世界"]);
    expect(result.incorrectWords).toEqual([]);
  });

  it("detects incorrect words correctly", () => {
    const result = compareTexts("你好 世界", "你好 朋友");
    expect(result.correctWords).toEqual(["你好"]);
    expect(result.incorrectWords).toEqual(["世界"]);
    expect(result.details).toContainEqual({
      word: "朋友",
      isCorrect: false,
      userInput: "世界",
      expectedText: "朋友",
    });
  });

  it("handles empty transcribed text", () => {
    const result = compareTexts("", "你好 世界");
    expect(result.accuracy).toBe(0);
    expect(result.correctWords).toEqual([]);
  });

  it("handles Chinese characters correctly (no lowercasing)", () => {
    // Chinese has no case; verify case-sensitive behavior is preserved
    const result = compareTexts("Hello", "hello");
    expect(result.accuracy).toBe(0);
  });

  it("drops extra words from transcribed text (no expected counterpart)", () => {
    const result = compareTexts("你好 世界 今天", "你好 世界");
    // 2 correct of max(3,2)=3 words
    expect(result.accuracy).toBe(66.67);
    expect(result.correctWords).toEqual(["你好", "世界"]);
    expect(result.incorrectWords).toEqual([]);
  });

  it("handles missing words in transcribed text", () => {
    const result = compareTexts("你好", "你好 世界");
    expect(result.accuracy).toBe(50);
    expect(result.correctWords).toEqual(["你好"]);
  });

  it("rounds accuracy to 2 decimal places", () => {
    const result = compareTexts("a b", "a c d");
    // 1 correct of max(2,3)=3 words → 33.33
    expect(result.accuracy).toBe(33.33);
  });
});
