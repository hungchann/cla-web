import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import {
  buildAffiliateLink,
  getAccountPlans,
  resolvePlanFeatures,
  buildCheckoutUrl,
  createPayment,
  getMyPayments,
  applyVoucher,
  isVoucherValid,
  getVoucherByCode,
} from "@/api/plans";
import type { Voucher } from "@/lib/types/plan";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("voucher", () => {
  it("applies fixed VND discount and caps at plan price", () => {
    const plan = { id: 1, key: "yearly", price_vnd: 599000 };
    const voucher: Voucher = { id: 1, code: "X", value: 100000, is_percent: false };
    expect(applyVoucher(plan, voucher)).toEqual({ discountVnd: 100000, amountVnd: 499000 });
    const huge: Voucher = { id: 2, code: "Y", value: 999999, is_percent: false };
    expect(applyVoucher(plan, huge)).toEqual({ discountVnd: 599000, amountVnd: 0 });
  });

  it("applies percent discount rounded", () => {
    const plan = { id: 1, key: "yearly", price_vnd: 599000 };
    const voucher: Voucher = { id: 3, code: "Z", value: 20, is_percent: true };
    expect(applyVoucher(plan, voucher)).toEqual({ discountVnd: 119800, amountVnd: 479200 });
  });

  it("no discount without voucher", () => {
    expect(applyVoucher({ id: 1, key: "yearly", price_vnd: 599000 }, null)).toEqual({
      discountVnd: 0,
      amountVnd: 599000,
    });
  });

  it("isVoucherValid checks usage limit and expiry", () => {
    const full: Voucher = { id: 1, code: "X", value: 10, max_uses: 1, used_count: 1, is_percent: false };
    expect(isVoucherValid(full)).toBeTruthy();
    const expired: Voucher = {
      id: 2,
      code: "Y",
      value: 10,
      is_percent: false,
      valid_until: "2000-01-01T00:00:00.000Z",
    };
    expect(isVoucherValid(expired)).toBeTruthy();
    const ok: Voucher = { id: 3, code: "Z", value: 10, max_uses: 5, used_count: 1, is_percent: false };
    expect(isVoucherValid(ok)).toBeNull();
    expect(isVoucherValid(null)).toBeTruthy();
  });

  it("getVoucherByCode fetches a published voucher", async () => {
    server.use(
      http.get(`${API}/items/vouchers*`, ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("filter[code][_eq]");
        return HttpResponse.json({
          data: [{ id: 7, code, name: "Ưu đãi", value: 100, is_percent: false, used_count: 0 }],
        });
      }),
    );
    const voucher = await getVoucherByCode("SUN10");
    expect(voucher).toMatchObject({ id: 7, code: "SUN10", value: 100, is_percent: false });
  });

  it("getVoucherByCode returns null for unknown code", async () => {
    server.use(
      http.get(`${API}/items/vouchers*`, () => HttpResponse.json({ data: [] })),
    );
    expect(await getVoucherByCode("NOPE")).toBeNull();
  });
});

describe("getAccountPlans", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("fetches published plans sorted by sort", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${API}/items/account_plans*`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          data: [
            { id: 1, key: "monthly", name: "Premium Tháng", price_vnd: 99000, is_premium: true, status: "published" },
            { id: 2, key: "yearly", name: "Premium Năm", price_vnd: 499000, is_premium: true, status: "published" },
          ],
        });
      }),
    );

    const plans = await getAccountPlans();

    expect(requestedUrl).toContain("/items/account_plans");
    expect(requestedUrl).toContain("filter[status][_eq]=published");
    expect(requestedUrl).toContain("sort=sort");
    expect(plans).toHaveLength(2);
    expect(plans[0].key).toBe("monthly");
  });

  it("returns empty array on server error", async () => {
    server.use(
      http.get(`${API}/items/account_plans*`, () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    );
    expect(await getAccountPlans()).toEqual([]);
  });
});

describe("resolvePlanFeatures", () => {
  it("splits newline-separated features", () => {
    expect(resolvePlanFeatures({ id: 1, features: "A\nB\nC" })).toEqual(["A", "B", "C"]);
  });

  it("maps array features", () => {
    expect(resolvePlanFeatures({ id: 1, features: ["x", "y"] })).toEqual(["x", "y"]);
  });

  it("returns empty array when features missing", () => {
    expect(resolvePlanFeatures(null)).toEqual([]);
    expect(resolvePlanFeatures(undefined)).toEqual([]);
    expect(resolvePlanFeatures({ id: 1 })).toEqual([]);
  });
});

describe("buildCheckoutUrl", () => {
  it("builds /pricing?plan=key for a plan", () => {
    expect(buildCheckoutUrl({ id: 2, key: "yearly" })).toBe("/pricing?plan=yearly");
  });

  it("falls back to plan id when no key", () => {
    expect(buildCheckoutUrl({ id: 5 })).toBe("/pricing?plan=5");
  });

  it("returns /pricing when no plan and no promo", () => {
    expect(buildCheckoutUrl(undefined)).toBe("/pricing");
  });

  it("appends promo to /pricing without plan", () => {
    expect(buildCheckoutUrl(undefined, "video-1")).toBe("/pricing?promo=video-1");
  });

  it("appends promo to plan url", () => {
    expect(buildCheckoutUrl({ id: 2, key: "yearly" }, "book-3")).toBe(
      "/pricing?plan=yearly&promo=book-3",
    );
  });

  it("uses plan upgrade_url as-is and appends promo", () => {
    expect(
      buildCheckoutUrl({ id: 2, upgrade_url: "https://partner.example/checkout" }, "ref-9"),
    ).toBe("https://partner.example/checkout?promo=ref-9");
  });
});

describe("buildAffiliateLink", () => {
  it("builds a shareable /pricing?ref=<userId> link", () => {
    expect(buildAffiliateLink("user-abc")).toContain("/pricing?ref=user-abc");
  });

  it("encodes numeric id", () => {
    expect(buildAffiliateLink(42)).toContain("/pricing?ref=42");
  });
});

describe("createPayment", () => {
  beforeEach(() => {
    document.cookie = "access_token=tok-123";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("posts plan + voucher code to /api/payments (amount decided server-side)", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    let capturedAuth: string | null = null;
    server.use(
      http.post("*/api/payments", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json(
          {
            payment: { id: 10, status: "pending" },
            amountVnd: 479200,
            discountVnd: 119800,
            duplicate: false,
          },
          { status: 201 },
        );
      }),
    );

    const result = await createPayment({
      plan: { id: 2 },
      voucherCode: "X20",
      promoLinkId: "video-1",
      referrerUserId: "user-ref-9",
    });

    expect(capturedBody).toEqual({
      planId: 2,
      voucherCode: "X20",
      promoLinkId: "video-1",
      referrerUserId: "user-ref-9",
    });
    expect(capturedAuth).toBe("Bearer tok-123");
    expect(result).toMatchObject({
      payment: { id: 10, status: "pending" },
      amountVnd: 479200,
      discountVnd: 119800,
      duplicate: false,
    });
  });

  it("returns null when access token missing", async () => {
    document.cookie = "";
    const result = await createPayment({ plan: { id: 2 } });
    expect(result).toBeNull();
  });

  it("returns null on API error", async () => {
    server.use(
      http.post("*/api/payments", () =>
        HttpResponse.json({ error: "Gói cước không khả dụng." }, { status: 400 }),
      ),
    );

    const result = await createPayment({ plan: { id: 2 }, voucherCode: "BAD" });
    expect(result).toBeNull();
  });
});

describe("getMyPayments", () => {
  beforeEach(() => {
    document.cookie = "access_token=tok-123";
  });

  afterEach(() => {
    document.cookie = "";
    vi.restoreAllMocks();
  });

  it("fetches payment history from /api/payments", async () => {
    server.use(
      http.get("*/api/payments", ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer tok-123");
        return HttpResponse.json({
          payments: [{ id: 3, status: "verified", amount_vnd: 599000 }],
        });
      }),
    );

    const payments = await getMyPayments();
    expect(payments).toEqual([{ id: 3, status: "verified", amount_vnd: 599000 }]);
  });

  it("returns empty array when unauthenticated", async () => {
    document.cookie = "";
    expect(await getMyPayments()).toEqual([]);
  });
});
