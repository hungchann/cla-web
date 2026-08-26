import apiInstance from "@/api/authConfig";
import { logger } from "@/services/logger";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import {
  computePricing,
  validateVoucher,
} from "@/lib/payment";
import type {
  AccountPlan,
  PaymentRecord,
  PaymentStatus,
  Voucher,
} from "@/lib/types/plan";

type ErrorLike = { response?: { status?: number }; message?: string };

function errorStatus(error: unknown): string | number | undefined {
  if (!error || typeof error !== "object") return undefined;
  return (error as ErrorLike).response?.status ?? (error as ErrorLike).message ?? "unknown";
}

/** Lấy danh sách gói cước đã published từ Directus `account_plans`. */
export async function getAccountPlans(): Promise<AccountPlan[]> {
  try {
    const r = await apiInstance.get(
      "/items/account_plans?filter[status][_eq]=published&sort=sort",
    );
    return r.data?.data || [];
  } catch (error) {
    logger.warn("[Plans API] getAccountPlans failed:", errorStatus(error));
    return [];
  }
}

export async function getAccountPlanById(id: string | number): Promise<AccountPlan | null> {
  try {
    const r = await apiInstance.get(`/items/account_plans/${id}`);
    return r.data?.data || null;
  } catch (error) {
    logger.warn(
      `[Plans API] getAccountPlanById(${id}) failed:`,
      errorStatus(error),
    );
    return null;
  }
}

/** Parse field `features` (text nhiều dòng hoặc JSON array). */
export function resolvePlanFeatures(plan: AccountPlan | null | undefined): string[] {
  if (!plan) return [];
  const f = plan.features;
  if (Array.isArray(f)) return f.map(String);
  if (typeof f === "string") {
    return f
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Checkout/upgrade link cho nội dung: ưu tiên url của plan, fallback /pricing.
 * `promo` là attribution content (vd "video-1") → lưu vào payments.promo_link_id.
 */
export function buildCheckoutUrl(plan?: AccountPlan | null, promo?: string | null): string {
  let base: string;
  if (plan?.upgrade_url) {
    base = plan.upgrade_url;
  } else if (plan) {
    base = `/pricing?plan=${encodeURIComponent(String(plan.key ?? plan.id))}`;
  } else {
    base = "/pricing";
  }
  if (promo) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}promo=${encodeURIComponent(promo)}`;
  }
  return base;
}

/**
 * Link giới thiệu (affiliate) của user: người khác bấm link này để đăng ký premium,
 * khi họ mua sẽ lưu `payments.referrer_user_id` = chính userId này.
 */
export function buildAffiliateLink(userId: string | number): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/pricing?ref=${encodeURIComponent(String(userId))}`;
}

/** Lấy voucher published theo code voucher. */
export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  try {
    const clean = code.trim();
    if (!clean) return null;
    const r = await apiInstance.get(
      `/items/vouchers?filter[code][_eq]=${encodeURIComponent(clean)}&filter[status][_eq]=published&limit=1`,
    );
    const row = r.data?.data?.[0] || null;
    if (!row) return null;
    return {
      ...row,
      is_percent: Boolean(row.is_percent),
      value: typeof row.value === "number" ? row.value : Number(row.value ?? 0),
    };
  } catch (error) {
    logger.warn("[Plans API] getVoucherByCode failed:", errorStatus(error));
    return null;
  }
}

/**
 * Kiểm tra voucher còn hiệu lực (hạn dùng, số lượt).
 * Logic canonical nằm ở `lib/payment.ts#validateVoucher`.
 */
export function isVoucherValid(voucher: Voucher | null): string | null {
  return validateVoucher(voucher);
}

/**
 * Tính số tiền giảm từ voucher cho gói — preview phía client.
 * Số tiền chính thức do server `/api/payments` quyết định khi tạo payment.
 */
export function applyVoucher(plan: AccountPlan, voucher: Voucher | null) {
  return computePricing(plan.price_vnd, voucher);
}

export type PaymentStatusType = PaymentStatus;

/** Kết quả tạo payment qua server. */
export interface CreatePaymentResult {
  payment: PaymentRecord;
  amountVnd?: number;
  discountVnd?: number;
  /** true nếu đã có đơn pending trùng user+plan, hệ thống trả lại đơn cũ. */
  duplicate: boolean;
}

/**
 * Tạo payment pending qua route handler `/api/payments` (amount tính server-side,
 * client KHÔNG tự gửi số tiền). Trả về null nếu lỗi network/không đăng nhập.
 */
export async function createPayment(input: {
  plan: Pick<AccountPlan, "id">;
  voucherCode?: string | null;
  promoLinkId?: string | number | null;
  referrerUserId?: string | number | null;
}): Promise<CreatePaymentResult | null> {
  try {
    const token = tokenUtils.getAccessToken();
    if (!token) return null;

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId: input.plan.id,
        voucherCode: input.voucherCode ?? null,
        promoLinkId: input.promoLinkId ?? null,
        referrerUserId: input.referrerUserId ?? null,
      }),
    });

    if (!res.ok) {
      let message = "";
      try {
        message = ((await res.json()) as { error?: string }).error ?? "";
      } catch {
        // ignore parse errors
      }
      logger.warn("[Plans API] createPayment failed:", res.status, message);
      return null;
    }

    return (await res.json()) as CreatePaymentResult;
  } catch (error) {
    logger.warn("[Plans API] createPayment error:", errorStatus(error));
    return null;
  }
}

/** Lịch sử payment của user hiện tại (qua route handler). */
export async function getMyPayments(): Promise<PaymentRecord[]> {
  try {
    const token = tokenUtils.getAccessToken();
    if (!token) return [];

    const res = await fetch("/api/payments", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logger.warn("[Plans API] getMyPayments failed:", res.status);
      return [];
    }
    const json = (await res.json()) as { payments?: PaymentRecord[] };
    return json.payments ?? [];
  } catch (error) {
    logger.warn("[Plans API] getMyPayments error:", errorStatus(error));
    return [];
  }
}
