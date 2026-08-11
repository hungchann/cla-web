import { describe, it, expect } from "vitest";
import { VocabularyMapper } from "@/lib/mappers/vocabularyMapper";

describe("VocabularyMapper.fromDictionary", () => {
  it("maps senses and examples correctly", () => {
    const result = VocabularyMapper.fromDictionary(
      {
        id: "v-1",
        word: "你好",
        pinyin: "nǐ hǎo",
        senses: [
          {
            id: "s-1",
            pos_label: "叹词",
            meaning_vi: "Xin chào",
            examples: [{ chinese: "你好！", pinyin: "nǐ hǎo!", p_vi: "Xin chào!" }],
          },
        ],
      },
      "HSK 1",
      "Giao tiếp",
    );

    expect(result.id).toBe("v-1");
    expect(result.levelName).toBe("HSK 1");
    expect(result.topicName).toBe("Giao tiếp");
    expect(result.senses[0]).toEqual({
      id: "s-1",
      pos_label: "叹词",
      meaning: "Xin chào",
      examples: [
        { id: "s-1-0", chinese: "你好！", pinyin: "nǐ hǎo!", vietnamese: "Xin chào!" },
      ],
    });
  });

  it("falls back to s.meaning when meaning_vi missing", () => {
    const result = VocabularyMapper.fromDictionary({
      id: "v-1",
      word: "爱",
      senses: [{ id: "s-1", meaning: "love" }],
    });
    expect(result.senses[0].meaning).toBe("love");
  });

  it("returns null for empty response", () => {
    expect(VocabularyMapper.fromDictionary(null)).toBeNull();
  });

  it("handles missing senses as empty array", () => {
    const result = VocabularyMapper.fromDictionary({ id: "v-1", word: "好" });
    expect(result.senses).toEqual([]);
  });

  it("handles missing examples as empty array", () => {
    const result = VocabularyMapper.fromDictionary({
      id: "v-1",
      word: "好",
      senses: [{ id: "s-1", meaning_vi: "Tốt" }],
    });
    expect(result.senses[0].examples).toEqual([]);
  });
});

describe("VocabularyMapper.fromBilingual", () => {
  it("maps from meanings array", () => {
    const result = VocabularyMapper.fromBilingual({
      id: "b-1",
      word: "老师",
      pinyin: "lǎo shī",
      meanings: [
        {
          id: "m-1",
          pos_label: "名词",
          meaning: "Thầy giáo",
          examples: [{ id: "e-1", chinese: "老师好", pinyin: "lǎo shī hǎo", vietnamese: "Chào thầy" }],
        },
      ],
    });

    expect(result.word).toBe("老师");
    expect(result.senses[0].meaning).toBe("Thầy giáo");
    expect(result.senses[0].examples[0]).toEqual({
      id: "e-1",
      chinese: "老师好",
      pinyin: "lǎo shī hǎo",
      vietnamese: "Chào thầy",
    });
  });

  it("prefers p_vi fallback when vietnamese missing", () => {
    const result = VocabularyMapper.fromBilingual({
      id: "b-1",
      word: "水",
      meanings: [
        {
          id: "m-1",
          meaning_vi: "Nước",
          examples: [{ id: "e-1", chinese: "水", p_vi: "Nước" }],
        },
      ],
    });
    expect(result.senses[0].examples[0].vietnamese).toBe("Nước");
  });

  it("returns null for empty data", () => {
    expect(VocabularyMapper.fromBilingual(null)).toBeNull();
  });
});
