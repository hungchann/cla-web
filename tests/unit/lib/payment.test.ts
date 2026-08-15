import { describe, it, expect } from "vitest";
import { buildVietQrUrl, formatVnd, PAYMENT_CONFIG } from "@/lib/payment";

describe("formatVnd", () => {
  it("formats number with vi-VN thousand separators", () => {
    expect(formatVnd(99000)).toBe("99.000đ");
    expect(formatVnd(499000)).toBe("499.000đ");
    expect(formatVnd(999000)).toBe("999.000đ");
  });

  it("handles zero", () => {
    expect(formatVnd(0)).toBe("0đ");
  });

  it("returns 'Liên hệ' for null/undefined/NaN", () => {
    expect(formatVnd(null)).toBe("Liên hệ");
    expect(formatVnd(undefined)).toBe("Liên hệ");
    expect(formatVnd(Number.NaN)).toBe("Liên hệ");
  });
});

describe("buildVietQrUrl", () => {
  it("builds QR URL with amount and encoded content", () => {
    const url = buildVietQrUrl({ amount: 99000, content: "test@example.com" });
    expect(url).toContain("https://img.vietqr.io/image/BIDV-2153126487-compact2.png");
    expect(url).toContain("amount=99000");
    expect(url).toContain("addInfo=test%40example.com");
  });

  it("includes account name without diacritics, spaces as +", () => {
    const url = buildVietQrUrl({ amount: 100000, content: "a@b.com" });
    expect(url).toContain("accountName=HOANG+THI+THANH+HA");
  });

  it("uses config bank details", () => {
    expect(PAYMENT_CONFIG.beneficiaryAccount).toBe("2153126487");
    expect(PAYMENT_CONFIG.bankId).toBe("BIDV");
  });
});
