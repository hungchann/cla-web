// Lưu/đọc referrer (người cho link affiliate) giữa các trang, bền qua lần đăng ký.
export const REFERRER_KEY = "cla_referrer";

/** Lưu referrer user id vào localStorage khi user bấm link giới thiệu. */
export function saveReferrer(ref: string | null): void {
  if (!ref) return;
  try {
    window.localStorage.setItem(REFERRER_KEY, ref);
  } catch {
    // ignore
  }
}

/** Đọc referrer user id đã lưu (dùng khi tạo payment). */
export function getReferrer(): string | null {
  try {
    return window.localStorage.getItem(REFERRER_KEY);
  } catch {
    return null;
  }
}

/** Xóa referrer (dùng sau khi đã ghi nhận payment). */
export function clearReferrer(): void {
  try {
    window.localStorage.removeItem(REFERRER_KEY);
  } catch {
    // ignore
  }
}
