import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { PremiumProvider, usePremiumContext } from "@/lib/context/PremiumContext";
import * as profileApi from "@/api/profile";

vi.mock("@/api/profile", async (importOriginal) => {
  const actual = await importOriginal<typeof profileApi>();
  return {
    ...actual,
    getAccountType: vi.fn(),
  };
});

function renderProvider() {
  return renderHook(() => usePremiumContext(), { wrapper: PremiumProvider });
}

function loginAs(userId: string) {
  localStorage.setItem("user_data", JSON.stringify({ id: userId }));
  document.cookie = "access_token=tok; path=/";
}

describe("PremiumProvider", () => {
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

  it("is non-premium and skips API when logged out", async () => {
    const { result } = renderProvider();

    await waitFor(() => expect(result.current?.loading).toBe(false));
    expect(result.current?.isPremium).toBe(false);
    expect(result.current?.accountTypeName).toBeNull();
    expect(profileApi.getAccountType).not.toHaveBeenCalled();
  });

  it("is premium for an active Lifetime account", async () => {
    loginAs("u-1");
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { id: 1, name: "Lifetime" }, is_active: true }],
    });

    const { result } = renderProvider();

    await waitFor(() => expect(result.current?.loading).toBe(false));
    expect(result.current?.isPremium).toBe(true);
    expect(result.current?.accountTypeName).toBe("Lifetime");
  });

  it("is non-premium for a Free account", async () => {
    loginAs("u-1");
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { id: 2, name: "Free" }, is_active: true }],
    });

    const { result } = renderProvider();

    await waitFor(() => expect(result.current?.loading).toBe(false));
    expect(result.current?.isPremium).toBe(false);
  });

  it("is non-premium when subscription is expired", async () => {
    loginAs("u-1");
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { id: 3, name: "Yearly" }, is_active: false }],
    });

    const { result } = renderProvider();

    await waitFor(() => expect(result.current?.loading).toBe(false));
    expect(result.current?.isPremium).toBe(false);
  });

  it("refreshPremium(force) picks up a newly activated plan", async () => {
    loginAs("u-1");
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { id: 4, name: "Free" }, is_active: true }],
    });

    const { result } = renderProvider();
    await waitFor(() => expect(result.current?.loading).toBe(false));
    expect(result.current?.isPremium).toBe(false);

    // Admin kích hoạt gói Yearly -> user refresh -> premium.
    vi.mocked(profileApi.getAccountType).mockResolvedValue({
      user_profiles: [{ account_type_id: { id: 4, name: "Yearly" }, is_active: true }],
    });

    await act(async () => {
      await result.current?.refreshPremium(true);
    });
    expect(result.current?.isPremium).toBe(true);
  });
});
