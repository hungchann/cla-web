import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWordTranslation } from "@/lib/hooks/useWordTranslation";
import * as apiService from "@/api/apiService";

vi.mock("@/api/apiService", async (importOriginal) => {
  const actual = await importOriginal<typeof apiService>();
  return {
    ...actual,
    translateWord: vi.fn(),
  };
});

describe("useWordTranslation", () => {
  beforeEach(() => {
    vi.mocked(apiService.translateWord).mockResolvedValue([
      { word: "你好", pinyin: "nǐ hǎo", meaning: "Xin chào" },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with hidden modal and no selection", () => {
    const { result } = renderHook(() => useWordTranslation());
    expect(result.current.isModalVisible).toBe(false);
    expect(result.current.selectedWord).toBeNull();
    expect(result.current.wordInfo).toBeNull();
  });

  it("opens modal and loads word info on word press", async () => {
    const { result } = renderHook(() => useWordTranslation());

    act(() => {
      void result.current.onWordPress("你好");
    });

    expect(result.current.isModalVisible).toBe(true);
    expect(result.current.selectedWord).toBe("你好");

    await waitFor(() => expect(result.current.wordInfo).not.toBeNull());
    expect(result.current.wordInfo.word).toBe("你好");
    expect(apiService.translateWord).toHaveBeenCalledWith("你好");
  });

  it("ignores stale async response after a newer selection", async () => {
    const resolvers: Array<(v: unknown) => void> = [];
    vi.mocked(apiService.translateWord).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { result } = renderHook(() => useWordTranslation());

    act(() => {
      void result.current.onWordPress("词一");
    });
    act(() => {
      void result.current.onWordPress("词二");
    });

    // Resolve response của request cũ (词一) — phải bị bỏ qua vì có request mới hơn
    await act(async () => {
      resolvers[0]([{ word: "词一", pinyin: "a", meaning: "old" }]);
    });

    expect(result.current.wordInfo).toBeNull();

    // Resolve request mới → wordInfo cập nhật
    await act(async () => {
      resolvers[1]([{ word: "词二", pinyin: "b", meaning: "new" }]);
    });
    expect(result.current.wordInfo.word).toBe("词二");
  });

  it("sets wordInfo to null when translation fails", async () => {
    vi.mocked(apiService.translateWord).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useWordTranslation());

    act(() => {
      void result.current.onWordPress("你好");
    });

    await waitFor(() => expect(result.current.wordInfo).toBeNull());
    expect(result.current.isModalVisible).toBe(true);
  });

  it("close hides the modal", async () => {
    const { result } = renderHook(() => useWordTranslation());

    act(() => {
      void result.current.onWordPress("你好");
    });
    await waitFor(() => expect(result.current.isModalVisible).toBe(true));

    act(() => {
      result.current.close();
    });
    expect(result.current.isModalVisible).toBe(false);
  });

  it("setModalVisible controls visibility", () => {
    const { result } = renderHook(() => useWordTranslation());

    act(() => {
      result.current.setModalVisible(true);
    });
    expect(result.current.isModalVisible).toBe(true);
  });
});
