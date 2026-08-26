// VietQR bank transfer config — BIDV payment integration + pricing helpers dùng chung client/server.
export const PAYMENT_CONFIG = {
  beneficiaryAccount: "2153126487",
  beneficiaryName: "HOANG THI THANH HA",
  bankId: "BIDV",
  bankBin: "970418",
  bankFullName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
  qrTemplate: "compact2",
} as const;

/** Format giá VND. */
export function formatVnd(price?: number | null): string {
  if (price == null || Number.isNaN(price)) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

/** Bỏ dấu + viết hoa cho accountName trong VietQR. */
function formatAccountName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "+")
    .toUpperCase();
}

/**
 * Build URL ảnh QR VietQR động chuẩn Platform VietQR.
 * @param amount Số tiền VND
 * @param content Nội dung chuyển khoản
 * @param template Giao diện QR (compact2, compact, qr_only, print)
 */
export function buildVietQrUrl({
  amount,
  content,
  template = PAYMENT_CONFIG.qrTemplate,
}: {
  amount: number;
  content: string;
  template?: string;
}): string {
  const accountName = formatAccountName(PAYMENT_CONFIG.beneficiaryName);
  const encodedContent = encodeURIComponent(content);
  return `https://img.vietqr.io/image/${PAYMENT_CONFIG.bankId}-${PAYMENT_CONFIG.beneficiaryAccount}-${template}.png?amount=${amount}&addInfo=${encodedContent}&accountName=${accountName}`;
}

/** Dữ liệu giá trị voucher cần để tính giảm giá (subset của Voucher type). */
export interface VoucherValueLike {
  value?: number | string | null;
  is_percent?: boolean | null;
}

/**
 * Tính số tiền giảm từ voucher cho giá gói (pure — dùng chung client preview + server compute).
 * Giảm cố định (VND) hoặc theo %, luôn cap tại giá gói, không âm.
 */
export function computePricing(
  priceVnd: number | null | undefined,
  voucher?: VoucherValueLike | null,
): { discountVnd: number; amountVnd: number } {
  const base = priceVnd ?? 0;
  if (!voucher?.value) return { discountVnd: 0, amountVnd: base };
  const raw =
    voucher.is_percent === true ? (base * Number(voucher.value)) / 100 : Number(voucher.value);
  if (!Number.isFinite(raw)) return { discountVnd: 0, amountVnd: base };
  const discountVnd = Math.max(0, Math.min(Math.round(raw), base));
  return { discountVnd, amountVnd: base - discountVnd };
}

/** Kiểm tra voucher còn hiệu lực (hạn dùng, số lượt). Trả về lỗi nếu không hợp lệ, null nếu OK. */
export function validateVoucher<T extends VoucherValueLike & {
  max_uses?: number | null;
  used_count?: number;
  valid_from?: string | null;
  valid_until?: string | null;
}>(voucher: T | null | undefined): string | null {
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
