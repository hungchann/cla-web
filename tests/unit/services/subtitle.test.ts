import { describe, it, expect } from "vitest";
import { parseSRTtoArray } from "@/services/subtitle";

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,000
你好
nǐ hǎo
Xin chào

2
00:00:05,000 --> 00:00:08,000
谢谢
Cảm ơn`;

describe("parseSRTtoArray", () => {
  it("parses bilingual subtitle blocks", () => {
    const result = parseSRTtoArray(SAMPLE_SRT);
    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      id: 1,
      start: "00:00:01,000",
      end: "00:00:04,000",
      chinese: "你好",
      pinyin: "nǐ hǎo",
      vietnamese: "Xin chào",
      rawText: "你好\nnǐ hǎo\nXin chào",
    });
    expect(result[1].chinese).toBe("谢谢");
    expect(result[1].vietnamese).toBe("Cảm ơn");
    expect(result[1].rawText).toBe("谢谢\nCảm ơn");
  });

  it("handles CRLF line endings", () => {
    const crlf = SAMPLE_SRT.replaceAll("\n", "\r\n");
    expect(parseSRTtoArray(crlf)).toHaveLength(2);
  });

  it("treats 2-line block as chinese + vietnamese (no pinyin)", () => {
    const result = parseSRTtoArray(
      `1
00:00:01,000 --> 00:00:04,000
你好
Xin chào`,
    );
    expect(result[0]).toEqual({
      id: 1,
      start: "00:00:01,000",
      end: "00:00:04,000",
      chinese: "你好",
      vietnamese: "Xin chào",
      pinyin: undefined,
      rawText: "你好\nXin chào",
    });
  });

  it("returns empty array for empty input", () => {
    expect(parseSRTtoArray("")).toEqual([]);
    expect(parseSRTtoArray(null as unknown as string)).toEqual([]);
    expect(parseSRTtoArray(undefined as unknown as string)).toEqual([]);
  });

  it("skips blocks without a numeric id", () => {
    const result = parseSRTtoArray(
      `BOGUS
00:00:01,000 --> 00:00:04,000
你好`,
    );
    expect(result).toHaveLength(0);
  });

  it("skips blocks without a time line", () => {
    const result = parseSRTtoArray(
      `1
hello there
你好`,
    );
    expect(result).toHaveLength(0);
  });
});
