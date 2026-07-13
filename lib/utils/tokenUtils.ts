import { logger } from "@/services/logger";

export const ACCESS_TOKEN_EXPIRES_AT_KEY = "access_token_expires_at";

/** Directus: `expires` có thể là ms (vd 900000) hoặc giây (vd 900). */
export function expiresValueToAbsoluteMs(expires: number | undefined | null): number | null {
  if (expires == null || expires <= 0) return null;
  const durationMs = expires > 100_000 ? expires : expires * 1000;
  return Date.now() + durationMs;
}

// Simple browser-compatible cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (const c of ca) {
    const cleanCookie = c.trim();
    if (cleanCookie.startsWith(nameEQ)) {
      return cleanCookie.substring(nameEQ.length);
    }
  }
  return null;
}

function setCookie(name: string, value: string, days?: number) {
  if (typeof document === "undefined") return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  const isSecure = globalThis.window?.location?.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax${secureFlag}`;
}

function clearCookieWithAttributes(name: string, domain: string | undefined, path: string) {
  const tryDelete = (secure: string, sameSite: string) => {
    let cookieStr = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (path) cookieStr += `; path=${path}`;
    if (domain) cookieStr += `; domain=${domain}`;
    if (sameSite) cookieStr += sameSite;
    if (secure) cookieStr += secure;
    try {
      document.cookie = cookieStr;
    } catch {
      // ignore
    }
  };

  tryDelete("", "");
  tryDelete("", "; SameSite=Lax");
  tryDelete("", "; SameSite=None");
  tryDelete("; Secure", "");
  tryDelete("; Secure", "; SameSite=Lax");
  tryDelete("; Secure", "; SameSite=None");
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  
  const host = globalThis.window?.location?.hostname;
  const domains = [undefined, host, host ? `.${host}` : undefined];
  const paths = ["/", ""];

  for (const path of paths) {
    for (const domain of domains) {
      clearCookieWithAttributes(name, domain, path);
    }
  }
}

export const tokenUtils = {
  // Retrieve access token
  getAccessToken: () => {
    return getCookie("access_token");
  },

  // Retrieve refresh token
  getRefreshToken: () => {
    return getCookie("refresh_token");
  },

  // Retrieve expiration
  getAccessTokenExpiresAt: () => {
    return getCookie(ACCESS_TOKEN_EXPIRES_AT_KEY);
  },

  // Retrieve user data
  getUserData: () => {
    if (globalThis.window === undefined) return null;
    try {
      const data = globalThis.window.localStorage.getItem("user_data");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Error reading user_data from localStorage:", error);
      return null;
    }
  },

  // Kiểm tra trạng thái token
  checkTokenStatus: async () => {
    try {
      const accessToken = tokenUtils.getAccessToken();
      const refreshToken = tokenUtils.getRefreshToken();
      const userData = tokenUtils.getUserData();

      return {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        userData: !!userData,
      };
    } catch (error) {
      logger.error("Error checking token status:", error);
      return {
        accessToken: false,
        refreshToken: false,
        userData: false,
      };
    }
  },

  // Xóa tất cả tokens
  clearAllTokens: async () => {
    try {
      deleteCookie("access_token");
      deleteCookie("refresh_token");
      deleteCookie(ACCESS_TOKEN_EXPIRES_AT_KEY);
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.removeItem("user_data");
      }
    } catch (error) {
      logger.error("Error clearing tokens:", error);
    }
  },

  // Lưu tokens (+ optional expires từ login / auth_refresh: độ dài sống token)
  saveTokens: async (
    accessToken: string,
    refreshToken?: string,
    userData?: any,
    expiresRaw?: number | null,
  ) => {
    try {
      setCookie("access_token", accessToken, 1); // 1 day expiry

      if (refreshToken) {
        setCookie("refresh_token", refreshToken, 7); // 7 days expiry
      }

      if (userData && globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem("user_data", JSON.stringify(userData));
      }

      const abs = expiresValueToAbsoluteMs(expiresRaw ?? undefined);
      if (abs != null) {
        setCookie(ACCESS_TOKEN_EXPIRES_AT_KEY, String(abs), 7);
      }
    } catch (error) {
      logger.error("Error saving tokens:", error);
      throw error;
    }
  },
};

export default tokenUtils;
