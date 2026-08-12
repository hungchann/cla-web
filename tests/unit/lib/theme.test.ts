import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThemeColors, useTheme, device } from "@/lib/theme";

describe("useThemeColors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns light colors by default", () => {
    const { result } = renderHook(() => useThemeColors());
    expect(result.current.colors.primary).toBe("#d97706");
    expect(result.current.colors.text.primary).toBe("#18181b");
  });

  it("returns dark colors when prefers-color-scheme dark", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useThemeColors());
    expect(result.current.colors.primary).toBe("#fbbf24");
    expect(result.current.colors.text.primary).toBe("#f4f4f5");
  });
});

describe("useTheme", () => {
  afterEach(() => {
    // Restore matchMedia mặc định của setup.ts (light theme)
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it("starts with light theme", () => {
    // Đảm bảo matchMedia trả light (không bị ảnh hưởng bởi test dark trước đó)
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.actualTheme).toBe("light");
  });

  it("switches to dark when prefers dark", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.actualTheme).toBe("dark");
  });
});

describe("device.isLarge", () => {
  it("returns false when window undefined", () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    try {
      expect(device.isLarge).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
    }
  });

  it("returns true when window width >= 1024", () => {
    Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });
    expect(device.isLarge).toBe(true);
  });

  it("returns false when window width < 1024", () => {
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
    expect(device.isLarge).toBe(false);
  });
});
