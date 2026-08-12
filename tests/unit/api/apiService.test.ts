import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import {
  loginUser,
  RegisterUser,
  getUser,
  clearUserCache,
  checkEmailExists,
  logoutUser,
  updateProfile,
  forgotPassword,
  updatePassword,
  resetPasswordWithToken,
  translateWord,
} from "@/api/apiService";
import {
  REGISTER_FLOW_PATH,
  ONBOARDING_EMAIL_CHECK_FLOW_PATH,
  UPDATE_PROFILE_FLOW_PATH,
  RESET_PASSWORD_FLOW_PATH,
  RESET_PASSWORD_FLOW_URL,
} from "@/lib/constants";
import { acceptAIConsent, resetAIConsent } from "@/lib/ai/aiConsentStorage";
import { TEST_PROFILE, TEST_USER } from "@/tests/mocks/fixtures/users";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("loginUser", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  it("saves tokens and returns user on successful login", async () => {
    const result = await loginUser("test@example.com", "123456");

    expect(result.access_token).toBe("test-access-token-123");
    expect(result.user).toEqual(TEST_USER);
    expect(tokenUtils.getAccessToken()).toBe("test-access-token-123");
    expect(tokenUtils.getRefreshToken()).toBe("test-refresh-token-456");
  });

  it("throws on invalid email format", async () => {
    await expect(loginUser("invalid-email", "123456")).rejects.toThrow(
      "Định dạng email không hợp lệ",
    );
  });

  it("throws on empty email", async () => {
    await expect(loginUser("", "123456")).rejects.toThrow("Email không được để trống");
  });

  it("throws on short password", async () => {
    await expect(loginUser("test@example.com", "123")).rejects.toThrow(
      "Mật khẩu phải có ít nhất 6 ký tự",
    );
  });

  it("throws on empty password", async () => {
    await expect(loginUser("test@example.com", "")).rejects.toThrow(
      "Mật khẩu không được để trống",
    );
  });
});

describe("RegisterUser", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("throws when first_name is empty", async () => {
    await expect(RegisterUser("a@b.com", "123456", "  ")).rejects.toThrow(
      "Họ tên không được để trống",
    );
  });

  it("throws on invalid email", async () => {
    await expect(RegisterUser("bad", "123456", "A")).rejects.toThrow(
      "Định dạng email không hợp lệ",
    );
  });

  it("throws on short password", async () => {
    await expect(RegisterUser("a@b.com", "123", "A")).rejects.toThrow(
      "Mật khẩu phải có ít nhất 6 ký tự",
    );
  });

  it("sends registration request and returns response data", async () => {
    let capturedBody: object | null = null;
    server.use(
      http.post(`${API}${REGISTER_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: { id: "new-user" } });
      }),
    );

    const result = await RegisterUser("a@b.com", "123456", "Nguyen", "Van");
    expect(capturedBody).toEqual({
      email: "a@b.com",
      password: "123456",
      first_name: "Nguyen",
      last_name: "Van",
    });
    expect(result).toEqual({ id: "new-user" });
  });
});

describe("getUser", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  afterEach(() => {
    clearUserCache();
  });

  it("throws a 401-style error when no tokens exist", async () => {
    const error = await getUser().catch((e) => e);
    expect(error.status).toBe(401);
  });

  it("fetches user + profile and caches the result", async () => {
    document.cookie = "access_token=acc; refresh_token=ref; path=/";

    let apiCalls = 0;
    server.use(
      http.get(`${API}/users/me`, () => {
        apiCalls += 1;
        return HttpResponse.json({ data: TEST_USER });
      }),
    );

    const first = await getUser();
    const second = await getUser();

    expect(first.user).toEqual(TEST_USER);
    expect(first.profile).toEqual(TEST_PROFILE);
    expect(second).toBe(first); // cache trả về cùng object, không gọi API
    expect(apiCalls).toBe(1);
  });

  it("refetches when forceRefresh is true", async () => {
    document.cookie = "access_token=acc; refresh_token=ref; path=/";

    let apiCalls = 0;
    server.use(
      http.get(`${API}/users/me`, () => {
        apiCalls += 1;
        return HttpResponse.json({ data: TEST_USER });
      }),
    );

    await getUser();
    await getUser(true);

    expect(apiCalls).toBe(2);
  });

  it("clears cache when userId changes (account switch)", async () => {
    document.cookie = "access_token=acc; refresh_token=ref; path=/";

    server.use(
      http.get(`${API}/users/me`, () => {
        return HttpResponse.json({ data: TEST_USER });
      }),
    );

    await getUser();

    // Giả lập đổi tài khoản: user mới có id khác
    server.use(
      http.get(`${API}/users/me`, () => {
        return HttpResponse.json({ data: { ...TEST_USER, id: "user-002" } });
      }),
    );
    clearUserCache();

    const after = await getUser();
    expect(after.user.id).toBe("user-002");
  });
});

describe("checkEmailExists", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("returns false when API responds exists:false", async () => {
    server.use(
      http.get(`${API}${ONBOARDING_EMAIL_CHECK_FLOW_PATH}`, () => {
        return HttpResponse.json({ exists: false });
      }),
    );
    expect(await checkEmailExists("a@b.com")).toBe(false);
  });

  it("returns true when API responds exists:true", async () => {
    server.use(
      http.get(`${API}${ONBOARDING_EMAIL_CHECK_FLOW_PATH}`, () => {
        return HttpResponse.json({ exists: true });
      }),
    );
    expect(await checkEmailExists("a@b.com")).toBe(true);
  });

  it("returns true on 401 response (account exists)", async () => {
    server.use(
      http.get(`${API}${ONBOARDING_EMAIL_CHECK_FLOW_PATH}`, () => {
        return HttpResponse.json({ error: "Tài khoản đã tồn tại" }, { status: 401 });
      }),
    );
    expect(await checkEmailExists("a@b.com")).toBe(true);
  });

  it("throws on network error", async () => {
    vi.useFakeTimers();
    try {
      server.use(
        http.get(`${API}${ONBOARDING_EMAIL_CHECK_FLOW_PATH}`, () => {
          return HttpResponse.error();
        }),
      );
      const promise = checkEmailExists("a@b.com").catch((e) => e);
      await vi.advanceTimersByTimeAsync(5000);
      const error = await promise;
      expect(error).toBeInstanceOf(Error);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws on invalid email before making request", async () => {
    await expect(checkEmailExists("bad-email")).rejects.toThrow(
      "Định dạng email không hợp lệ",
    );
  });
});

describe("logoutUser", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  it("calls backend logout and clears all tokens", async () => {
    document.cookie = "access_token=acc; path=/";
    document.cookie = "refresh_token=ref; path=/";
    localStorage.setItem("user_data", JSON.stringify({ id: "u1" }));

    let logoutCalled = false;
    server.use(
      http.post(`${API}/auth/logout`, () => {
        logoutCalled = true;
        return HttpResponse.json({ data: null });
      }),
    );

    await logoutUser();

    expect(logoutCalled).toBe(true);
    expect(tokenUtils.getAccessToken()).toBeNull();
    expect(tokenUtils.getRefreshToken()).toBeNull();
    expect(tokenUtils.getUserData()).toBeNull();
  });

  it("clears tokens even when backend logout fails", async () => {
    document.cookie = "access_token=acc; path=/";
    document.cookie = "refresh_token=ref; path=/";
    server.use(
      http.post(`${API}/auth/logout`, () => {
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );

    await logoutUser();

    expect(tokenUtils.getAccessToken()).toBeNull();
    expect(tokenUtils.getRefreshToken()).toBeNull();
  });

  it("works when no refresh token exists", async () => {
    await expect(logoutUser()).resolves.toBeUndefined();
  });
});

describe("updateProfile", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("posts cleaned fields to update profile flow", async () => {
    let capturedBody: object | null = null;
    server.use(
      http.post(`${API}${UPDATE_PROFILE_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await updateProfile({ first_name: "A", phone: null, note: undefined, age: 0 });

    expect(capturedBody).toEqual({ first_name: "A", age: 0 });
  });

  it("throws when no valid fields to update", async () => {
    await expect(updateProfile({ phone: null, note: undefined })).rejects.toThrow(
      "0 có trường nào để cập nhật",
    );
  });
});

describe("forgotPassword", () => {
  it("posts email to auth/forgot-password", async () => {
    let capturedBody: object | null = null;
    server.use(
      http.post(`${API}/auth/forgot-password`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: null });
      }),
    );

    await forgotPassword("a@b.com");
    expect(capturedBody).toEqual({ email: "a@b.com" });
  });
});

describe("updatePassword", () => {
  it("posts new password to reset flow", async () => {
    let capturedBody: object | null = null;
    server.use(
      http.post(`${API}${RESET_PASSWORD_FLOW_PATH}*`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await updatePassword("newpass123");
    expect(capturedBody).toEqual({ new_password: "newpass123" });
  });
});

describe("resetPasswordWithToken", () => {
  it("posts reset token and new password to flow URL", async () => {
    let capturedBody: object | null = null;
    const url = new URL(RESET_PASSWORD_FLOW_URL);
    server.use(
      http.post(`${url.origin}${url.pathname}*`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await resetPasswordWithToken("tok-1", "newpass");
    expect(capturedBody).toEqual({ reset_token: "tok-1", new_password: "newpass" });
  });
});

describe("translateWord", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAIConsent();
  });

  afterEach(() => {
    localStorage.clear();
    resetAIConsent();
    vi.restoreAllMocks();
  });

  it("returns translated word when consent accepted", async () => {
    await acceptAIConsent();
    server.use(
      http.get("*/api/chinese/translate", () => {
        return HttpResponse.json([{ word: "你好", pinyin: "nǐ hǎo", meaning: "Xin chào" }]);
      }),
    );

    const result = await translateWord("你好");
    expect(result[0].word).toBe("你好");
    expect(result[0].meaning).toBe("Xin chào");
  });

  it("returns fallback error message when translation fails", async () => {
    await acceptAIConsent();
    server.use(
      http.get("*/api/chinese/translate", () => {
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );

    const result = await translateWord("你好");
    expect(result[0]).toMatchObject({
      word: "你好",
      meaning: "Dịch vụ dịch thuật tạm thời không khả dụng",
    });
  });

  it("returns not-found message for 404", async () => {
    await acceptAIConsent();
    server.use(
      http.get("*/api/chinese/translate", () => {
        return HttpResponse.json({ error: "x" }, { status: 404 });
      }),
    );

    const result = await translateWord("不存在的词");
    expect(result[0].meaning).toBe("Không tìm thấy từ này trong từ điển");
  });

  it("throws AIConsentRequiredError when consent not granted", async () => {
    await expect(translateWord("你好")).rejects.toThrow(/consent/i);
  });
});
