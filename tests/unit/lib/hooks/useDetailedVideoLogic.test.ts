import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import * as bilingualApi from "@/api/bilingual";
import * as youtubeUtils from "@/lib/utils/youtubeVideo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/api/bilingual", async (importOriginal) => {
  const actual = await importOriginal<typeof bilingualApi>();
  return {
    ...actual,
    bilingualApi: {
      ...actual.bilingualApi,
      getExerciseById: vi.fn(),
      submitExercise: vi.fn(),
    },
  };
});

vi.mock("@/lib/utils/youtubeVideo", async (importOriginal) => {
  const actual = await importOriginal<typeof youtubeUtils>();
  return {
    ...actual,
    videoDataUsesYoutubePlayer: vi.fn(() => false),
  };
});

describe("useDetailedVideoLogic — videoSource", () => {
  it("builds asset URL from video_file.filename_disk", () => {
    const { result } = renderHook(() =>
      useDetailedVideoLogic({ id: "v1", video_file: { filename_disk: "clip-1.mp4" } }),
    );
    expect(result.current.videoSource).toBe("https://marutek.space/assets/clip-1.mp4");
  });

  it("returns empty videoSource when no video_file", () => {
    const { result } = renderHook(() => useDetailedVideoLogic({ id: "v1" }));
    expect(result.current.videoSource).toBe("");
  });
});

describe("useDetailedVideoLogic — exercises", () => {
  beforeEach(() => {
    vi.mocked(bilingualApi.bilingualApi.getExerciseById).mockResolvedValue({
      exercises: [
        { id: 1, question: "Q1", time_start: "00:00:01", time_end: "00:00:03" },
        { id: 2, question: "Q2", time_start: "00:00:02", time_end: "00:00:05" },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sorts exercises by time_end", async () => {
    const { result } = renderHook(() => useDetailedVideoLogic({ id: "v1" }));

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());
    expect(result.current.exerciseData!.map((e) => e.id)).toEqual([1, 2]);
    expect(bilingualApi.bilingualApi.getExerciseById).toHaveBeenCalledWith("v1");
  });
});

describe("useDetailedVideoLogic — subtitle loading", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and sorts subtitles from SRT", async () => {
    const srt = `1
00:00:03,000 --> 00:00:05,000
你好
Xin chào

2
00:00:01,000 --> 00:00:02,000
你好
Xin chào`;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ text: () => Promise.resolve(srt) }),
    );

    const { result } = renderHook(() =>
      useDetailedVideoLogic({
        id: "v1",
        srt_file: { filename_disk: "subs-1.srt" },
      }),
    );

    await waitFor(() => expect(result.current.subtitles).toHaveLength(2));
    // Sorted theo time start: 1s trước 3s
    expect(result.current.subtitles[0].start).toBe("00:00:01,000");
    expect(result.current.subtitles[1].start).toBe("00:00:03,000");
    vi.unstubAllGlobals();
  });

  it("sets empty subtitles on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const { result } = renderHook(() =>
      useDetailedVideoLogic({ id: "v1", srt_file: { filename_disk: "subs-1.srt" } }),
    );

    await waitFor(() => expect(result.current.subtitles).toEqual([]));
    vi.unstubAllGlobals();
  });
});
