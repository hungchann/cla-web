import apiInstance from "@/api/authConfig";
import * as SecureStore from "expo-secure-store";
import { logger } from "@/services/logger";
import {
  ACCOUNT_TYPE_FLOW_PATH,
  GET_TARGETS_FLOW_PATH,
  UPDATE_TARGET_USER_FLOW_PATH,
} from "@/lib/constants";
// export const bilingualApi = {

//API dung de post target

interface TargetData {
  id: string;
  topic_id: string;
}

export const postTarget = async (data: TargetData) => {
  const response = await apiInstance.post(
    UPDATE_TARGET_USER_FLOW_PATH,
    {
      topic_id: data.topic_id,
    },
    {
      params: { id: data.id },
    },
  );
  return response.data;
};

// API to get targets
export const getTargets = async () => {
  const response = await apiInstance.get(GET_TARGETS_FLOW_PATH);
  return response.data;
};

export const changeNotification = async (notification_enabled: boolean, id: string) => {
  const response = await apiInstance.patch(`items/user_profiles/${id}`, {
    notification_enabled: notification_enabled,
  });
  return response.data;
};
// Hàm này lấy loại tài khoản bằng flow mới
//
// Ví dụ response từ flow:
// [
//   {
//     "id": 4,
//     "user_id": 164,
//     "expired_time": "2026-03-10T14:55:36",
//     "type": "Lifetime"
//   }
// ]
//
// Để không phải sửa các chỗ khác trong app (như premiumStorage),
// hàm này sẽ map dữ liệu flow về dạng:
// {
//   user_profiles: [
//     {
//       account_type_id: { id, name },
//       is_active: true
//     }
//   ]
// }
// Thông tin gói cước thô từ flow (dùng cho trang Quản lý gói cước)
export interface SubscriptionInfo {
  id?: string | number;
  user_id?: string | number;
  expired_time?: string | null;
  type?: string | null;
}

// Lấy thông tin gói cước hiện tại từ BE flow (giữ nguyên expired_time, type)
// Trả về null nếu user chưa có gói nào.
export const getSubscriptionInfo = async (): Promise<SubscriptionInfo | null> => {
  let userId: string | number | null = null;
  try {
    const userDataStr = await SecureStore.getItemAsync("user_data");
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      const candidate = userData?.user_id ?? userData?.userId ?? userData?.id ?? null;
      if (candidate !== undefined && candidate !== null) {
        userId = candidate;
      }
    }
  } catch (e) {
    logger.warn("Không đọc được user_data từ SecureStore:", e);
  }

  const url = userId !== null ? `${ACCOUNT_TYPE_FLOW_PATH}?id=${userId}` : ACCOUNT_TYPE_FLOW_PATH;
  const response = await apiInstance.get(url);
  const data = response.data as any;

  if (Array.isArray(data) && data.length > 0) {
    return data[0] as SubscriptionInfo;
  }
  return null;
};

export const getAccountType = async () => {
  try {
    // Lấy user_id hiện tại từ SecureStore (user_data)
    let userId: string | number | null = null;
    try {
      const userDataStr = await SecureStore.getItemAsync("user_data");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        // Prefer numeric user_id if present (matches DB/user_profiles.user_id in many setups)
        // Fallback to id (often UUID).
        if (userData) {
          const candidate = userData.user_id ?? userData.userId ?? userData.id ?? null;
          if (candidate !== undefined && candidate !== null) {
            userId = candidate;
          }
        }
      }
    } catch (e) {
      logger.warn("Không đọc được user_data từ SecureStore:", e);
    }
    const url = userId !== null ? `${ACCOUNT_TYPE_FLOW_PATH}?id=${userId}` : ACCOUNT_TYPE_FLOW_PATH;

    if (process.env.NODE_ENV === "development") {
      logger.debug("[getAccountType] Requesting account type flow", {
        userId,
        url,
      });
    }

    const response = await apiInstance.get(url);
    const data = response.data as any;

    if (process.env.NODE_ENV === "development") {
      logger.debug("[getAccountType] Raw flow response", {
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : null,
        sample: Array.isArray(data) ? data[0] : data,
      });
    }

    // If backend already returns mapped shape, pass-through.
    if (data && typeof data === "object" && Array.isArray(data.user_profiles)) {
      return data;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { user_profiles: [] };
    }

    const item = data[0];
    const expiredTime = item?.expired_time;
    const isActive =
      typeof expiredTime === "string" && expiredTime.length > 0
        ? new Date(expiredTime).getTime() > Date.now()
        : true;

    return {
      user_profiles: [
        {
          account_type_id: {
            id: item?.id ?? null,
            // dùng field "type" (vd: "Lifetime") làm name
            name: item?.type ?? null,
          },
          is_active: isActive,
        },
      ],
    };
  } catch (error) {
    logger.error("Lỗi lấy loại tài khoản (flow mới):", error);
    throw error;
  }
};
