import { describe, it, expect, beforeEach } from "vitest";
import { tokenUtils, expiresValueToAbsoluteMs } from "@/lib/utils/tokenUtils";

describe("expiresValueToAbsoluteMs", () => {
  it("returns null for null/undefined/0 expires", () => {
    expect(expiresValueToAbsoluteMs(null)).toBeNull();
    expect(expiresValueToAbsoluteMs(undefined)).toBeNull();
    expect(expiresValueToAbsoluteMs(0)).toBeNull();
    expect(expiresValueToAbsoluteMs(-5)).toBeNull();
  });

  it("interprets small values (<=100000) as seconds", () => {
    const before = Date.now();
    const result = expiresValueToAbsoluteMs(900);
    const after = Date.now();
    expect(result).toBeGreaterThan(before + 899_000);
    expect(result).toBeLessThanOrEqual(after + 900_000);
  });

  it("interprets large values (>100000) as milliseconds", () => {
    const before = Date.now();
    const result = expiresValueToAbsoluteMs(900_000);
    const after = Date.now();
    expect(result).toBeGreaterThan(before + 899_999);
    expect(result).toBeLessThanOrEqual(after + 900_000);
  });
});

describe("tokenUtils", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getAccessToken returns token from cookie", () => {
    document.cookie = "access_token=abc123; path=/";
    expect(tokenUtils.getAccessToken()).toBe("abc123");
  });

  it("getAccessToken returns null when cookie missing", () => {
    expect(tokenUtils.getAccessToken()).toBeNull();
  });

  it("getRefreshToken returns token from cookie", () => {
    document.cookie = "refresh_token=refresh456; path=/";
    expect(tokenUtils.getRefreshToken()).toBe("refresh456");
  });

  it("saveTokens sets access and refresh cookies", async () => {
    await tokenUtils.saveTokens("acc-1", "ref-1");

    expect(tokenUtils.getAccessToken()).toBe("acc-1");
    expect(tokenUtils.getRefreshToken()).toBe("ref-1");
  });

  it("saveTokens stores user data in localStorage", async () => {
    const user = { id: "u1", email: "a@example.com" };
    await tokenUtils.saveTokens("acc-1", "ref-1", user);

    expect(tokenUtils.getUserData()).toEqual(user);
  });

  it("saveTokens does not store refresh token when omitted", async () => {
    await tokenUtils.saveTokens("acc-1");
    expect(tokenUtils.getRefreshToken()).toBeNull();
  });

  it("getUserData returns null for missing localStorage entry", () => {
    expect(tokenUtils.getUserData()).toBeNull();
  });

  it("getUserData returns null for invalid JSON", () => {
    localStorage.setItem("user_data", "{not-valid-json");
    expect(tokenUtils.getUserData()).toBeNull();
  });

  it("checkTokenStatus reports correct flags", async () => {
    localStorage.setItem("user_data", JSON.stringify({ id: "u1" }));
    document.cookie = "access_token=acc; path=/";

    const status = await tokenUtils.checkTokenStatus();
    expect(status).toEqual({
      accessToken: true,
      refreshToken: false,
      userData: true,
    });
  });

  it("clearAllTokens removes cookies and localStorage", async () => {
    localStorage.setItem("user_data", JSON.stringify({ id: "u1" }));
    document.cookie = "access_token=acc; path=/";
    document.cookie = "refresh_token=ref; path=/";

    await tokenUtils.clearAllTokens();

    expect(tokenUtils.getAccessToken()).toBeNull();
    expect(tokenUtils.getRefreshToken()).toBeNull();
    expect(tokenUtils.getUserData()).toBeNull();
  });
});
