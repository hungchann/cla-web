/** Gói cước trong Directus `account_plans`. */
export interface AccountPlan {
  id: string | number;
  key?: string | null;
  name?: string | null;
  name_trans?: string | null;
  description?: string | null;
  price_vnd?: number | null;
  original_price_vnd?: number | null;
  duration_days?: number | null;
  is_premium?: boolean;
  is_featured?: boolean;
  /** Nhiều dòng hoặc JSON array. */
  features?: string | string[] | null;
  /** Upgrade/checkout link (affiliate link) mặc định. */
  upgrade_url?: string | null;
  sort?: number | null;
  status?: string | null;
}

export type PaymentStatus = "pending" | "paid" | "verified" | "cancelled";

/** Giao dịch thanh toán trong Directus `payments`. */
export interface PaymentRecord {
  id?: string | number;
  user_id?: string | number | null;
  plan_id?: string | number | null;
  amount_vnd?: number | null;
  /** Số tiền đã giảm bởi voucher (VND). */
  discount_vnd?: number | null;
  /** Voucher áp dụng — FK vouchers. */
  voucher_id?: string | number | null;
  status?: PaymentStatus;
  transfer_content?: string | null;
  /** Attribution affiliate/ref (content promo). */
  promo_link_id?: string | number | null;
  /** Người cho link affiliate (referrer) — FK directus_users. */
  referrer_user_id?: string | number | null;
  verified_by?: string | null;
  verified_at?: string | null;
  /** Directus auto timestamp. */
  date_created?: string | null;
}

/** Mã giảm giá trong Directus `vouchers`. */
export interface Voucher {
  id: string | number;
  code?: string | null;
  name?: string | null;
  /** Giá trị giảm (float) — VND nếu is_percent=false, % nếu is_percent=true. */
  value?: number | null;
  is_percent?: boolean;
  max_uses?: number | null;
  used_count?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  status?: string;
}
