import { graphqlSystemRequest } from "@/api/graphql/client";
import { REFRESH_TOKEN_MUTATION } from "@/api/graphql/documents";
import { REGISTER_FLOW_PATH } from "@/lib/constants";
import { logger } from "@/services/logger";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// ─── SSL / Certificate Pinning ────────────────────────────────────────────────
// SECURITY NOTE: Hiện tại chưa có SSL pinning. Trên thiết bị bị root hoặc môi trường
// proxy (Charles, mitmproxy), attacker có thể intercept request và đọc Bearer token.
//
// Cách triển khai khi cần:
//   1. Dùng thư viện `react-native-ssl-pinning` (cần eject hoặc custom native build).
//   2. Hoặc dùng `expo-build-properties` + OkHttp CertificatePinner (Android)
//      và TrustKit (iOS) trong custom native module.
//   3. Lấy SHA-256 fingerprint của cert marutek.space:
//      openssl s_client -connect marutek.space:443 | openssl x509 -noout -fingerprint -sha256
//
// Tham khảo: https://docs.expo.dev/guides/custom-native-modules/
// ─────────────────────────────────────────────────────────────────────────────

const API = Constants.expoConfig?.extra?.API_URL || "https://marutek.space";

const apiInstance = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** Một lần refresh tại một thời điểm (tránh xoay refresh_token khi nhiều request 401). */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Làm mới access token qua Directus auth_refresh (POST /graphql/system).
 * Trả về true nếu đã lưu access_token mới vào SecureStore.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<boolean> => {
      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        if (!refreshToken) return false;

        const response = await graphqlSystemRequest<
          {
            auth_refresh: {
              access_token: string;
              refresh_token?: string;
              expires?: number | null;
            };
          },
          any
        >(REFRESH_TOKEN_MUTATION, { refresh_token: refreshToken }, `${API}/graphql/system`);

        const payload = response.data?.auth_refresh;
        if (!payload?.access_token) {
          logger.warn("[Auth] auth_refresh: missing access_token in response");
          return false;
        }

        await tokenUtils.saveTokens(
          payload.access_token,
          payload.refresh_token || undefined,
          undefined,
          payload.expires ?? null,
        );
        return true;
      } catch (e) {
        logger.error("[Auth] refreshAccessToken failed:", e);
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

apiInstance.interceptors.request.use(
  async (config) => {
    if (process.env.NODE_ENV === "development") {
      logger.debug(`[Interceptor] Requesting: ${config.method?.toUpperCase()} ${config.url}`);
    }

    const isLogin = config.url?.includes("/auth/login");
    const isRegister =
      config.method?.toLowerCase() === "post" &&
      (config.url === "/users" || config.url === REGISTER_FLOW_PATH);
    const isForgotPassword = config.url?.includes("/auth/forgot-password");

    if (!isLogin && !isRegister && !isForgotPassword) {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !originalRequest._retry &&
      (error.message === "Network Error" ||
        (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        logger.debug(`[Network] Retrying request... Attempt ${originalRequest._retryCount}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return apiInstance(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retryAuth) {
      originalRequest._retryAuth = true;

      logger.debug("[Auth] 401 detected. Attempting to refresh token...");

      const refreshed = await refreshAccessToken();

      if (refreshed) {
        const access = await SecureStore.getItemAsync("access_token");
        if (access) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiInstance(originalRequest);
        }
      }

      await tokenUtils.clearAllTokens();
    }

    return Promise.reject(error);
  },
);

export default apiInstance;
