// VietQR bank transfer config — BIDV payment integration.
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
 * Tạo cú pháp chuyển khoản tiêu chuẩn cho học viên.
 * Ví dụ: `CLA 101` hoặc `CLA <paymentId>`
 */
export function buildTransferContent(paymentIdOrEmail: string | number): string {
  const clean = String(paymentIdOrEmail).trim().toUpperCase();
  if (clean.startsWith("CLA")) return clean;
  return `CLA ${clean}`;
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

