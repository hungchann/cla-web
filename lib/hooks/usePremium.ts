import { useState, useEffect } from "react";
import { getAccountType } from "@/api/profile";
import { tokenUtils } from "@/lib/utils/tokenUtils";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPremium() {
      try {
        const tokens = await tokenUtils.checkTokenStatus();
        if (!tokens.userData) {
          setIsPremium(false);
          setIsLoading(false);
          return;
        }

        const data = await getAccountType();
        const profile = data?.user_profiles?.[0];
        if (profile) {
          const typeName = profile.account_type_id?.name;
          const isActive = profile.is_active;
          setIsPremium(!!(typeName && typeName !== "Free" && isActive));
        } else {
          setIsPremium(false);
        }
      } catch {
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPremium();
  }, []);

  return { isPremium, isLoading };
}
