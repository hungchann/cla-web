import { describe, it, expect } from "vitest";
import { compareTexts, compareTextsAdvanced } from "@/services/textComparisonService";

describe("compareTexts (basic)", () => {
  it("returns 100% accuracy for identical texts", () => {
    const r = compareTexts("你好世界", "你好世界");
    expect(r.accuracy).toBe(100);
    expect(r.correctWords).toEqual(["你", "好", "世", "界"]);
  });

  it("detects missing words", () => {
    const r = compareTexts("你好世界", "你好");
    expect(r.accuracy).toBe(50);
    expect(r.missingWords).toEqual(["世", "界"]);
  });

  it("detects extra words", () => {
    const r = compareTexts("你好", "你好朋友");
    expect(r.extraWords).toEqual(["朋", "友"]);
  });

  it("ignores punctuation and whitespace", () => {
    const r = compareTexts("你好，世界。", "你好世界");
    expect(r.accuracy).toBe(100);
  });
});

describe("compareTextsAdvanced", () => {
  it("returns 100% accuracy for identical texts", () => {
    const r = compareTextsAdvanced("你好世界", "你好世界");
    expect(r.accuracy).toBe(100);
    expect(r.correctWords).toEqual(["你", "好", "世", "界"]);
  });

  it("marks shifted matches correctly when user omits a leading word", () => {
    // User bỏ sót chữ "a" đầu → "b c" khớp "b c" nhưng bị lệch index
    const r = compareTextsAdvanced("abc", "bc");

    expect(r.correctWords).toEqual(["b", "c"]);
    expect(r.missingWords).toEqual(["a"]);
    expect(r.extraWords).toEqual([]);
    expect(r.accuracy).toBe(66.67);

    // wordDetails phải đánh dấu b, c là correct dù index dịch
    const details = r.wordDetails!;
    expect(details.find((d) => d.word === "b")).toMatchObject({ isCorrect: true, isMissing: false });
    expect(details.find((d) => d.word === "c")).toMatchObject({ isCorrect: true, isMissing: false });
    // Từ bị thiếu được báo qua missingWords (không có slot trong wordDetails theo index)
    expect(r.missingWords).toEqual(["a"]);
  });

  it("marks matches correctly when words are transposed", () => {
    const r = compareTextsAdvanced("你好", "好你");

    expect(r.correctWords).toEqual(["好"]);
    // Cả hai từ vẫn là substitution/incorrect, không phải extra
    expect(r.extraWords).toEqual([]);
  });

  it("gives partial credit for substitutions", () => {
    const r = compareTextsAdvanced("你好世界", "你坏世界");
    expect(r.accuracy).toBe(87.5); // 3 correct + 1 substitution*0.5 = 3.5/4
  });
});
