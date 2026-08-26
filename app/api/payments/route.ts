import { NextResponse } from "next/server";
import axios from "axios";

import { computePricing, validateVoucher } from "@/lib/payment";
import { logger } from "@/services/logger";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

/** Axios server-side thuần — KHÔNG dùng apiInstance (interceptor của nó đọc localStorage). */
const directus = axios.create({
  baseURL: API,
  timeout: 20000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

type VoucherRow = {
  id: string | number;
  code?: string | null;
  name?: string | null;
  value?: number | string | null;
  is_percent?: boolean | null;
  max_uses?: number | null;
  used_count?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  status?: string | null;
};

interface PlanRow {
  id: string | number;
  key?: string | null;
  price_vnd?: number | null;
  is_premium?: boolean;
  status?: string | null;
}

function bearerFrom(request: Request): string | null {
  const header = (request.headers.get("authorization") ?? "").trim();
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || null;
  }
  return null;
}

function authHeaders(request: Request): Record<string, string> {
  const token = bearerFrom(request);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorResponse(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." },
        { status },
      );
    }
    logger.warn("[Payments API] Directus error:", status ?? error.message);
    return NextResponse.json({ error: fallbackMessage }, { status: 502 });
  }
  logger.error("[Payments API] unexpected error:", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

async function getCurrentUser(request: Request): Promise<{ id: string; email: string } | null> {
  try {
    const r = await directus.get("/users/me", {
      headers: authHeaders(request),
      params: { fields: "id,email" },
    });
    const user = r.data?.data;
    if (!user?.id) return null;
    return { id: String(user.id), email: String(user.email ?? "") };
  } catch {
    return null;
  }
}

/**
 * POST /api/payments — tạo payment pending với amount tính server-side.
 * Body: { planId, voucherCode?, promoLinkId?, referrerUserId? }
 */
export async function POST(request: Request) {
  let body: {
    planId?: string | number;
    voucherCode?: string | null;
    promoLinkId?: string | number | null;
    referrerUserId?: string | number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  if (!body?.planId) {
    return NextResponse.json({ error: "Thiếu planId." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." },
        { status: 401 },
      );
    }

    // 1. Plan phải published + premium
    let plan: PlanRow | null = null;
    try {
      const r = await directus.get(`/items/account_plans/${encodeURIComponent(String(body.planId))}`, {
        headers: authHeaders(request),
      });
      plan = r.data?.data ?? null;
    } catch {
      plan = null;
    }
    if (plan?.status !== "published" || plan.is_premium === false) {
      return NextResponse.json({ error: "Gói cước không khả dụng." }, { status: 400 });
    }

    // 2. Voucher (nếu có) — validate server-side
    let voucher: VoucherRow | null = null;
    const code = body.voucherCode?.trim();
    if (code) {
      const r = await directus.get("/items/vouchers", {
        headers: authHeaders(request),
        params: {
          "filter[code][_eq]": code,
          "filter[status][_eq]": "published",
          limit: 1,
        },
      });
      voucher = r.data?.data?.[0] ?? null;
      const invalid = validateVoucher(voucher);
      if (invalid) {
        return NextResponse.json({ error: invalid }, { status: 400 });
      }
    }

    // 3. Idempotency: trả lại đơn pending cũ thay vì tạo trùng
    const existingRes = await directus.get("/items/payments", {
      headers: authHeaders(request),
      params: {
        "filter[user_id][_eq]": user.id,
        "filter[plan_id][_eq]": String(plan.id),
        "filter[status][_eq]": "pending",
        limit: 1,
      },
    });
    const existing = existingRes.data?.data?.[0];
    if (existing) {
      return NextResponse.json({ payment: existing, duplicate: true }, { status: 200 });
    }

    // 4. Amount tính server-side — client không được tự khai báo số tiền
    const { discountVnd, amountVnd } = computePricing(plan.price_vnd, voucher);

    // 5. Tạo payment bằng token của chính user (giữ validation $CURRENT_USER)
    const created = await directus.post(
      "/items/payments",
      {
        plan_id: plan.id,
        user_id: user.id,
        amount_vnd: amountVnd,
        discount_vnd: discountVnd,
        voucher_id: voucher?.id ?? null,
        status: "pending",
        transfer_content: user.email,
        promo_link_id: body.promoLinkId ?? null,
        referrer_user_id: body.referrerUserId ?? null,
      },
      { headers: authHeaders(request) },
    );
    const payment = created.data?.data;

    // 6. Ghi user_vouchers (best-effort). used_count do Directus Flow tăng.
    if (payment && voucher) {
      try {
        await directus.post(
          "/items/user_vouchers",
          {
            user_id: user.id,
            voucher_id: voucher.id,
            payment_id: payment.id,
            status: "used",
          },
          { headers: authHeaders(request) },
        );
      } catch (err) {
        logger.warn("[Payments API] user_vouchers create failed:", err);
      }
    }

    return NextResponse.json({ payment, amountVnd, discountVnd, duplicate: false }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Không thể gửi yêu cầu thanh toán. Vui lòng thử lại sau.");
  }
}

/**
 * GET /api/payments — lịch sử payment của user hiện tại.
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." },
        { status: 401 },
      );
    }

    const r = await directus.get("/items/payments", {
      headers: authHeaders(request),
      params: {
        "filter[user_id][_eq]": user.id,
        sort: "-date_created",
        limit: 50,
        fields:
          "id,status,amount_vnd,discount_vnd,voucher_id,plan_id,transfer_content,promo_link_id,referrer_user_id,verified_at,date_created",
      },
    });

    return NextResponse.json({ payments: r.data?.data ?? [] }, { status: 200 });
  } catch (error) {
    return errorResponse(error, "Không thể tải lịch sử thanh toán.");
  }
}
