import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import * as bilingualApi from "@/api/bilingual";

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

vi.mock("@/lib/utils/youtubeVideo", () => ({
  videoDataUsesYoutubePlayer: vi.fn(() => false),
}));

function makeVideoElement(currentTime: number) {
  const el: any = {
    readyState: 4,
    currentTime,
    paused: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return el;
}

describe("useDetailedVideoLogic — flowMode switching", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("activates question after switching flowMode from subtitles to quiz", async () => {
    vi.mocked(bilingualApi.bilingualApi.getExerciseById).mockResolvedValue({
      exercises: [
        { id: 1, question: "Q1", time_start: "00:00:01,000", time_end: "00:00:05,000" },
      ],
    });
    const videoRef = { current: makeVideoElement(10) };

    const { result, rerender } = renderHook(
      ({ mode }: { mode: "subtitles" | "quiz" | "both" }) =>
        useDetailedVideoLogic(
          { id: "v1", video_file: { filename_disk: "clip.mp4" } },
          { videoRef, flowMode: mode },
        ),
      { initialProps: { mode: "subtitles" as "subtitles" | "quiz" | "both" } },
    );

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());

    await new Promise((r) => setTimeout(r, 800));
    expect(result.current.activeQuestion).toBeNull();

    rerender({ mode: "quiz" });

    await waitFor(
      () => expect(result.current.activeQuestion).not.toBeNull(),
      { timeout: 3000 },
    );
    expect(result.current.activeQuestion?.id).toBe(1);
  });

  it("clears active question when switching from quiz mode back to subtitles mode", async () => {
    vi.mocked(bilingualApi.bilingualApi.getExerciseById).mockResolvedValue({
      exercises: [
        { id: 1, question: "Q1", time_start: "00:00:01,000", time_end: "00:00:05,000" },
      ],
    });
    const videoRef = { current: makeVideoElement(10) };

    const { result, rerender } = renderHook(
      ({ mode }: { mode: "subtitles" | "quiz" | "both" }) =>
        useDetailedVideoLogic(
          { id: "v1", video_file: { filename_disk: "clip.mp4" } },
          { videoRef, flowMode: mode },
        ),
      { initialProps: { mode: "quiz" as "subtitles" | "quiz" | "both" } },
    );

    await waitFor(() => expect(result.current.activeQuestion?.id).toBe(1), { timeout: 3000 });

    rerender({ mode: "subtitles" });

    await waitFor(() => expect(result.current.activeQuestion).toBeNull(), { timeout: 1000 });
  });
});
