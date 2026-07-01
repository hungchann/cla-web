import { useState, useEffect } from "react";

export const device = {
  get isLarge() {
    if (globalThis.window !== undefined) {
      return globalThis.window.innerWidth >= 1024;
    }
    return false;
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const layout = {
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
};

export const typography = {
  h1: { fontSize: 32, fontWeight: "700" as const },
  h2: { fontSize: 24, fontWeight: "700" as const },
  h3: { fontSize: 20, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  caption: { fontSize: 14, fontWeight: "400" as const },
  label: { fontSize: 12, fontWeight: "600" as const },
};

const lightColors = {
  background: {
    primary: "#ffffff",
    secondary: "#f4f4f5",
    tertiary: "#e4e4e7",
    card: "#ffffff",
    modal: "#ffffff",
    transparent: "transparent",
  },
  text: {
    primary: "#18181b",
    secondary: "#71717a",
    tertiary: "#a1a1aa",
    inverse: "#ffffff",
  },
  primary: "#d97706",
  secondary: "#fbbf24",
  accent: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  statusSurface: {
    successSubtle: "#e6fbf2",
    successEmphasis: "#059669",
    warningSubtle: "#fffbeb",
    warningEmphasis: "#d97706",
    errorSubtle: "#fef2f2",
    errorEmphasis: "#dc2626",
    infoSubtle: "#eff6ff",
    infoEmphasis: "#2563eb",
  },
  border: {
    primary: "#e4e4e7",
    secondary: "#d4d4d8",
    tertiary: "#a1a1aa",
  },
  shadow: "rgba(0, 0, 0, 0.1)",
  overlay: "rgba(0, 0, 0, 0.5)",
  chineseRed: "#de2910",
};

const darkColors = {
  background: {
    primary: "#09090b",
    secondary: "#18181b",
    tertiary: "#27272a",
    card: "#18181b",
    modal: "#18181b",
    transparent: "transparent",
  },
  text: {
    primary: "#f4f4f5",
    secondary: "#a1a1aa",
    tertiary: "#71717a",
    inverse: "#09090b",
  },
  primary: "#fbbf24",
  secondary: "#d97706",
  accent: "#60a5fa",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
  info: "#60a5fa",
  statusSurface: {
    successSubtle: "#064e3b",
    successEmphasis: "#34d399",
    warningSubtle: "#78350f",
    warningEmphasis: "#fbbf24",
    errorSubtle: "#7f1d1d",
    errorEmphasis: "#f87171",
    infoSubtle: "#1e3a8a",
    infoEmphasis: "#60a5fa",
  },
  border: {
    primary: "#27272a",
    secondary: "#3f3f46",
    tertiary: "#71717a",
  },
  shadow: "rgba(0, 0, 0, 0.5)",
  overlay: "rgba(0, 0, 0, 0.7)",
  chineseRed: "#ff4d4f",
};

export function useTheme() {
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (globalThis.window !== undefined) {
      const isDark = globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches;
      setActualTheme(isDark ? "dark" : "light");
    }
  }, []);

  return { actualTheme };
}

export function useThemeColors() {
  const { actualTheme } = useTheme();
  const colors = actualTheme === "dark" ? darkColors : lightColors;
  return { colors };
}
