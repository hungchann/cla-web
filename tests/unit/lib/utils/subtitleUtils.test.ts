import { describe, it, expect } from "vitest";
import { timeToSeconds, secondsToTime, formatSubtitleText } from "@/lib/utils/subtitleUtils";

describe("timeToSeconds", () => {
  it("converts HH:MM:SS.mmm with dot separator", () => {
    expect(timeToSeconds("00:00:03.500")).toBeCloseTo(3.5);
  });

  it("converts HH:MM:SS,mmm with comma separator", () => {
    expect(timeToSeconds("00:00:03,500")).toBeCloseTo(3.5);
  });

  it("handles hours component", () => {
    expect(timeToSeconds("01:02:03.000")).toBeCloseTo(3723);
  });

  it("returns 0 for empty/invalid input", () => {
    expect(timeToSeconds("")).toBe(0);
    expect(timeToSeconds(null as unknown as string)).toBe(0);
    expect(timeToSeconds(undefined as unknown as string)).toBe(0);
    expect(timeToSeconds("garbage")).toBe(0);
    expect(timeToSeconds("01:02:03.abc")).toBe(0);
  });
});

describe("secondsToTime", () => {
  it("formats under an hour as MM:SS.mmm", () => {
    expect(secondsToTime(62.25)).toBe("01:02.250");
  });

  it("formats with hours as HH:MM:SS.mmm", () => {
    expect(secondsToTime(3723)).toBe("01:02:03.000");
  });

  it("pads single digits with zeros", () => {
    expect(secondsToTime(0)).toBe("00:00.000");
    expect(secondsToTime(9)).toBe("00:09.000");
  });
});

describe("formatSubtitleText", () => {
  it("joins chinese, pinyin (when enabled), and vietnamese", () => {
    const sub = {
      chinese: "你好",
      pinyin: "nǐ hǎo",
      vietnamese: "Xin chào",
    };
    expect(formatSubtitleText(sub, true)).toBe("你好\nnǐ hǎo\nXin chào");
  });

  it("omits pinyin when showPinyin is false", () => {
    const sub = { chinese: "你好", pinyin: "nǐ hǎo", vietnamese: "Xin chào" };
    expect(formatSubtitleText(sub)).toBe("你好\nXin chào");
  });

  it("handles missing fields gracefully", () => {
    expect(formatSubtitleText({ chinese: "你好" })).toBe("你好");
    expect(formatSubtitleText({})).toBe("");
  });
});
