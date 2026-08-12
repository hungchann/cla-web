import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

function mockMatchMedia() {
  const listeners: Array<() => void> = [];
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: () => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return { listeners };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false on desktop width", () => {
    mockMatchMedia();
    Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true on mobile width", () => {
    mockMatchMedia();
    Object.defineProperty(window, "innerWidth", { value: 400, configurable: true });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when viewport resizes across breakpoint", () => {
    const { listeners } = mockMatchMedia();
    Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true });
    act(() => {
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(true);
  });
});
