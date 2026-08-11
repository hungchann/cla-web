import { describe, it, expect } from "vitest";
import {
  timeToSeconds,
  secondsToTime,
  formatSubtitleText,
  getCurrentSubtitle,
  getCurrentSubtitleIndex,
} from "@/lib/utils/subtitleUtils";

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

describe("getCurrentSubtitle", () => {
  const subs = [
    { start: "00:00:01,000", end: "00:00:04,000", chinese: "你好" },
    { start: "00:00:05,000", end: "00:00:08,000", chinese: "谢谢" },
  ];

  it("returns subtitle containing current time", () => {
    expect(getCurrentSubtitle(subs, 3)).toEqual(subs[0]);
    expect(getCurrentSubtitle(subs, 7)).toEqual(subs[1]);
  });

  it("matches boundary at start time", () => {
    expect(getCurrentSubtitle(subs, 1)).toEqual(subs[0]);
    expect(getCurrentSubtitle(subs, 5)).toEqual(subs[1]);
  });

  it("returns null when no subtitle matches", () => {
    expect(getCurrentSubtitle(subs, 0)).toBeNull();
    expect(getCurrentSubtitle(subs, 4.5)).toBeNull();
    expect(getCurrentSubtitle(subs, 100)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(getCurrentSubtitle([], 3)).toBeNull();
    expect(getCurrentSubtitle(null as unknown as unknown[], 3)).toBeNull();
  });

  it("skips subtitles with missing start/end", () => {
    const bad = [{ start: "", end: "00:00:04,000", chinese: "x" }, ...subs];
    expect(getCurrentSubtitle(bad, 3)).toEqual(subs[0]);
  });
});

describe("getCurrentSubtitleIndex", () => {
  const subs = [
    { start: "00:00:01,000", end: "00:00:04,000", chinese: "你好" },
    { start: "00:00:05,000", end: "00:00:08,000", chinese: "谢谢" },
  ];

  it("returns matching index", () => {
    expect(getCurrentSubtitleIndex(subs, 3)).toBe(0);
    expect(getCurrentSubtitleIndex(subs, 7)).toBe(1);
  });

  it("returns null when no match", () => {
    expect(getCurrentSubtitleIndex(subs, 0)).toBeNull();
    expect(getCurrentSubtitleIndex([], 3)).toBeNull();
  });
});
