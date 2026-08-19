import apiInstance from "@/api/authConfig";
import { logger } from "@/services/logger";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import type { AccountPlan, PaymentRecord, PaymentStatus, Voucher } from "@/lib/types/plan";

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

/** Kiểm tra voucher còn hiệu lực (hạn dùng, số lượt). */
export function isVoucherValid(voucher: Voucher | null): string | null {
  if (!voucher) return "Mã giảm giá không tồn tại hoặc đã bị khoá.";
  if (voucher.max_uses != null && (voucher.used_count ?? 0) >= voucher.max_uses) {
    return "Mã giảm giá đã hết lượt sử dụng.";
  }
  const now = new Date();
  if (voucher.valid_from && new Date(voucher.valid_from) > now) {
    return "Mã giảm giá chưa tới hạn sử dụng.";
  }
  if (voucher.valid_until && new Date(voucher.valid_until) < now) {
    return "Mã giảm giá đã hết hạn.";
  }
  return null;
}

/** Tính số tiền giảm từ voucher cho gói. Trả về { discountVnd, amountVnd }. */
export function applyVoucher(plan: AccountPlan, voucher: Voucher | null) {
  const base = plan.price_vnd ?? 0;
  if (!voucher?.value) return { discountVnd: 0, amountVnd: base };
  const discountVnd = voucher.is_percent
    ? Math.round((base * voucher.value) / 100)
    : Math.round(voucher.value);
  const capped = Math.max(0, Math.min(discountVnd, base));
  return { discountVnd: capped, amountVnd: base - capped };
}

/**
 * Lấy thông tin thanh toán theo ID.
 */
export async function getPaymentById(id: string | number): Promise<PaymentRecord | null> {
  try {
    const r = await apiInstance.get(`/items/payments/${id}`);
    return r.data?.data || null;
  } catch (error) {
    logger.warn(`[Plans API] getPaymentById(${id}) failed:`, errorStatus(error));
    return null;
  }
}

/**
 * Tạo bản ghi `payments` (status=pending) — chờ xác nhận rồi kích hoạt premium.
 * Lưu đủ: ai mua (`user_id`), gói nào (`plan_id`), ai giới thiệu (`referrer_user_id`),
 * nội dung nào dẫn tới (`promo_link_id`), voucher (`voucher_id` + `discount_vnd`).
 * Đồng thời ghi `user_vouchers` và tăng `used_count` của voucher.
 */
export async function createPayment(input: {
  plan: AccountPlan;
  amountVnd: number;
  discountVnd?: number;
  voucher?: Voucher | null;
  transferContent: string;
  promoLinkId?: string | number | null;
  referrerUserId?: string | number | null;
}): Promise<PaymentRecord | null> {
  try {
    const userData = tokenUtils.getUserData();
    const userId = userData?.id ?? userData?.user_id ?? null;

    const body: Record<string, unknown> = {
      plan_id: input.plan.id,
      amount_vnd: input.amountVnd,
      discount_vnd: input.discountVnd ?? 0,
      voucher_id: input.voucher?.id ?? null,
      status: "pending" as PaymentStatus,
      transfer_content: input.transferContent,
      promo_link_id: input.promoLinkId ?? null,
      referrer_user_id: input.referrerUserId ?? null,
    };
    if (userId != null) body.user_id = userId;


    const r = await apiInstance.post("/items/payments", body);
    const record = r.data?.data || null;

    // Ghi user_vouchers + tăng used_count nếu có voucher và đủ thông tin
    if (record && input.voucher?.id && userId != null) {
      try {
        await apiInstance.post("/items/user_vouchers", {
          user_id: userId,
          voucher_id: input.voucher.id,
          payment_id: record.id,
          status: "used",
        });
        await apiInstance.patch(`/items/vouchers/${input.voucher.id}`, {
          used_count: (input.voucher.used_count ?? 0) + 1,
        });
      } catch (err) {
        logger.warn("[Plans API] user_vouchers/voucher count update failed:", errorStatus(err));
      }
    }

    return record;
  } catch (error) {
    logger.warn("[Plans API] createPayment failed:", errorStatus(error));
    return null;
  }
}

/**
 * Kích hoạt hoặc gia hạn gói cước `account_types` cho người dùng sau khi thanh toán thành công.
 */
export async function activateUserSubscription(params: {
  userId: string | number;
  plan: AccountPlan;
  source?: "vietqr" | "revenuecat" | "manual";
  paymentId?: string | number;
}): Promise<boolean> {
  try {
    const { userId, plan, source = "vietqr", paymentId } = params;
    const durationDays = plan.duration_days ?? 0;
    const expiredTime = durationDays > 0
      ? new Date(Date.now() + durationDays * 86400000).toISOString()
      : null;

    const planName = plan.name_trans || plan.name || "Premium";

    // Kiểm tra xem user đã có dòng trong account_types chưa
    const checkRes = await apiInstance.get(
      `/items/account_types?filter[user_id][_eq]=${userId}&limit=1`,
    );
    const existing = checkRes.data?.data?.[0];

    const payload = {
      user_id: userId,
      type: planName,
      status: "active",
      source,
      plan_id: plan.id,
      expired_time: expiredTime,
      provider_transaction_id: paymentId ? String(paymentId) : null,
    };

    if (existing) {
      await apiInstance.patch(`/items/account_types/${existing.id}`, payload);
    } else {
      await apiInstance.post("/items/account_types", payload);
    }

    // Nếu có paymentId, cập nhật payment thành verified
    if (paymentId) {
      await apiInstance.patch(`/items/payments/${paymentId}`, {
        status: "verified",
        verified_at: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    logger.error("[Plans API] activateUserSubscription failed:", error);
    return false;
  }
}

