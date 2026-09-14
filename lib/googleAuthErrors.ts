/**
 * Map mã lỗi Directus (query `?reason=` trên redirect callback Google SSO)
 * sang thông báo tiếng Việt dễ hiểu.
 *
 * Directus `openid.js` khi login lỗi sẽ redirect:
 *   `${redirect.split('?')[0]}?reason=${error.code ?? 'UNKNOWN_EXCEPTION'}`
 * Danh sách code: @directus/errors `ErrorCode` (xem Directus v11 `packages/errors/src/codes.ts`).
 */

/** Thông báo chung khi không xác định được nguyên nhân (hoặc không có `reason`). */
export const GOOGLE_AUTH_FALLBACK_MESSAGE =
  "Đăng nhập bằng Google thất bại. Vui lòng thử lại, hoặc dùng cách đăng nhập khác.";

const MESSAGES: Record<string, string> = {
  // Email đã tồn tại nhưng chưa liên kết Google (RecordNotUnique → InvalidProviderError).
  INVALID_PROVIDER:
    "Email này đã có tài khoản mật khẩu trên hệ thống nhưng chưa liên kết Google. Hãy đăng nhập bằng mật khẩu, hoặc liên hệ hỗ trợ để liên kết tài khoản.",
  // Không tìm thấy user + public registration tắt, hoặc provider không khớp.
  INVALID_CREDENTIALS:
    "Không thể xác thực với Google. Vui lòng thử lại hoặc dùng cách đăng nhập khác.",
  // Phiên/token SSO hết hạn hoặc không hợp lệ.
  INVALID_TOKEN: "Phiên xác thực Google đã hết hạn. Vui lòng thử đăng nhập lại.",
  // Provider/issuer phía Directus lỗi hoặc tạm thời không gọi được Google.
  SERVICE_UNAVAILABLE: "Dịch vụ đăng nhập Google tạm thời không khả dụng. Vui lòng thử lại sau ít phút.",
  INVALID_PROVIDER_CONFIG: "Cấu hình đăng nhập Google chưa hợp lệ. Vui lòng liên hệ hỗ trợ.",
  // Tài khoản bị tạm khóa.
  USER_SUSPENDED: "Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ hỗ trợ.",
};

/**
 * Trả về thông báo phù hợp với `reason` Directus trả về.
 * `UNKNOWN_EXCEPTION`, rỗng hoặc không nhận diện được → thông báo chung.
 */
export function googleAuthErrorMessage(reason?: string | null): string {
  const code = (reason ?? "").trim().toUpperCase();
  if (!code) return GOOGLE_AUTH_FALLBACK_MESSAGE;
  return MESSAGES[code] ?? GOOGLE_AUTH_FALLBACK_MESSAGE;
}
