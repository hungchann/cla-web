import { describe, it, expect } from "vitest";
import { splitPinyinSyllables } from "@/lib/utils/pinyinSplit";

describe("splitPinyinSyllables", () => {
  it("tách pinyin từng chữ theo dấu thanh", () => {
    expect(splitPinyinSyllables("hěnjiǔyǐqián", 4)).toEqual(["hěn", "jiǔ", "yǐ", "qián"]);
    expect(splitPinyinSyllables("zhōngyuán", 2)).toEqual(["zhōng", "yuán"]);
    expect(splitPinyinSyllables("zhōngyuàn", 2)).toEqual(["zhōng", "yuàn"]);
    expect(splitPinyinSyllables("chuíxián", 2)).toEqual(["chuí", "xián"]);
    expect(splitPinyinSyllables("guǎngmào", 2)).toEqual(["guǎng", "mào"]);
    expect(splitPinyinSyllables("běifāng", 2)).toEqual(["běi", "fāng"]);
    expect(splitPinyinSyllables("tǔdì", 2)).toEqual(["tǔ", "dì"]);
    expect(splitPinyinSyllables("féiwò", 2)).toEqual(["féi", "wò"]);
  });

  it("giữ âm tiết trung tính ở cuối và giữa từ", () => {
    expect(splitPinyinSyllables("gūniang", 2)).toEqual(["gū", "niang"]);
    expect(splitPinyinSyllables("māma", 2)).toEqual(["mā", "ma"]);
    expect(splitPinyinSyllables("xīān", 2)).toEqual(["xī", "ān"]);
    expect(splitPinyinSyllables("zěnmeyàng", 3)).toEqual(["zěn", "me", "yàng"]);
    expect(splitPinyinSyllables("péngyou", 2)).toEqual(["péng", "you"]);
    expect(splitPinyinSyllables("bùyīhuìer", 4)).toEqual(["bù", "yī", "huì", "er"]);
    expect(splitPinyinSyllables("nàhuìer", 3)).toEqual(["nà", "huì", "er"]);
  });

  it("nhận pinyin đã cách khoảng trắng", () => {
    expect(splitPinyinSyllables("hěn jiǔ yǐ qián", 4)).toEqual(["hěn", "jiǔ", "yǐ", "qián"]);
  });

  it("trả null để hiển thị pinyin gộp khi không tách được", () => {
    expect(splitPinyinSyllables("wǒmende", 3)).toBeNull();
    expect(splitPinyinSyllables("de", 1)).toBeNull();
    expect(splitPinyinSyllables("ma", 2)).toBeNull();
    expect(splitPinyinSyllables("，", 1)).toBeNull();
    expect(splitPinyinSyllables("", 2)).toBeNull();
    expect(splitPinyinSyllables("zhōngyuán", 3)).toBeNull();
  });
});
