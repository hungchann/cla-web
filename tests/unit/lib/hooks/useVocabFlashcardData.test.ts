import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useVocabFlashcardData } from "@/lib/hooks/useVocabFlashcardData";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const SUGGEST_JSON = encodeURIComponent(
  JSON.stringify([
    { id: "v1", word: "你好", pinyin: "nǐ hǎo", note: "xin chào" },
    { id: "v2", word: "谢谢", pinyin: "xiè xie" },
  ]),
);

describe("useVocabFlashcardData — suggest mode", () => {
  it("loads fake data from suggest type", async () => {
    const { result } = renderHook(() =>
      useVocabFlashcardData({
        type: "suggest",
        notebookId: undefined,
        topicId: undefined,
        restart: undefined,
        fakeData: SUGGEST_JSON,
      }),
    );

    await waitFor(() => expect(result.current.isLoadingList).toBe(false));
    expect(result.current.dataVocal).toHaveLength(2);
    expect(result.current.dataVocal[0].vocab_items_id).toMatchObject({
      id: "v1",
      name: "你好",
      pinyin: "nǐ hǎo",
    });
  });

  it("navigates to next card and increments counters", async () => {
    const { result } = renderHook(() =>
      useVocabFlashcardData({
        type: "suggest",
        notebookId: undefined,
        topicId: undefined,
        restart: undefined,
        fakeData: SUGGEST_JSON,
      }),
    );

    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    act(() => {
      void result.current.moveToNext("mastered");
    });

    await waitFor(() => expect(result.current.currentIndex).toBe(1));
    expect(result.current.knownCount).toBe(1);
    expect(result.current.isFlipped).toBe(false);
  });

  it("moveToPrevious returns to prior card", async () => {
    const { result } = renderHook(() =>
      useVocabFlashcardData({
        type: "suggest",
        notebookId: undefined,
        topicId: undefined,
        restart: undefined,
        fakeData: SUGGEST_JSON,
      }),
    );

    await waitFor(() => expect(result.current.isLoadingList).toBe(false));

    act(() => {
      result.current.setCurrentIndex(1);
    });
    act(() => {
      result.current.moveToPrevious();
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it("flip toggles isFlipped", () => {
    const { result } = renderHook(() =>
      useVocabFlashcardData({
        type: "suggest",
        notebookId: undefined,
        topicId: undefined,
        restart: undefined,
        fakeData: SUGGEST_JSON,
      }),
    );

    act(() => {
      result.current.flip();
    });
    expect(result.current.isFlipped).toBe(true);

    act(() => {
      result.current.flip();
    });
    expect(result.current.isFlipped).toBe(false);
  });
});
