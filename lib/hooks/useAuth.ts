"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { checkAndRefreshToken } from "@/api/apiService";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
    id?: string;
  } | null;
}

/**
 * useAuth — hook tập trung quản lý auth state.
 * Thay thế các nơi đang đọc tokenUtils.getUserData() rải rác.
 */
export function useAuth(): AuthState {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const userData = tokenUtils.getUserData();
      const accessToken = tokenUtils.getAccessToken();
      const refreshToken = tokenUtils.getRefreshToken();

      // Nếu không có cả access và refresh token → chưa đăng nhập
      if (!accessToken && !refreshToken) {
        if (!cancelled) {
          setState({ isAuthenticated: false, isLoading: false, user: null });
        }
        return;
      }

      // Nếu có userData đã cache → dùng ngay, không cần chờ API
      if (userData) {
        if (!cancelled) {
          setState({ isAuthenticated: true, isLoading: false, user: userData });
        }
        // Chạy background token refresh nếu cần
        checkAndRefreshToken().catch(() => {});
        return;
      }

      // Không có userData nhưng có refresh token → thử refresh
      try {
        const ok = await checkAndRefreshToken();
        if (!cancelled) {
          if (ok) {
            const freshUser = tokenUtils.getUserData();
            setState({
              isAuthenticated: true,
              isLoading: false,
              user: freshUser,
            });
          } else {
            setState({ isAuthenticated: false, isLoading: false, user: null });
          }
        }
      } catch {
        if (!cancelled) {
          setState({ isAuthenticated: false, isLoading: false, user: null });
        }
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}
