import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubtitleSync } from "@/lib/hooks/useSubtitleSync";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";
import { SubtitleEntry } from "@/lib/types/subtitle";

const subtitles: SubtitleEntry[] = [
  { id: 1, start: "00:00:01,000", end: "00:00:04,000", chinese: "你好", vietnamese: "Xin chào" },
  { id: 2, start: "00:00:05,000", end: "00:00:08,000", chinese: "谢谢", vietnamese: "Cảm ơn" },
  { id: 3, start: "00:00:10,000", end: "00:00:12,000", chinese: "再见", vietnamese: "Tạm biệt" },
];

describe("useSubtitleSync.binarySearchSubtitle", () => {
  it("finds subtitle at exact time", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles, timeToSeconds, leadTimeSeconds: 0 }),
    );

    expect(result.current.binarySearchSubtitle(3)).toBe(0);
    expect(result.current.binarySearchSubtitle(7)).toBe(1);
    expect(result.current.binarySearchSubtitle(11)).toBe(2);
  });

  it("returns null before first subtitle", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles, timeToSeconds, leadTimeSeconds: 0 }),
    );
    expect(result.current.binarySearchSubtitle(0)).toBeNull();
  });

  it("returns null after last subtitle", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles, timeToSeconds, leadTimeSeconds: 0 }),
    );
    expect(result.current.binarySearchSubtitle(13)).toBeNull();
  });

  it("returns null in gaps between subtitles", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles, timeToSeconds, leadTimeSeconds: 0 }),
    );
    expect(result.current.binarySearchSubtitle(4.5)).toBeNull();
    expect(result.current.binarySearchSubtitle(9)).toBeNull();
  });

  it("uses lookahead to match upcoming subtitle", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles, timeToSeconds, leadTimeSeconds: 0 }),
    );
    // 4.5 + 0.6 lookahead = 5.1 → nằm trong subtitle 2
    expect(result.current.binarySearchSubtitle(4.5, 0.6)).toBe(1);
  });

  it("handles empty subtitles", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles: [], timeToSeconds, leadTimeSeconds: 0 }),
    );
    expect(result.current.binarySearchSubtitle(5)).toBeNull();
  });
});

describe("useSubtitleSync.computeActiveIndex", () => {
  it("updates activeIndex state", () => {
    const { result } = renderHook(() =>
      useSubtitleSync({ subtitles, timeToSeconds, leadTimeSeconds: 0 }),
    );

    act(() => {
      result.current.computeActiveIndex(7);
    });

    expect(result.current.activeIndex).toBe(1);
  });
});
