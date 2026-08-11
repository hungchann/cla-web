import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import apiInstance, { refreshAccessToken } from "@/api/authConfig";
import { REGISTER_FLOW_PATH } from "@/lib/constants";
import {
  REFRESH_TOKENS_RESPONSE,
  TEST_USER,
} from "@/tests/mocks/fixtures/users";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("refreshAccessToken", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("returns false when no refresh token available", async () => {
    const result = await refreshAccessToken();
    expect(result).toBe(false);
  });

  it("returns true and saves new tokens on success", async () => {
    document.cookie = "refresh_token=old-refresh; path=/";

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(tokenUtils.getAccessToken()).toBe("new-access-token-789");
    expect(tokenUtils.getRefreshToken()).toBe("new-refresh-token-000");
  });

  it("returns false when response has no access_token", async () => {
    document.cookie = "refresh_token=old-refresh; path=/";
    server.use(
      http.post(`${API}/graphql/system`, () => {
        return HttpResponse.json({ data: { auth_refresh: { refresh_token: "x" } } });
      }),
    );

    const result = await refreshAccessToken();
    expect(result).toBe(false);
  });

  it("deduplicates concurrent refresh calls (singleton lock)", async () => {
    document.cookie = "refresh_token=old-refresh; path=/";

    let callCount = 0;
    server.use(
      http.post(`${API}/graphql/system`, async () => {
        callCount += 1;
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json(REFRESH_TOKENS_RESPONSE);
      }),
    );

    const [r1, r2] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(callCount).toBe(1);
  });
});

describe("apiInstance request interceptor", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("attaches Bearer token to non-auth requests", async () => {
    document.cookie = "access_token=my-token; path=/";

    let capturedAuthHeader: string | null = null;
    server.use(
      http.get(`${API}/items/anything`, ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({ data: [] });
      }),
    );

    await apiInstance.get("/items/anything");
    expect(capturedAuthHeader).toBe("Bearer my-token");
  });

  it("does NOT attach token to /auth/login requests", async () => {
    document.cookie = "access_token=my-token; path=/";

    let capturedAuthHeader: string | null = "unset";
    server.use(
      http.post(`${API}/auth/login`, ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({ data: { access_token: "x" } });
      }),
    );

    await apiInstance.post("/auth/login", { email: "a@b.com", password: "123456" });
    expect(capturedAuthHeader).toBeNull();
  });

  it("does NOT attach token to register flow requests", async () => {
    document.cookie = "access_token=my-token; path=/";

    let capturedAuthHeader: string | null = "unset";
    server.use(
      http.post(`${API}${REGISTER_FLOW_PATH}`, ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({ data: {} });
      }),
    );

    await apiInstance.post(REGISTER_FLOW_PATH, { email: "a@b.com" });
    expect(capturedAuthHeader).toBeNull();
  });

  it("does NOT attach token to /auth/forgot-password requests", async () => {
    document.cookie = "access_token=my-token; path=/";

    let capturedAuthHeader: string | null = "unset";
    server.use(
      http.post(`${API}/auth/forgot-password`, ({ request }) => {
        capturedAuthHeader = request.headers.get("Authorization");
        return HttpResponse.json({ data: {} });
      }),
    );

    await apiInstance.post("/auth/forgot-password", { email: "a@b.com" });
    expect(capturedAuthHeader).toBeNull();
  });
});

describe("apiInstance response interceptor — 401 refresh & retry", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("refreshes token and retries original request on 401", async () => {
    document.cookie = "access_token=stale-token; path=/";
    document.cookie = "refresh_token=good-refresh; path=/";

    let usersMeCalls = 0;
    let systemCalls = 0;

    server.use(
      http.get(`${API}/users/me`, ({ request }) => {
        usersMeCalls += 1;
        const auth = request.headers.get("Authorization");
        // Lần đầu với token cũ → 401; lần sau với token mới → 200
        if (auth === "Bearer stale-token") {
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({ data: TEST_USER });
      }),
      http.post(`${API}/graphql/system`, () => {
        systemCalls += 1;
        return HttpResponse.json(REFRESH_TOKENS_RESPONSE);
      }),
    );

    const response = await apiInstance.get("/users/me");

    expect(usersMeCalls).toBe(2);
    expect(systemCalls).toBe(1);
    expect(response.data.data).toEqual(TEST_USER);
    expect(tokenUtils.getAccessToken()).toBe("new-access-token-789");
  });

  it("clears all tokens when refresh fails", async () => {
    document.cookie = "access_token=stale-token; path=/";
    document.cookie = "refresh_token=bad-refresh; path=/";

    server.use(
      http.get(`${API}/users/me`, () => {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }),
      http.post(`${API}/graphql/system`, () => {
        return HttpResponse.json(
          { errors: [{ message: "Invalid refresh token" }] },
          { status: 401 },
        );
      }),
    );

    await expect(apiInstance.get("/users/me")).rejects.toThrow();
    expect(tokenUtils.getAccessToken()).toBeNull();
    expect(tokenUtils.getRefreshToken()).toBeNull();
  });
});

describe("apiInstance response interceptor — 5xx retry", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("retries once on 500 and succeeds on second attempt", async () => {
    vi.useFakeTimers();
    try {
      document.cookie = "access_token=tok; path=/";

      let calls = 0;
      server.use(
        http.get(`${API}/items/flaky`, () => {
          calls += 1;
          if (calls === 1) {
            return HttpResponse.json({ error: "boom" }, { status: 500 });
          }
          return HttpResponse.json({ data: [{ id: 1 }] });
        }),
      );

      const promise = apiInstance.get("/items/flaky");
      // Tiến timers để bỏ qua sleep(1000) giữa các lần retry
      await vi.advanceTimersByTimeAsync(2000);
      const response = await promise;

      expect(calls).toBe(2);
      expect(response.data).toEqual({ data: [{ id: 1 }] });
    } finally {
      vi.useRealTimers();
    }
  });
});
