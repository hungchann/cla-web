import apiInstance, { refreshAccessToken } from "@/api/authConfig";
import { graphqlRequest } from "@/api/graphql/client";
import {
  GET_ALL_VOCABULARY_QUERY,
  GET_LESSONS_BY_TOPIC_ID_QUERY,
  GET_NEW_SECTIONS_QUERY,
  GET_TOPIC_OF_EXERCISE_QUERY,
  GET_VOCABULARY_BY_SECTION_QUERY,
  GET_VOCAB_MEANINGS_QUERY,
  GET_VOCAB_EXAMPLES_QUERY,
} from "@/api/graphql/documents";
import {
  EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_PATH,
  EXERCISE_COUNT_BY_TOPIC_FLOW_PATH,
  REGISTER_FLOW_PATH,
  RESET_PASSWORD_FLOW_PATH,
  RESET_PASSWORD_FLOW_URL,
  UPDATE_PROFILE_FLOW_PATH,
  ONBOARDING_EMAIL_CHECK_FLOW_PATH,
} from "@/lib/constants";
import { BilingualMapper } from "@/lib/mappers/bilingualMapper";
import { BilingualItem } from "@/lib/types/bilingual";

import { tokenUtils } from "@/lib/utils/tokenUtils";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { sendAIRequest } from "@/services/aiRequestService";
import { logger } from "@/services/logger";
import axios, { isAxiosError } from "axios";

// ─── Input validation helpers ────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validateEmail(email: string): void {
  if (!email || !email.trim()) throw new Error("Email không được để trống.");
  if (!EMAIL_REGEX.test(email.trim())) throw new Error("Định dạng email không hợp lệ.");
}

function validatePassword(password: string): void {
  if (!password) throw new Error("Mật khẩu không được để trống.");
  if (password.length < MIN_PASSWORD_LENGTH)
    throw new Error(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
}

// ─────────────────────────────────────────────────────────────────────────────

// Kiểm tra Email đã tồn tại trong luồng Onboarding
export async function checkEmailExists(email: string): Promise<boolean> {
  validateEmail(email);
  try {
    const response = await apiInstance.get(ONBOARDING_EMAIL_CHECK_FLOW_PATH, {
      params: { email: email.trim() },
    });
    // Trả về true nếu API trả về trạng thái báo email đã tồn tại, hoặc false nếu không
    return response.data?.exists ?? false;
  } catch (error: any) {
    // 401 + message "Tài khoản đã tồn tại" = email đã có
    const status = error.response?.status;
    const msg = error.response?.data?.message || "";
    if (status === 401 || msg.includes("Tài khoản đã tồn tại")) {
      return true;
    }
    // Nếu lỗi kết nối hoặc lỗi khác, ném ra ngoài
    throw error;
  }
}

export async function RegisterUser(
  email: string,
  password: string,
  first_name: string,
  last_name?: string,
) {
  validateEmail(email);
  validatePassword(password);
  if (!first_name || !first_name.trim()) throw new Error("Họ tên không được để trống.");

  try {
    const userData: { email: string; password: string; first_name: string; last_name?: string } = {
      email: email.trim(),
      password,
      first_name: first_name.trim(),
    };

    // Chỉ thêm last_name nếu có
    if (last_name?.trim()) {
      userData.last_name = last_name.trim();
    }

    const response = await apiInstance.post(REGISTER_FLOW_PATH, userData);

    return response.data?.data ?? response.data;
  } catch (error) {
    logger.warn(
      "Lỗi đăng ký:",
      isAxiosError(error) ? error.response?.data || error.message : error,
    );
    throw error;
  }
}

// Đăng nhập
export async function loginUser(email: string, password: string) {
  validateEmail(email);
  validatePassword(password);

  // Xóa cache user cũ ngay khi bắt đầu login để tránh data leak giữa sessions
  clearUserCache();

  try {
    const response = await apiInstance.post("/auth/login", { email: email.trim(), password });
    const { access_token, refresh_token, expires } = response.data.data;

    // Lưu tokens tạm thời để getUserMe có thể gọi API được bằng token mới
    await tokenUtils.saveTokens(access_token, refresh_token, undefined, expires);

    // Lấy thông tin user đầy đủ
    const user = await getUserMe();

    // Lưu tokens cùng thông tin user đầy đủ vào localStorage
    await tokenUtils.saveTokens(access_token, refresh_token, user, expires);

    // Verify tokens were saved
    await tokenUtils.checkTokenStatus();

    return { ...response.data.data, user };
  } catch (error) {
    logger.warn(
      "Lỗi đăng nhập:",
      isAxiosError(error) ? error.response?.data || error.message : error,
    );
    throw error;
  }
}

// Get user me data
export async function getUserMe() {
  try {
    const response = await apiInstance.get("/users/me");
    return response.data.data;
  } catch (error) {
    logger.warn("Error getting user me data", error);
    throw error;
  }
}

// Cache được scope theo userId để tránh data leak khi switch account.
// clearUserCache() phải được gọi trước khi load user mới (đã làm ở loginUser/logoutUser).
let cachedUser: { user: any; profile: any } | null = null;
let cachedUserId: string | null = null;
let userPromise: Promise<{ user: any; profile: any }> | null = null;

// Lấy thông tin người dùng (với cache để tối ưu performance)
export async function getUser(forceRefresh = false) {
  if (cachedUser && !forceRefresh) return cachedUser;
  if (userPromise && !forceRefresh) return userPromise;

  const accessToken = tokenUtils.getAccessToken();
  const refreshToken = tokenUtils.getRefreshToken();
  if (!accessToken && !refreshToken) {
    const error = new Error("No tokens available") as any;
    error.status = 401;
    error.response = { status: 401, statusText: "Unauthorized", data: {} };
    throw error;
  }

  userPromise = (async () => {
    try {
      const userData = await getUserMe();

      // Nếu userId thay đổi giữa chừng (edge case switch account), xóa cache cũ
      if (cachedUserId && cachedUserId !== userData.id) {
        cachedUser = null;
      }

      const profile = await getUserProfile(userData.id);

      cachedUser = {
        user: userData,
        profile,
      };
      cachedUserId = userData.id ?? null;
      return cachedUser;
    } catch (error) {
      userPromise = null;
      logger.warn("Detailed error in getUser", {
        message: error instanceof Error ? error.message : "Unknown error",
        status: isAxiosError(error) ? error.response?.status : "N/A",
      });
      throw error;
    } finally {
      userPromise = null;
    }
  })();

  return userPromise;
}

// Clear user cache — gọi khi logout hoặc bắt đầu login với tài khoản mới
export function clearUserCache() {
  cachedUser = null;
  cachedUserId = null;
  userPromise = null;
}

// Upload file
export async function uploadFileToPrivate(file: any) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "private");

    const response = await apiInstance.post("/files", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    logger.warn("Lỗi upload file", error);
    throw error;
  }
}

// Cập nhật profile
export async function updateProfile(fields: Record<string, any>) {
  try {
    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== null && v !== undefined),
    );

    if (Object.keys(cleanFields).length === 0) {
      throw new Error("0 có trường nào để cập nhật");
    }

    const response = await apiInstance.post(UPDATE_PROFILE_FLOW_PATH, cleanFields);

    return response.data;
  } catch (error) {
    logger.warn("Lỗi cập nhật", error);
    throw error;
  }
}

// Cập nhật mật khẩu
export async function updatePassword(newPassword: string) {
  try {
    const response = await apiInstance.post(RESET_PASSWORD_FLOW_PATH, {
      new_password: newPassword,
    });

    return response.data;
  } catch (error) {
    logger.warn("Lỗi cập nhật mật khẩu", error);
    throw error;
  }
}

/**
 * Quên mật khẩu — sau OTP: POST flow Directus giống Postman.
 * Dùng axios thuần (không apiInstance) để không gắn Bearer token cũ.
 */
export async function resetPasswordWithToken(resetToken: string, newPassword: string) {
  const response = await axios.post(
    RESET_PASSWORD_FLOW_URL,
    { reset_token: resetToken, new_password: newPassword },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    },
  );
  return response.data?.data ?? response.data;
}

// Quên mật khẩu
export async function forgotPassword(email: string) {
  try {
    const response = await apiInstance.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    logger.warn("Lỗi gửi yêu cầu", error);
    throw error;
  }
}

// Hàm hỗ trợ
async function getUserProfile(userId: string) {
  try {
    const response = await apiInstance.get("/items/user_profiles", {
      params: {
        filter: { user_id: { _eq: userId } },
      },
    });
    logger.debug("Profile fetch result", response.data?.data ? "found" : "not found");

    return response.data.data[0] || null;
  } catch (error) {
    logger.warn("Error fetching profile", {
      message: error instanceof Error ? error.message : "Unknown error",
      status: isAxiosError(error) ? error.response?.status : "N/A",
    });
    return null;
  }
}

// Đăng xuất
export async function logoutUser() {
  try {
    const refreshToken = tokenUtils.getRefreshToken();
    if (refreshToken) {
      try {
        await apiInstance.post("/auth/logout", { refresh_token: refreshToken });
      } catch (err) {
        logger.warn("Call backend /auth/logout failed", err);
      }
    }
    clearUserCache();
    await tokenUtils.clearAllTokens();
  } catch (error) {
    logger.warn("Lỗi đăng xuất", error);
    throw error;
  }
}

// Lấy danh sách các sections bài đọc
export async function getNewSection(): Promise<BilingualItem[]> {
  try {
    const response = await graphqlRequest<{ Sections: any[] }>(GET_NEW_SECTIONS_QUERY);

    // Map using centralized mapper
    return response.data.Sections.map(BilingualMapper.toBilingualItem);
  } catch (error) {
    logger.warn("Error fetching bilingual items", error);
    throw new Error("Failed to fetch bilingual items");
  }
}

// Lấy danh sách từ vựng
export async function getAllVocabulary() {
  try {
    const response = await graphqlRequest<{ Vocabulary: any[] }>(GET_ALL_VOCABULARY_QUERY);
    return { data: response.data };
  } catch (error) {
    logger.warn("Lỗi lấy danh sách từ vựng", error);
    throw error;
  }
}

// Lấy danh sách từ vựng theo từng bài
export async function getVocabularyByIdSection(idSection: string) {
  try {
    // 1. Fetch junction table rows to get vocab items
    const response = await graphqlRequest<{ Sections_vocab_items: any[] }, any>(
      GET_VOCABULARY_BY_SECTION_QUERY,
      { idSection },
    );

    const junctionItems = response.data?.Sections_vocab_items || [];
    const vocabItems = junctionItems
      .map((item: any) => item.vocab_items_id)
      .filter(Boolean);

    if (vocabItems.length === 0) {
      return { data: { vocabulary: [] } };
    }

    const itemIds = vocabItems.map((item: any) => item.id);

    // 2. Fetch meanings for these vocab items
    const meaningsResponse = await graphqlRequest<{ vocab_meanings: any[] }, any>(
      GET_VOCAB_MEANINGS_QUERY,
      { itemIds },
    );
    const meanings = meaningsResponse.data?.vocab_meanings || [];

    // 3. Fetch examples for these meanings
    const meaningIds = meanings.map((m: any) => m.id);
    let examples: any[] = [];
    if (meaningIds.length > 0) {
      const examplesResponse = await graphqlRequest<{ vocab_examples: any[] }, any>(
        GET_VOCAB_EXAMPLES_QUERY,
        { meaningIds },
      );
      examples = examplesResponse.data?.vocab_examples || [];
    }

    // 4. Map examples to meanings
    const examplesByMeaningId: Record<string, any[]> = {};
    for (const ex of examples) {
      const mId = ex.meaning_id?.id;
      if (mId) {
        if (!examplesByMeaningId[mId]) {
          examplesByMeaningId[mId] = [];
        }
        examplesByMeaningId[mId].push(ex);
      }
    }

    // 5. Map meanings to vocab items
    const meaningsByItemId: Record<string, any[]> = {};
    for (const m of meanings) {
      const itemId = m.item_id?.id;
      if (itemId) {
        if (!meaningsByItemId[itemId]) {
          meaningsByItemId[itemId] = [];
        }
        meaningsByItemId[itemId].push({
          ...m,
          examples: examplesByMeaningId[m.id] || [],
        });
      }
    }

    // 6. Construct the final vocabulary list in the shape expected by the UI
    const vocabulary = vocabItems.map((item: any) => {
      const itemMeanings = meaningsByItemId[item.id] || [];
      const firstMeaning = itemMeanings[0];
      const wordType = firstMeaning?.pos_id?.label_vi || "N/A";
      const meaningStr = itemMeanings.map((m: any) => m.meaning_vi).join("; ");
      
      // Collect and format examples
      const allExamples = itemMeanings.flatMap((m: any) => m.examples);
      const exampleStr = allExamples
        .map((ex: any) => `${ex.chinese} (${ex.pinyin}) ${ex.p_vi}`)
        .join("; ");

      return {
        id: item.id,
        word: item.name,
        pinyin: item.pinyin,
        Pinyin: item.pinyin,
        word_type: wordType,
        meaning: meaningStr || "N/A",
        Example: exampleStr || "",
        example: exampleStr || "",
        senses: itemMeanings.map((m: any) => ({
          id: m.id,
          pos_label: m.pos_id?.label_vi || undefined,
          meaning: m.meaning_vi,
          examples: (m.examples || []).map((ex: any) => ({
            id: ex.id,
            chinese: ex.chinese,
            pinyin: ex.pinyin,
            vietnamese: ex.p_vi,
          })),
        })),
      };
    });

    return { data: { vocabulary } };
  } catch (error) {
    logger.warn("Lỗi lấy từ vựng chi tiết", error);
    throw error;
  }
}

export async function topicOfExercise() {
  try {
    const response = await graphqlRequest<{ topic_of_exercise: any[] }>(
      GET_TOPIC_OF_EXERCISE_QUERY,
    );
    return response.data.topic_of_exercise;
  } catch (error) {
    logger.warn("Lỗi lấy danh sách chủ đề bài tập", error);
    throw error;
  }
}

export async function getLessonsByTopicId(topicId: string) {
  try {
    const response = await graphqlRequest<{ link_exercise: any[] }, any>(
      GET_LESSONS_BY_TOPIC_ID_QUERY,
      { topicId },
    );
    return response.data.link_exercise;
  } catch (error) {
    logger.warn("Lỗi lấy danh sách bài học", error);
    throw error;
  }
}

export async function getCountExerciseInLesson(id: string) {
  try {
    const response = await apiInstance.get(EXERCISE_COUNT_BY_TOPIC_FLOW_PATH, {
      params: { topic_id: id },
    });

    return response.data;
  } catch (error) {
    logger.warn("Lỗi lấy số lượng bài tập trong bài học", error);
    throw error;
  }
}

export async function getExerciseCountByLessonAndTopic(lessonId: string, topicId: string) {
  try {
    // Flow trigger này dùng query params (lesson_id, topic_id).
    // Axios signature: post(url, data, config). Nếu truyền { params } ở arg #2 nó sẽ thành body.
    const response = await apiInstance.post(
      EXERCISE_COUNT_BY_LESSON_AND_TOPIC_FLOW_PATH,
      {},
      { params: { lesson_id: lessonId, topic_id: topicId } },
    );

    return response.data;
  } catch (error) {
    logger.warn("Lỗi lấy số lượng bài tập", error);
    throw error;
  }
}

export async function refreshTokenMutation(_refreshToken?: string, _mode?: string) {
  const ok = await refreshAccessToken();
  if (!ok) {
    throw new Error("Invalid refresh response");
  }
  const access_token = tokenUtils.getAccessToken() ?? "";
  const refresh_token = tokenUtils.getRefreshToken();
  return {
    access_token,
    refresh_token,
  };
}

export async function checkAndRefreshToken() {
  try {
    const refreshToken = tokenUtils.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const accessToken = tokenUtils.getAccessToken();
    let needsRefresh = !accessToken;

    if (accessToken) {
      const expStr = tokenUtils.getAccessTokenExpiresAt();
      if (expStr) {
        const exp = Number.parseInt(expStr, 10);
        if (!Number.isNaN(exp) && Date.now() > exp - 120_000) {
          needsRefresh = true;
        }
      }
    }

    if (needsRefresh) {
      const ok = await refreshAccessToken();
      if (!ok) return false;
    }

    await getUserMe();
    return true;
  } catch (error) {
    logger.warn("Error checking token", error);
    return false;
  }
}

// Translate Chinese word (AI-backed — requires user consent)
export async function translateWord(word: string) {
  try {
    return await sendAIRequest(
      async () => {
        const response = await axios.get(
          `/api/chinese/translate?word=${encodeURIComponent(word)}`,
          {
            timeout: 30000,
          }
        );
        return response.data;
      },
      {
        kind: "text",
        declinedMessage:
          "Word translation requires your consent to send text to our AI learning service (OpenAI).",
      },
    );
  } catch (error: any) {
    if (isAIConsentRequiredError(error)) {
      throw error;
    }

    logger.warn("Error translating word", error);

    const is404 = error?.response?.status === 404 || error?.message?.includes("404") || error?.status === 404;

    return [
      {
        word: word,
        pinyin: "N/A",
        meaning: is404 ? "Không tìm thấy từ này trong từ điển" : "Dịch vụ dịch thuật tạm thời không khả dụng",
        pronunciation: "N/A",
      },
    ];
  }
}
