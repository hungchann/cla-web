import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import * as speakingApi from "@/api/speaking";
import * as premiumHook from "@/lib/hooks/usePremium";

vi.mock("@/api/speaking", async (importOriginal) => {
  const actual = await importOriginal<typeof speakingApi>();
  return {
    ...actual,
    speakingApi: {
      ...actual.speakingApi,
      getConversation: vi.fn(),
    },
  };
});

vi.mock("@/lib/hooks/usePremium", async (importOriginal) => {
  const actual = await importOriginal<typeof premiumHook>();
  return {
    ...actual,
    usePremium: vi.fn(() => ({ isPremium: false, isLoading: false })),
  };
});

const DIALOGUES = [
  { id: "d2", chinese_text: "你好吗？", pinyin: "nǐ hǎo ma?", vietnamese_text: "Bạn khỏe không?", speaker: "B", order: 2 },
  { id: "d1", chinese_text: "你好", pinyin: "nǐ hǎo", vietnamese_text: "Xin chào", speaker: "A", order: 1 },
];

describe("useConversationDetail", () => {
  beforeEach(() => {
    vi.mocked(speakingApi.speakingApi.getConversation).mockResolvedValue(DIALOGUES);
    vi.mocked(premiumHook.usePremium).mockReturnValue({ isPremium: false, isLoading: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and sorts conversation by order", async () => {
    const { result } = renderHook(() => useConversationDetail("conv-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].id).toBe("d1"); // order 1
    expect(result.current.items[1].id).toBe("d2"); // order 2
    expect(result.current.visibleCount).toBe(1);
    expect(result.current.errorMessage).toBeNull();
  });

  it("shows error message and fallback when fetch fails", async () => {
    vi.mocked(speakingApi.speakingApi.getConversation).mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useConversationDetail("conv-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.errorMessage).toContain("Không thể tải hội thoại");
    expect(result.current.items.length).toBeGreaterThan(0); // fallback items
  });

  it("handles null conversationId with empty state", async () => {
    const { result } = renderHook(() => useConversationDetail(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.visibleCount).toBe(0);
  });

  it("handleContinue reveals next message", async () => {
    const { result } = renderHook(() => useConversationDetail("conv-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMoreMessages).toBe(true);

    act(() => {
      result.current.handleContinue();
    });

    expect(result.current.visibleCount).toBe(2);
    expect(result.current.hasMoreMessages).toBe(false);
  });

  it("computeSpeakerBStats returns zero stats when no B messages recorded", async () => {
    const { result } = renderHook(() => useConversationDetail("conv-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const stats = result.current.computeSpeakerBStats();
    expect(stats).toEqual({ totalSpeakerB: 1, completedSpeakerB: 0, averageAccuracy: 0 });
  });

  it("computeSpeakerBStats counts B messages only", async () => {
    vi.mocked(speakingApi.speakingApi.getConversation).mockResolvedValue([
      { id: "a1", chinese_text: "hi", pinyin: "x", vietnamese_text: "y", speaker: "A", order: 1 },
      { id: "b1", chinese_text: "hi", pinyin: "x", vietnamese_text: "y", speaker: "B", order: 2 },
    ]);

    const { result } = renderHook(() => useConversationDetail("conv-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const stats = result.current.computeSpeakerBStats();
    expect(stats.totalSpeakerB).toBe(1);
    expect(stats.completedSpeakerB).toBe(0);
  });
});
