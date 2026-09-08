import { describe, it, expect } from "vitest";
import { buildQuizQuestion, seededShuffle, QUIZ_PROMPT, type QuizVocab } from "@/lib/utils/quiz-generator";

const DECK: QuizVocab[] = [
  { word: "学习", pinyin: "xuéxí", meaning: "Học tập" },
  { word: "漂亮", pinyin: "piàoliang", meaning: "Xinh đẹp" },
  { word: "苹果", pinyin: "píngguǒ", meaning: "Quả táo" },
  { word: "是", pinyin: "shì", meaning: "Là" },
  { word: "爱", pinyin: "ài", meaning: "Yêu" },
];

describe("buildQuizQuestion — listen & pick the 汉字", () => {
  it("always asks the audio prompt and marks exactly one correct option", () => {
    const q = buildQuizQuestion(DECK[0], DECK);
    expect(q.hasAnswer).toBe(true);
    expect(q.prompt).toBe(QUIZ_PROMPT);
    expect(q.options).toHaveLength(4);
    expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(q.options.find((o) => o.isCorrect)?.label).toBe("学习");
  });

  it("options are Chinese characters (no pinyin/meaning labels)", () => {
    const q = buildQuizQuestion(DECK[0], DECK);
    for (const opt of q.options) {
      expect(opt.label).toMatch(/[\u4e00-\u9fff]/);
      expect(opt.label).not.toMatch(/xuéxí|Học tập|piàoliang/i);
    }
  });

  it("uses other deck words as distractors when the pool is rich", () => {
    const q = buildQuizQuestion(DECK[0], DECK);
    const labels = q.options.map((o) => o.label);
    // 学习 correct + các chữ khác trong deck xuất hiện trước fallback
    expect(labels.filter((l) => ["漂亮", "苹果", "爱", "是"].includes(l)).length).toBeGreaterThanOrEqual(2);
  });

  it("fills with fallback chars when the deck is thin", () => {
    const thin = [{ word: "茶" }];
    const q = buildQuizQuestion(thin[0], thin);
    expect(q.hasAnswer).toBe(true);
    expect(q.options).toHaveLength(4);
    expect(q.options.find((o) => o.isCorrect)?.label).toBe("茶");
  });

  it("handles one-char words that collide with fallback chars", () => {
    const single = [{ word: "是" }];
    const q = buildQuizQuestion(single[0], single);
    expect(q.hasAnswer).toBe(true);
    expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("never duplicates the correct label among distractors", () => {
    for (const card of DECK) {
      const q = buildQuizQuestion(card, DECK);
      const labels = q.options.map((o) => o.label);
      expect(new Set(labels).size).toBe(4);
    }
  });

  it("is deterministic for the same card + deck", () => {
    const a = buildQuizQuestion(DECK[0], DECK);
    const b = buildQuizQuestion(DECK[0], DECK);
    expect(a.options).toEqual(b.options);
  });

  it("hasAnswer=false only when the word itself is missing", () => {
    const empty = [{ word: "", meaning: "Học tập" }] as QuizVocab[];
    const q = buildQuizQuestion(empty[0], empty);
    expect(q.hasAnswer).toBe(false);
    expect(q.options).toHaveLength(0);
  });
});

describe("seededShuffle", () => {
  it("is deterministic for same seed", () => {
    expect(seededShuffle([1, 2, 3, 4, 5], "seed-a")).toEqual(seededShuffle([1, 2, 3, 4, 5], "seed-a"));
  });

  it("keeps all elements", () => {
    expect([...seededShuffle(["a", "b", "c", "d"], "s")].sort()).toEqual(["a", "b", "c", "d"]);
  });
});
