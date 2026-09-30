// Free/premium helpers — mirror CHINESE-LEARNING-APP premiumStorage rules.
// Canonical source: Directus `account_types.type` (name) + `is_active`.

/** Tên gói được coi là premium (so khớp case-insensitive) — đồng bộ 100% với mobile. */
export const PREMIUM_ACCOUNT_TYPE_NAMES = new Set(["premium", "lifetime", "yearly"]);

/** Tên gói chắc chắn KHÔNG phải premium. */
export const FREE_ACCOUNT_TYPE_NAMES = new Set(["free", "standard", "basic"]);

/**
 * Chuẩn hóa tên gói: lowercase + trim + bỏ dấu tiếng Việt để chấp nhận
 * giá trị hiển thị mà admin hay nhập trong Directus (vd: "Hàng năm" -> "hang nam").
 */
export function normalizeAccountTypeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Map alias (đã chuẩn hóa, không dấu) về canonical type. */
const ACCOUNT_TYPE_ALIASES: Record<string, string> = {
  premium: "premium",
  lifetime: "lifetime",
  "vinh vien": "lifetime",
  yearly: "yearly",
  "hang nam": "yearly",
  nam: "yearly",
  free: "free",
  "co ban": "free",
  standard: "free",
  basic: "free",
};

/** Canonical type của tên gói (vd: "Hàng năm" -> "yearly"). Không rõ thì null. */
export function getCanonicalAccountType(name: string | null | undefined): string | null {
  if (!name) return null;
  const normalized = normalizeAccountTypeName(name);
  return ACCOUNT_TYPE_ALIASES[normalized] ?? null;
}

/** Tên hiển thị tiếng Việt cho từng loại gói (dùng cho UI, tránh lộ raw "Yearly"). */
const ACCOUNT_TYPE_DISPLAY_NAMES: Record<string, string> = {
  premium: "Premium",
  lifetime: "Vĩnh viễn",
  yearly: "Hàng năm",
  free: "Miễn phí",
};

/** Tên gói dạng hiển thị thân thiện (vd: "Yearly" -> "Hàng năm"). Không rõ thì giữ nguyên. */
export function getAccountTypeDisplayName(name: string | null | undefined): string {
  if (!name) return "Miễn phí";
  const canonical = getCanonicalAccountType(name);
  if (canonical && ACCOUNT_TYPE_DISPLAY_NAMES[canonical]) {
    return ACCOUNT_TYPE_DISPLAY_NAMES[canonical];
  }
  return name.trim();
}

/** Giới hạn số bài tập miễn phí (mobile: completedExerciseCount >= 2 → khóa). */
export const FREE_EXERCISE_LIMIT = 2;

/** Giới hạn số sổ tay từ vựng cá nhân miễn phí (mobile: >= 1 → khóa). */
export const FREE_NOTEBOOK_LIMIT = 1;

/** Cache premium per-user (localStorage) — TTL 5 phút, scoped theo userId. */
export const PREMIUM_CACHE_KEY = "cla_premium_status";
export const PREMIUM_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Bộ đếm số bài tập Free đã HOÀN THÀNH (mirror CHINESE-LEARNING-APP exerciseStorage:
 * tăng khi nộp/hoàn thành bài, không phải khi mở bài). Key: `cla_exercise_completed_count`.
 */
export const COMPLETED_EXERCISE_COUNT_KEY = "cla_exercise_completed_count";

/** Đọc số bài tập Free đã hoàn thành. */
export function getCompletedExerciseCount(): number {
  try {
    const value = window.localStorage.getItem(COMPLETED_EXERCISE_COUNT_KEY);
    return value ? Number.parseInt(value, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Tăng số bài tập đã hoàn thành lên 1, trả về giá trị mới. */
export function incrementCompletedExerciseCount(): number {
  try {
    const next = getCompletedExerciseCount() + 1;
    window.localStorage.setItem(COMPLETED_EXERCISE_COUNT_KEY, String(next));
    return next;
  } catch {
    return getCompletedExerciseCount();
  }
}

/** Reset bộ đếm (testing / logout). */
export function resetCompletedExerciseCount(): void {
  try {
    window.localStorage.setItem(COMPLETED_EXERCISE_COUNT_KEY, "0");
  } catch {
    // ignore
  }
}

export interface AccountTypeInfo {
  id?: string | number | null;
  name?: string | null;
  type?: string | null;
  is_active?: boolean;
}

/**
 * Kiểm tra 1 account type có phải premium không.
 * - Không active → false.
 * - Nằm trong FREE set → false.
 * - Nằm trong PREMIUM set → true.
 * - Khác (không rõ) → mặc định không premium (an toàn, tránh cấp nhầm).
 * Chấp nhận alias tiếng Việt không dấu (vd: "Hàng năm" -> yearly).
 */
export function isPremiumAccountType(
  name: string | null | undefined,
  isActive = true,
): boolean {
  if (!isActive) return false;
  if (!name) return false;
  const canonical =
    getCanonicalAccountType(name) ?? normalizeAccountTypeName(name);
  if (FREE_ACCOUNT_TYPE_NAMES.has(canonical)) return false;
  return PREMIUM_ACCOUNT_TYPE_NAMES.has(canonical);
}

/**
 * Parse response của flow `ACCOUNT_TYPE_FLOW` (hoặc REST mapped shape)
 * `{ user_profiles: [{ account_type_id: { id, name }, is_active }] }`.
 */
interface ProfileLike {
  account_type_id?: { name?: unknown; type?: unknown } | null;
  is_active?: boolean;
}

function getTypeName(profile: ProfileLike): string | null {
  const t = profile.account_type_id;
  const v = t?.name ?? t?.type;
  return typeof v === "string" ? v : null;
}

function getIsActive(profile: ProfileLike): boolean {
  return profile.is_active !== false;
}

/**
 * Parse response của flow `ACCOUNT_TYPE_FLOW` (hoặc REST mapped shape)
 * `{ user_profiles: [{ account_type_id: { id, name }, is_active }] }`.
 */
export function resolvePremiumFromAccountType(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const profiles = (data as { user_profiles?: unknown }).user_profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) return false;

  const typed = profiles as ProfileLike[];
  const best =
    typed.find((p) => isPremiumAccountType(getTypeName(p), getIsActive(p))) ?? typed[0];

  return isPremiumAccountType(getTypeName(best), getIsActive(best));
}

/** Lấy tên account type của user hiện tại từ response flow. */
export function getAccountTypeName(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const profiles = (data as { user_profiles?: unknown }).user_profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) return null;
  const t = (profiles[0] as ProfileLike).account_type_id;
  const v = t?.name ?? t?.type;
  return typeof v === "string" ? v : null;
}

export type AccessTier = "free" | "premium";

/**
 * Chuẩn hoá field `access_tier` về `free | premium`.
 * Chỉ `premium` là trả tiền. `registered` (đã bỏ theo contract), rỗng, và giá trị
 * lạ → `free` (mặc định an toàn: không khoá nhầm nội dung chưa tick).
 * Chấp nhận admin nhập hoa/thường/thừa dấu cách.
 */
export function normalizeAccessTier(value: unknown): AccessTier {
  return normalizeAccountTypeName(typeof value === "string" ? value : "") === "premium"
    ? "premium"
    : "free";
}

/** Item content có phải trả tiền không (theo field `access_tier`). */
export function isPremiumTier(item?: { access_tier?: string | null } | null): boolean {
  return normalizeAccessTier(item?.access_tier) === "premium";
}

/**
 * Cổng chung mọi loại content: item `access_tier=premium` bị khoá với user Free.
 * Dùng để áp 1 lớp gate đồng nhất lên course / video / bài đọc / truyện.
 */
export function isTierLocked(
  item: { access_tier?: string | null } | null | undefined,
  isPremium: boolean,
): boolean {
  return !isPremium && isPremiumTier(item);
}

/** @deprecated dùng `isPremiumTier` — giữ tên cũ để không phá call site. */
export const isCoursePremium = isPremiumTier;

/**
 * Tag chương "Học thử miễn phí" — legacy/fallback. Ưu tiên `is_free_preview`.
 * Normalize bỏ dấu để chấp nhận "Học thử", "học thử miễn phí"...
 */
export function isFreePreviewTag(tag?: string | null): boolean {
  const t = normalizeAccountTypeName(tag ?? "");
  return t.includes("hoc thu") || t.includes("mien phi") || t.includes("free");
}

/**
 * Chương học thử (dùng chung course_chapters + book_chapters):
 * `is_free_preview` (Directus trả INT 0/1) HOẶC tag "Học thử miễn phí".
 */
export function isFreePreviewChapter(
  chapter?: { tag?: string | null; is_free_preview?: boolean | number | null } | null,
): boolean {
  if (!chapter) return false;
  return Boolean(chapter.is_free_preview) || isFreePreviewTag(chapter.tag);
}

/**
 * Kiểm tra quyền đọc chương sách/truyện.
 * - Paid User (isPremium=true): Toàn quyền đọc mọi chương.
 * - Free / Guest User: chương `is_free_preview` / tag học thử, hoặc chương đầu.
 */
export function canAccessStoryChapter(
  chapter?: { sort_id?: string | number | null; is_free_preview?: boolean | number | null; tag?: string | null } | null,
  chapterIndex = 0,
  isPremium = false,
): boolean {
  if (isPremium) return true;
  if (!chapter) return chapterIndex === 0;
  if (isFreePreviewChapter(chapter)) return true;
  const sort = Number(chapter.sort_id);
  return sort === 1 || chapterIndex === 0;
}

/**
 * Kiểm tra quyền mở 1 lesson trong khóa học.
 * - Premium user: toàn quyền.
 * - Course free (`access_tier` free/rỗng): mọi lesson mở.
 * - Course premium: Free chỉ mở lesson có `is_free_preview` (INT 0/1) hoặc
 *   thuộc chương học thử (is_free_preview của chương / tag "Học thử miễn phí").
 */
export function canAccessCourseLesson(
  course: { access_tier?: string | null } | null,
  lesson?: { is_free_preview?: boolean | number | null } | null,
  isPremium = false,
  chapter?: { tag?: string | null; is_free_preview?: boolean | number | null } | null,
): boolean {
  if (isPremium) return true;
  if (!isPremiumTier(course)) return true;
  if (Boolean(lesson?.is_free_preview)) return true;
  return isFreePreviewChapter(chapter);
}

