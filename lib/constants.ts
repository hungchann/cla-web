// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

// Common endpoints built from base API_URL
export const ASSET_URL = `${API_URL}/assets`;
export const FLOW_TRIGGER_BASE_URL = `${API_URL}/flows/trigger`;

/** Public register flow (Directus) — không yêu cầu auth theo thiết kế. */
export const REGISTER_FLOW_ID =
  process.env.NEXT_PUBLIC_REGISTER_FLOW_ID ??
  "bf3377ae-73a5-4905-899d-53f1c69aabad";

export const REGISTER_FLOW_PATH = `/flows/trigger/${REGISTER_FLOW_ID}`;

/** Onboarding: GET `?email=` — 401 + message "Tài khoản đã tồn tại" = email đã có */
export const ONBOARDING_EMAIL_CHECK_FLOW_ID =
  process.env.NEXT_PUBLIC_ONBOARDING_EMAIL_CHECK_FLOW_ID ??
  "49c88319-fb3f-4ed0-828a-7341d657a9bf";
export const ONBOARDING_EMAIL_CHECK_FLOW_URL = `${FLOW_TRIGGER_BASE_URL}/${ONBOARDING_EMAIL_CHECK_FLOW_ID}`;
export const ONBOARDING_EMAIL_CHECK_FLOW_PATH = `/flows/trigger/${ONBOARDING_EMAIL_CHECK_FLOW_ID}`;

/**
 * Exercises counting flows.
 * Override IDs via env when backend changes.
 */
export const EXERCISE_COUNT_BY_TOPIC_FLOW_ID =
  process.env.NEXT_PUBLIC_EXERCISE_COUNT_BY_TOPIC_FLOW_ID ??
  "a05762e6-1cb4-4701-912b-e48fdfc7488f";

export const EXERCISE_COUNT_BY_TOPIC_FLOW_PATH = `/flows/trigger/${EXERCISE_COUNT_BY_TOPIC_FLOW_ID}`;
export const EXERCISE_COUNT_BY_TOPIC_FLOW_URL = `${FLOW_TRIGGER_BASE_URL}/${EXERCISE_COUNT_BY_TOPIC_FLOW_ID}`;

export const EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_ID =
  process.env.NEXT_PUBLIC_EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_ID ??
  "f7154213-ed8f-4bc8-a455-33f97ce7a0fe";

export const EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_PATH = `/flows/trigger/${EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_ID}`;
export const EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_URL = `${FLOW_TRIGGER_BASE_URL}/${EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_ID}`;

/**
 * App feature flows (Directus).
 * Keep all flow UUIDs here to avoid scattering across the codebase.
 */
export const UPDATE_PROFILE_FLOW_ID =
  process.env.NEXT_PUBLIC_UPDATE_PROFILE_FLOW_ID ??
  "0b8521ea-15b6-4158-8a39-3e57237389dd";
export const UPDATE_PROFILE_FLOW_PATH = `/flows/trigger/${UPDATE_PROFILE_FLOW_ID}`;

export const UPDATE_TARGET_USER_FLOW_ID =
  process.env.NEXT_PUBLIC_UPDATE_TARGET_USER_FLOW_ID ??
  "cc80fbc7-bd28-4e72-bbb0-476e3a02fa65";
export const UPDATE_TARGET_USER_FLOW_PATH = `/flows/trigger/${UPDATE_TARGET_USER_FLOW_ID}`;

export const GET_TARGETS_FLOW_ID =
  process.env.NEXT_PUBLIC_GET_TARGETS_FLOW_ID ??
  "ff784c62-44fd-49de-a294-4f1b8447dd01";
export const GET_TARGETS_FLOW_PATH = `/flows/trigger/${GET_TARGETS_FLOW_ID}`;

export const ACCOUNT_TYPE_FLOW_ID =
  process.env.NEXT_PUBLIC_ACCOUNT_TYPE_FLOW_ID ??
  "dabaeb3f-a7f1-4a6d-b66d-e0f05cb505a9";
export const ACCOUNT_TYPE_FLOW_PATH = `/flows/trigger/${ACCOUNT_TYPE_FLOW_ID}`;

export const UPDATE_TOPICS_OF_INTEREST_FLOW_ID =
  process.env.NEXT_PUBLIC_UPDATE_TOPICS_OF_INTEREST_FLOW_ID ??
  "c99baab3-e017-4172-962c-dc2e83cfb7ce";
export const UPDATE_TOPICS_OF_INTEREST_FLOW_PATH = `/flows/trigger/${UPDATE_TOPICS_OF_INTEREST_FLOW_ID}`;

export const VOCAB_DETAIL_FLOW_ID =
  process.env.NEXT_PUBLIC_VOCAB_DETAIL_FLOW_ID ??
  "94160fb1-9dfc-4d41-a7fc-237fc232f820";
export const VOCAB_DETAIL_FLOW_PATH = `/flows/trigger/${VOCAB_DETAIL_FLOW_ID}`;

export const UPDATE_NOTE_VOCAB_FLOW_ID =
  process.env.NEXT_PUBLIC_UPDATE_NOTE_VOCAB_FLOW_ID ??
  "28ebd289-bb83-4e98-8342-1ffc1be0ba8d";
export const UPDATE_NOTE_VOCAB_FLOW_PATH = `/flows/trigger/${UPDATE_NOTE_VOCAB_FLOW_ID}`;

export const ADD_NOTE_TO_VOCAB_FLOW_ID =
  process.env.NEXT_PUBLIC_ADD_NOTE_TO_VOCAB_FLOW_ID ??
  "749291e3-dc9a-41cf-991a-20b2080b0b57";
export const ADD_NOTE_TO_VOCAB_FLOW_PATH = `/flows/trigger/${ADD_NOTE_TO_VOCAB_FLOW_ID}`;

export const EXERCISE_BY_ID_FLOW_ID =
  process.env.NEXT_PUBLIC_EXERCISE_BY_ID_FLOW_ID ??
  "603b5658-5c21-41d9-9150-0e0f70f9c545";
export const EXERCISE_BY_ID_FLOW_PATH = `/flows/trigger/${EXERCISE_BY_ID_FLOW_ID}`;

export const SUBMIT_EXERCISE_FLOW_ID =
  process.env.NEXT_PUBLIC_SUBMIT_EXERCISE_FLOW_ID ??
  "f4ff35de-e965-4bbb-b412-47199e373572";
export const SUBMIT_EXERCISE_FLOW_PATH = `/flows/trigger/${SUBMIT_EXERCISE_FLOW_ID}`;

export const FLASHCARD_DECK_VOCABS_FLOW_ID =
  process.env.NEXT_PUBLIC_FLASHCARD_DECK_VOCABS_FLOW_ID ??
  "785fca5f-9b46-4d66-8504-3286dd6f3d51";
export const FLASHCARD_DECK_VOCABS_FLOW_PATH = `/flows/trigger/${FLASHCARD_DECK_VOCABS_FLOW_ID}`;

export const UPDATE_HSK_LEVEL_FLOW_ID =
  process.env.NEXT_PUBLIC_UPDATE_HSK_LEVEL_FLOW_ID ??
  "9cb381de-f1a6-4ef7-af80-18d370ff8733";
export const UPDATE_HSK_LEVEL_FLOW_PATH = `/flows/trigger/${UPDATE_HSK_LEVEL_FLOW_ID}`;

/**
 * Reset password flow URL.
 */
export const RESET_PASSWORD_FLOW_URL =
  process.env.NEXT_PUBLIC_RESET_PASSWORD_FLOW_URL ??
  "https://marutek.space/flows/trigger/c4420b85-94e0-4e65-9f37-aa18e0a4ec99";

/** Path tương đối cho apiInstance (baseURL = API_URL), lấy từ URL cố định */
export const RESET_PASSWORD_FLOW_PATH = (() => {
  try {
    return new URL(RESET_PASSWORD_FLOW_URL).pathname;
  } catch {
    return "/flows/trigger/c4420b85-94e0-4e65-9f37-aa18e0a4ec99";
  }
})();

export const GRAPHQL_SYSTEM_URL = `${API_URL}/graphql/system`;
export const SMTP_AUTH_BASE_URL = `${API_URL}/smtp-auth`;

// Marutek Speech API Configuration
export const MARUTEK_CONFIG = {
  API_URL:
    process.env.NEXT_PUBLIC_MARUTEK_API_URL ||
    `${API_URL}/api/speech/transcribe`,
  DEFAULT_LANGUAGE: "zh-CN",
} as const;

/** POST multipart field `audio` — khuyến nghị (ổn định, ít lỗi payload quá lớn). */
export function marutekTranscribeBase64Url(multipartTranscribeUrl: string): string {
  const t = multipartTranscribeUrl.trim().replace(/\/$/, "");
  if (t.endsWith("/base64")) return t;
  return `${t}/base64`;
}

/** POST JSON `{ "audioBase64": "..." }` — chỉ dùng khi multipart không khả dụng; base64 ~+33% so với file gốc. */
export const MARUTEK_TRANSCRIBE_BASE64_URL = marutekTranscribeBase64Url(MARUTEK_CONFIG.API_URL);

/** YouTube Data API v3 (thumbnail, snippet). */
export const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "";

// Audio Processing Constants
export const AUDIO_CONFIG = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  ALLOWED_FORMATS: /\.(mp3|m4a|wav|aac|ogg|flac)$/i,
  DEFAULT_LANGUAGE: "zh-CN",
  MAX_RETRIES: 3,
} as const;

// Shadowing Feature Constants
export const SHADOWING_CONFIG = {
  MIN_RECORDING_DURATION: 1000, // 1 second
  MAX_RECORDING_DURATION: 300000, // 5 minutes
  AUTO_SUBMIT_THRESHOLD: 100000, // 100 seconds
  TIMER_UPDATE_INTERVAL: 100, // 100ms
} as const;
