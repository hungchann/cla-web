"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAccountType } from "@/api/profile";
import {
  getAccountTypeName,
  isPremiumAccountType,
  PREMIUM_CACHE_KEY,
  PREMIUM_CACHE_TTL_MS,
} from "@/lib/premium";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { logger } from "@/services/logger";

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  refreshPremium: (force?: boolean) => Promise<void>;
  accountTypeName: string | null;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

interface PremiumCacheEntry {
  isPremium: boolean;
  userId?: string | null;
  timestamp: number;
}

function readCache(userId: string | null): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREMIUM_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PremiumCacheEntry;
    if (!parsed || typeof parsed.timestamp !== "number" || typeof parsed.isPremium !== "boolean") {
      return null;
    }
    if (Date.now() - parsed.timestamp > PREMIUM_CACHE_TTL_MS) return null;
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    if (!parsed.userId && userId) return null;
    return parsed.isPremium;
  } catch {
    return null;
  }
}

function writeCache(userId: string | null, isPremium: boolean) {
  if (typeof window === "undefined") return;
  try {
    const entry: PremiumCacheEntry = {
      isPremium,
      userId,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(PREMIUM_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

/**
 * PremiumProvider — nguồn trạng thái premium dùng chung cho toàn web.
 * Mirror CHINESE-LEARNING-APP `PremiumContext`, bỏ RevenueCat:
 * premium = Directus `account_types` (flow ACCOUNT_TYPE_FLOW) + cache per-user (localStorage).
 */
export function PremiumProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accountTypeName, setAccountTypeName] = useState<string | null>(null);

  const sync = useCallback(async (force = false) => {
    try {
      const userData = tokenUtils.getUserData();
      const hasAuth = !!userData && !!(tokenUtils.getAccessToken() || tokenUtils.getRefreshToken());
      const userIdRaw = userData?.id ?? userData?.user_id ?? null;
      const userId = userIdRaw != null ? String(userIdRaw) : null;

      if (!hasAuth) {
        setIsPremium(false);
        setAccountTypeName(null);
        return;
      }

      if (!force) {
        const cached = readCache(userId);
        if (cached != null) {
          setIsPremium(cached);
          return;
        }
      }

      const data = await getAccountType();
      const name = getAccountTypeName(data);
      const premium = isPremiumAccountType(
        name,
        data?.user_profiles?.[0]?.is_active !== false,
      );

      setAccountTypeName(name);
      setIsPremium(premium);
      writeCache(userId, premium);
    } catch (error) {
      logger.warn("[PremiumContext] sync failed:", error);
      setIsPremium(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sync();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sync]);

  const refreshPremium = useCallback(
    async (force = true) => {
      await sync(force);
    },
    [sync],
  );

  const value = useMemo(
    () => ({ isPremium, loading, refreshPremium, accountTypeName }),
    [isPremium, loading, refreshPremium, accountTypeName],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

/** Trả về context premium; null nếu chưa có PremiumProvider. */
export function usePremiumContext(): PremiumContextValue | null {
  return useContext(PremiumContext);
}
