import { describe, it, expect } from "vitest";
import {
  googleAuthErrorMessage,
  GOOGLE_AUTH_FALLBACK_MESSAGE,
} from "@/lib/googleAuthErrors";

describe("googleAuthErrorMessage", () => {
  it("maps INVALID_PROVIDER to the account-linking hint", () => {
    const msg = googleAuthErrorMessage("INVALID_PROVIDER");
    expect(msg).toContain("chưa liên kết Google");
    expect(msg).toContain("mật khẩu");
  });

  it("maps known Directus reason codes", () => {
    expect(googleAuthErrorMessage("INVALID_CREDENTIALS")).toContain("Không thể xác thực");
    expect(googleAuthErrorMessage("INVALID_TOKEN")).toContain("hết hạn");
    expect(googleAuthErrorMessage("SERVICE_UNAVAILABLE")).toContain("tạm thời không khả dụng");
    expect(googleAuthErrorMessage("INVALID_PROVIDER_CONFIG")).toContain("Cấu hình");
    expect(googleAuthErrorMessage("USER_SUSPENDED")).toContain("tạm khóa");
  });

  it("is case-insensitive and trims", () => {
    expect(googleAuthErrorMessage(" invalid_provider ")).toContain("chưa liên kết Google");
  });

  it("falls back for unknown / UNKNOWN_EXCEPTION / empty reasons", () => {
    expect(googleAuthErrorMessage("UNKNOWN_EXCEPTION")).toBe(GOOGLE_AUTH_FALLBACK_MESSAGE);
    expect(googleAuthErrorMessage("SOMETHING_NEW")).toBe(GOOGLE_AUTH_FALLBACK_MESSAGE);
    expect(googleAuthErrorMessage("")).toBe(GOOGLE_AUTH_FALLBACK_MESSAGE);
    expect(googleAuthErrorMessage(null)).toBe(GOOGLE_AUTH_FALLBACK_MESSAGE);
    expect(googleAuthErrorMessage(undefined)).toBe(GOOGLE_AUTH_FALLBACK_MESSAGE);
  });

  it("does not leak the old misleading 'liên hệ hỗ trợ để liên kết' wording by default", () => {
    expect(GOOGLE_AUTH_FALLBACK_MESSAGE).not.toContain("liên hệ hỗ trợ để liên kết tài khoản");
  });
});
