import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePremiumGate } from "@/lib/hooks/usePremiumGate";
import * as premiumHook from "@/lib/hooks/usePremium";

vi.mock("@/lib/hooks/usePremium", async (importOriginal) => {
  const actual = await importOriginal<typeof premiumHook>();
  return {
    ...actual,
    usePremium: vi.fn(() => ({ isPremium: false, isLoading: false })),
  };
});

describe("usePremiumGate", () => {
  beforeEach(() => {
    vi.mocked(premiumHook.usePremium).mockReturnValue({ isPremium: false, isLoading: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("auto-opens modal on mount when free with showOnMount", () => {
    const { result } = renderHook(() => usePremiumGate({ showOnMount: true }));
    expect(result.current.premiumModalVisible).toBe(true);
    expect(result.current.isLocked).toBe(true);
  });

  it("keeps modal closed when premium with showOnMount", () => {
    vi.mocked(premiumHook.usePremium).mockReturnValue({ isPremium: true, isLoading: false });
    const { result } = renderHook(() => usePremiumGate({ showOnMount: true }));
    expect(result.current.premiumModalVisible).toBe(false);
    expect(result.current.isLocked).toBe(false);
  });

  it("stays closed while loading even if free with showOnMount", () => {
    vi.mocked(premiumHook.usePremium).mockReturnValue({ isPremium: false, isLoading: true });
    const { result } = renderHook(() => usePremiumGate({ showOnMount: true }));
    expect(result.current.premiumModalVisible).toBe(false);
    expect(result.current.isLocked).toBe(false);
  });

  it("showOnMount modal is dismissible and can reopen", () => {
    const { result } = renderHook(() => usePremiumGate({ showOnMount: true }));
    expect(result.current.premiumModalVisible).toBe(true);

    act(() => result.current.setPremiumModalVisible(false));
    expect(result.current.premiumModalVisible).toBe(false);

    act(() => result.current.setPremiumModalVisible(true));
    expect(result.current.premiumModalVisible).toBe(true);
  });

  it("manual mode starts closed and opens via setPremiumModalVisible", () => {
    const { result } = renderHook(() => usePremiumGate());
    expect(result.current.premiumModalVisible).toBe(false);

    act(() => result.current.setPremiumModalVisible(true));
    expect(result.current.premiumModalVisible).toBe(true);
  });

  it("guardPremium returns true without opening modal when premium", () => {
    vi.mocked(premiumHook.usePremium).mockReturnValue({ isPremium: true, isLoading: false });
    const { result } = renderHook(() => usePremiumGate());
    let guarded = true;
    act(() => {
      guarded = result.current.guardPremium();
    });
    expect(guarded).toBe(true);
    expect(result.current.premiumModalVisible).toBe(false);
  });

  it("guardPremium returns false and opens modal when free", () => {
    const { result } = renderHook(() => usePremiumGate());
    let guarded = true;
    act(() => {
      guarded = result.current.guardPremium();
    });
    expect(guarded).toBe(false);
    expect(result.current.premiumModalVisible).toBe(true);
  });

  it("showPremiumModal opens only when locked", () => {
    const { result } = renderHook(() => usePremiumGate());
    expect(result.current.premiumModalVisible).toBe(false);

    act(() => result.current.showPremiumModal());
    expect(result.current.premiumModalVisible).toBe(true);
  });
});
