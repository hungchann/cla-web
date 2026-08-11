import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/lib/hooks/useAuth";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("useAuth", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reports unauthenticated when no tokens", async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("reports authenticated with cached user data", async () => {
    const user = { id: "u1", email: "a@b.com", first_name: "A" };
    localStorage.setItem("user_data", JSON.stringify(user));
    document.cookie = "access_token=tok; refresh_token=ref; path=/";

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(result.current.user).toEqual(user);
    expect(result.current.isLoading).toBe(false);
  });

  it("reports unauthenticated when only invalid user_data exists", async () => {
    localStorage.setItem("user_data", "{bad-json");
    document.cookie = "access_token=tok; refresh_token=ref; path=/";

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // getUserData trả null khi JSON hỏng → fallback qua refresh → refresh thất bại (không có refresh hợp lệ)
    expect(result.current.isAuthenticated).toBe(false);
  });
});
