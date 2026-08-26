import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { POST, GET } from "@/app/api/payments/route";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";
const TOKEN = "Bearer test-token";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/payments", {
    method: "POST",
    headers: { Authorization: TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(): Request {
  return new Request("http://localhost/api/payments", {
    method: "GET",
    headers: { Authorization: TOKEN },
  });
}

function mockUser() {
  server.use(
    http.get(`${API}/users/me`, ({ request }) => {
      if (request.headers.get("authorization") !== TOKEN) {
        return HttpResponse.json({ errors: [] }, { status: 401 });
      }
      return HttpResponse.json({ data: { id: "user-1", email: "a@b.com" } });
    }),
  );
}

const PUBLISHED_PLAN = {
  id: 2,
  key: "yearly",
  price_vnd: 599000,
  is_premium: true,
  status: "published",
};

describe("POST /api/payments", () => {
  beforeEach(() => {
    mockUser();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("creates pending payment with server-computed amount and user_vouchers", async () => {
    const createdBodies: Record<string, unknown>[] = [];
    server.use(
      http.get(`${API}/items/account_plans/2`, () =>
        HttpResponse.json({ data: PUBLISHED_PLAN }),
      ),
      http.get(`${API}/items/vouchers*`, () =>
        HttpResponse.json({
          data: [{ id: 7, code: "X20", value: 20, is_percent: true, used_count: 0 }],
        }),
      ),
      http.get(`${API}/items/payments*`, () => HttpResponse.json({ data: [] })),
      http.post(`${API}/items/payments`, async ({ request }) => {
        createdBodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ data: { id: 10, status: "pending" } });
      }),
      http.post(`${API}/items/user_vouchers`, () =>
        HttpResponse.json({ data: { id: 1 } }),
      ),
    );

    const res = await POST(
      postRequest({ planId: 2, voucherCode: "X20", promoLinkId: "video-1" }),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { payment: { id: number }; amountVnd: number; discountVnd: number };
    expect(json.payment.id).toBe(10);
    // 599000 - 20% = 479200
    expect(json.amountVnd).toBe(479200);
    expect(json.discountVnd).toBe(119800);
    expect(createdBodies[0]).toMatchObject({
      plan_id: 2,
      user_id: "user-1",
      amount_vnd: 479200,
      discount_vnd: 119800,
      voucher_id: 7,
      status: "pending",
      transfer_content: "a@b.com",
      promo_link_id: "video-1",
    });
  });

  it("returns 401 when token missing", async () => {
    const res = await POST(
      new Request("http://localhost/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: 2 }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for unpublished plan", async () => {
    server.use(
      http.get(`${API}/items/account_plans/2`, () =>
        HttpResponse.json({ data: { ...PUBLISHED_PLAN, status: "draft" } }),
      ),
    );
    const res = await POST(postRequest({ planId: 2 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for expired voucher without creating payment", async () => {
    let paymentsPostCount = 0;
    server.use(
      http.get(`${API}/items/account_plans/2`, () =>
        HttpResponse.json({ data: PUBLISHED_PLAN }),
      ),
      http.get(`${API}/items/vouchers*`, () =>
        HttpResponse.json({
          data: [{ id: 8, code: "OLD", value: 1000, is_percent: false, valid_until: "2000-01-01T00:00:00.000Z" }],
        }),
      ),
      http.post(`${API}/items/payments`, () => {
        paymentsPostCount += 1;
        return HttpResponse.json({ data: {} });
      }),
    );

    const res = await POST(postRequest({ planId: 2, voucherCode: "OLD" }));
    expect(res.status).toBe(400);
    expect(paymentsPostCount).toBe(0);
  });

  it("is idempotent: returns existing pending payment instead of duplicating", async () => {
    let paymentsPostCount = 0;
    server.use(
      http.get(`${API}/items/account_plans/2`, () =>
        HttpResponse.json({ data: PUBLISHED_PLAN }),
      ),
      http.get(`${API}/items/vouchers*`, () => HttpResponse.json({ data: [] })),
      http.get(`${API}/items/payments*`, () =>
        HttpResponse.json({ data: [{ id: 9, status: "pending", amount_vnd: 599000 }] }),
      ),
      http.post(`${API}/items/payments`, () => {
        paymentsPostCount += 1;
        return HttpResponse.json({ data: {} });
      }),
    );

    const res = await POST(postRequest({ planId: 2 }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { duplicate: boolean; payment: { id: number } };
    expect(json.duplicate).toBe(true);
    expect(json.payment.id).toBe(9);
    expect(paymentsPostCount).toBe(0);
  });

  it("does not patch vouchers.used_count from the client flow", async () => {
    let voucherPatchCount = 0;
    server.use(
      http.get(`${API}/items/account_plans/2`, () =>
        HttpResponse.json({ data: PUBLISHED_PLAN }),
      ),
      http.get(`${API}/items/vouchers*`, () =>
        HttpResponse.json({ data: [{ id: 7, code: "X", value: 1000, is_percent: false }] }),
      ),
      http.get(`${API}/items/payments*`, () => HttpResponse.json({ data: [] })),
      http.post(`${API}/items/payments`, () =>
        HttpResponse.json({ data: { id: 11, status: "pending" } }),
      ),
      http.post(`${API}/items/user_vouchers`, () => HttpResponse.json({ data: { id: 1 } })),
      http.patch(`${API}/items/vouchers/*`, () => {
        voucherPatchCount += 1;
        return HttpResponse.json({ data: {} });
      }),
    );

    await POST(postRequest({ planId: 2, voucherCode: "X" }));
    expect(voucherPatchCount).toBe(0);
  });
});

describe("GET /api/payments", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("lists current user payments", async () => {
    let requestedUrl = "";
    mockUser();
    server.use(
      http.get(`${API}/items/payments*`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          data: [{ id: 3, status: "verified", amount_vnd: 599000 }],
        });
      }),
    );

    const res = await GET(getRequest());
    expect(res.status).toBe(200);
    const json = (await res.json()) as { payments: { id: number }[] };
    expect(json.payments).toHaveLength(1);
    const params = new URL(requestedUrl).searchParams;
    expect(params.get("filter[user_id][_eq]")).toBe("user-1");
    expect(params.get("sort")).toBe("-date_created");
  });

  it("returns 401 when unauthenticated", async () => {
    mockUser();
    const res = await GET(
      new Request("http://localhost/api/payments", { method: "GET" }),
    );
    expect(res.status).toBe(401);
  });
});
