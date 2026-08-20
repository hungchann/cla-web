import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
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

// Fake video element: currentTime mutable, readyState đủ để hook coi là ready.
function makeVideoElement(initialTime = 0) {
  const el: any = {
    readyState: 4,
    currentTime: initialTime,
    paused: true,
    play: vi.fn().mockImplementation(() => {
      el.paused = false;
      return Promise.resolve();
    }),
    pause: vi.fn().mockImplementation(() => {
      el.paused = true;
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return el;
}

const MOCK_EXERCISES = [
  { id: 101, question: "Q1", time_start: "00:00:07,800", time_end: "00:00:10,300" },
  { id: 102, question: "Q2", time_start: "00:00:13,400", time_end: "00:00:15,500" },
];

describe("useDetailedVideoLogic — quiz activation after sentence finishes (time_end)", () => {
  beforeEach(() => {
    vi.mocked(bilingualApi.bilingualApi.getExerciseById).mockResolvedValue({
      exercises: [...MOCK_EXERCISES],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("activates the first question once video PASSES its time_end in quiz mode", async () => {
    const videoEl = makeVideoElement(0);
    const videoRef = { current: videoEl };

    const { result } = renderHook(() =>
      useDetailedVideoLogic(
        { id: "v1", video_file: { filename_disk: "clip.mp4" } },
        { videoRef, flowMode: "quiz" },
      ),
    );

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());

    // Video chạy tới 11s (> time_end 10.3 của Q1, trong window 3s)
    videoEl.currentTime = 11;
    videoEl.paused = false;

    await waitFor(() => expect(result.current.activeQuestion).not.toBeNull(), { timeout: 3000 });
    expect(result.current.activeQuestion?.id).toBe(101);
  });

  it("pauses video when a question activates (video stopped after time_end)", async () => {
    const videoEl = makeVideoElement(0);
    const videoRef = { current: videoEl };

    const { result } = renderHook(() =>
      useDetailedVideoLogic(
        { id: "v1", video_file: { filename_disk: "clip.mp4" } },
        { videoRef, flowMode: "quiz" },
      ),
    );

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());

    videoEl.currentTime = 11;
    videoEl.paused = false;

    await waitFor(() => expect(result.current.activeQuestion).not.toBeNull(), { timeout: 3000 });

    // pausePlayback được gọi -> video bị pause
    expect(videoEl.pause).toHaveBeenCalled();
  });

  it("does NOT activate a question BEFORE its time_end (sentence still playing)", async () => {
    const videoEl = makeVideoElement(0);
    const videoRef = { current: videoEl };

    const { result } = renderHook(() =>
      useDetailedVideoLogic(
        { id: "v1", video_file: { filename_disk: "clip.mp4" } },
        { videoRef, flowMode: "quiz" },
      ),
    );

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());

    videoEl.currentTime = 9; // < time_end 10.3 (nhưng > time_start 7.8)
    videoEl.paused = false;

    await new Promise((r) => setTimeout(r, 700));
    expect(result.current.activeQuestion).toBeNull();
  });

  it("uses fallback exercises and still activates when API returns empty", async () => {
    vi.mocked(bilingualApi.bilingualApi.getExerciseById).mockResolvedValue({
      exercises: [],
    });
    const videoEl = makeVideoElement(0);
    const videoRef = { current: videoEl };

    const { result } = renderHook(() =>
      useDetailedVideoLogic(
        { id: "v1", video_file: { filename_disk: "clip.mp4" } },
        { videoRef, flowMode: "quiz", fallbackExercises: [...MOCK_EXERCISES] },
      ),
    );

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());
    expect(result.current.exerciseData?.length).toBeGreaterThan(0);

    videoEl.currentTime = 11;
    videoEl.paused = false;

    await waitFor(() => expect(result.current.activeQuestion).not.toBeNull(), { timeout: 3000 });
    expect(result.current.activeQuestion?.id).toBe(101);
  });

  it("activates question via onVideoTimeUpdate path (used by page timeupdate events)", async () => {
    const videoEl = makeVideoElement(0);
    const videoRef = { current: videoEl };

    const { result } = renderHook(() =>
      useDetailedVideoLogic(
        { id: "v1", video_file: { filename_disk: "clip.mp4" } },
        { videoRef, flowMode: "quiz" },
      ),
    );

    await waitFor(() => expect(result.current.exerciseData).not.toBeNull());

    videoEl.currentTime = 11;

    // Giả lập sự kiện timeupdate của video element mà page gọi onVideoTimeUpdate
    await act(async () => {
      result.current.onVideoTimeUpdate?.(11);
    });

    await waitFor(() => expect(result.current.activeQuestion).not.toBeNull(), { timeout: 3000 });
    expect(result.current.activeQuestion?.id).toBe(101);
  });
});