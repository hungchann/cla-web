// Free/premium helpers — mirror CHINESE-LEARNING-APP premiumStorage rules.
// Canonical source: Directus `account_types.type` (name) + `is_active`.

/** Tên gói được coi là premium (so khớp case-insensitive). */
export const PREMIUM_ACCOUNT_TYPE_NAMES = new Set([
  "premium",
  "lifetime",
  "yearly",
  "monthly",
  "weekly",
  "trial",
]);

/** Tên gói chắc chắn KHÔNG phải premium. */
export const FREE_ACCOUNT_TYPE_NAMES = new Set(["free", "standard", "basic"]);

/** Giới hạn số bài tập miễn phí (mobile: completedExerciseCount >= 2 → khóa). */
export const FREE_EXERCISE_LIMIT = 2;

/** Giới hạn số sổ tay từ vựng cá nhân miễn phí (mobile: >= 1 → khóa). */
export const FREE_NOTEBOOK_LIMIT = 1;

/** Cache premium per-user (localStorage) — TTL 5 phút, scoped theo userId. */
export const PREMIUM_CACHE_KEY = "cla_premium_status";
export const PREMIUM_CACHE_TTL_MS = 5 * 60 * 1000;

/** Danh sách lesson-id bài tập user Free đã mở (enforce FREE_EXERCISE_LIMIT bền qua phiên). */
export const FREE_EXERCISE_OPENS_KEY = "cla_free_exercise_opens";

/** Đọc danh sách bài tập user Free đã mở. */
export function getFreeExerciseOpens(): string[] {
  try {
    const raw = window.localStorage.getItem(FREE_EXERCISE_OPENS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Ghi nhận 1 bài tập user Free đã mở (idempotent theo lessonId). */
export function markExerciseOpened(lessonId: string | number): void {
  try {
    const opens = getFreeExerciseOpens();
    const id = String(lessonId);
    if (!opens.includes(id)) {
      window.localStorage.setItem(
        FREE_EXERCISE_OPENS_KEY,
        JSON.stringify([...opens, id]),
      );
    }
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
 */
export function isPremiumAccountType(
  name: string | null | undefined,
  isActive = true,
): boolean {
  if (!isActive) return false;
  if (!name) return false;
  const normalized = name.toLowerCase().trim();
  if (FREE_ACCOUNT_TYPE_NAMES.has(normalized)) return false;
  return PREMIUM_ACCOUNT_TYPE_NAMES.has(normalized);
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

/**
 * Kiểm tra xem người dùng có quyền đọc/học bài học trong khóa học không.
 * - Paid User (isPremium=true): Toàn quyền 100%.
 * - Free / Guest User: Chỉ được xem các bài có cờ `is_free_preview = true`.
 */
export function canAccessCourseLesson(
  lesson?: { is_free_preview?: boolean | null } | null,
  isPremium = false,
): boolean {
  if (isPremium) return true;
  if (!lesson) return false;
  return Boolean(lesson.is_free_preview);
}

/**
 * Kiểm tra quyền đọc chương sách/truyện.
 * - Paid User (isPremium=true): Toàn quyền đọc mọi chương.
 * - Free / Guest User: Đọc được chương 1 hoặc các chương có `is_free_preview = true`.
 */
export function canAccessStoryChapter(
  chapter?: { sort_id?: string | number | null; is_free_preview?: boolean | null } | null,
  chapterIndex = 0,
  isPremium = false,
): boolean {
  if (isPremium) return true;
  if (!chapter) return chapterIndex === 0;
  if (chapter.is_free_preview) return true;
  const sort = Number(chapter.sort_id);
  return sort === 1 || chapterIndex === 0;
}

/**
 * Kiểm tra quyền đọc bài đọc song ngữ.
 * - Paid User: Toàn quyền mọi bài.
 * - Free User: Đọc được bài `access_tier = 'free'` hoặc các bài HSK 1-3.
 */
export function canAccessBilingualSection(
  section?: { level?: string | null; access_tier?: string | null } | null,
  isPremium = false,
): boolean {
  if (isPremium) return true;
  if (!section) return false;
  if (section.access_tier === "free") return true;
  if (section.access_tier === "premium") return false;
  // Fallback theo HSK level nếu chưa gán tier: HSK 1-3 free, HSK 4-6 premium
  const level = (section.level || "").toLowerCase();
  if (level.includes("hsk 1") || level.includes("hsk 2") || level.includes("hsk 3") || level.includes("sơ cấp")) {
    return true;
  }
  return false;
}

