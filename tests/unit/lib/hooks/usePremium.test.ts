import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePremium } from "@/lib/hooks/usePremium";
import * as profileApi from "@/api/profile";

vi.mock("@/api/profile", async (importOriginal) => {
  const actual = await importOriginal<typeof profileApi>();
  return {
    ...actual,
    getAccountType: vi.fn(),
  };
});

describe("usePremium", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.mocked(profileApi.getAccountType).mockResolvedValue({ user_profiles: [] });
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns non-premium when no user data", async () => {
    const { result } = renderHook(() => usePremium());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
    expect(profileApi.getAccountType).not.toHaveBeenCalled();
  });

  it("returns premium when account is active Lifetime", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-1" }));
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { name: "Lifetime" }, is_active: true }],
    });

    const { result } = renderHook(() => usePremium());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(true);
  });

  it("returns non-premium for Free account", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-1" }));
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { name: "Free" }, is_active: true }],
    });

    const { result } = renderHook(() => usePremium());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
  });

  it("returns non-premium when subscription expired", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-1" }));
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { name: "Monthly" }, is_active: false }],
    });

    const { result } = renderHook(() => usePremium());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
  });

  it("returns non-premium on API failure", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-1" }));
    vi.mocked(profileApi.getAccountType).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => usePremium());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isPremium).toBe(false);
  });
});
