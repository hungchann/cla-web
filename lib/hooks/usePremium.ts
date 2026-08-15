"use client";

import { useEffect, useState } from "react";

import { getAccountType } from "@/api/profile";
import { usePremiumContext } from "@/lib/context/PremiumContext";
import { isPremiumAccountType } from "@/lib/premium";
import { tokenUtils } from "@/lib/utils/tokenUtils";

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
}

/**
 * usePremium — trạng thái premium của user.
 * Nếu có PremiumProvider (app shell) thì dùng context; ngược lại tự fetch
 * (fallback cho môi trường render cô lập / test).
 */
export function usePremium(): PremiumState {
  const ctx = usePremiumContext();
  const hasProvider = ctx != null;

  const [standalone, setStandalone] = useState<PremiumState>({
    isPremium: false,
    isLoading: true,
  });

  useEffect(() => {
    if (hasProvider) return;

    let cancelled = false;
    (async () => {
      try {
        const tokens = await tokenUtils.checkTokenStatus();
        if (!tokens.userData) {
          if (!cancelled) setStandalone({ isPremium: false, isLoading: false });
          return;
        }

        const data = await getAccountType();
        const profile = data?.user_profiles?.[0];
        const typeName =
          profile?.account_type_id?.name ?? profile?.account_type_id?.type ?? null;
        const isPremium = profile
          ? isPremiumAccountType(typeName, profile.is_active)
          : false;
        if (!cancelled) setStandalone({ isPremium, isLoading: false });
      } catch {
        if (!cancelled) setStandalone({ isPremium: false, isLoading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasProvider]);

  if (hasProvider && ctx) {
    return { isPremium: ctx.isPremium, isLoading: ctx.loading };
  }

  return standalone;
}
