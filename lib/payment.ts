// VietQR bank transfer config — reuse payment-CLA logic.
export const PAYMENT_CONFIG = {
  beneficiaryAccount: "2153126487",
  beneficiaryName: "HOANG THI THANH HA",
  bankId: "BIDV",
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
 * Build URL ảnh QR VietQR.
 * @param amount Số tiền VND
 * @param content Nội dung chuyển khoản (thường là email user)
 */
export function buildVietQrUrl({
  amount,
  content,
}: {
  amount: number;
  content: string;
}): string {
  const accountName = formatAccountName(PAYMENT_CONFIG.beneficiaryName);
  const encodedContent = encodeURIComponent(content);
  return `https://img.vietqr.io/image/${PAYMENT_CONFIG.bankId}-${PAYMENT_CONFIG.beneficiaryAccount}-${PAYMENT_CONFIG.qrTemplate}.png?amount=${amount}&addInfo=${encodedContent}&accountName=${accountName}`;
}
