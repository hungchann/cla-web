"use client";

import { useCallback, useState } from "react";

import { usePremium } from "@/lib/hooks/usePremium";

type UsePremiumGateOptions = {
  /** Tự mở modal khi màn hình mount và user không phải premium (sau khi loading xong). */
  showOnMount?: boolean;
};

/**
 * Chuẩn hóa chặn tính năng premium — mirror CHINESE-LEARNING-APP `usePremiumGate`.
 * Đợi PremiumContext load xong rồi mới quyết định, tránh flash modal hoặc bỏ qua gate.
 *
 * Trạng thái modal được suy ra (derived) thay vì set trong effect để tránh
 * cascade render: `showOnMount` = tự mở khi khóa (có thể đóng); ngược lại là
 * state thủ công do caller bật/tắt.
 */
export function usePremiumGate(options?: UsePremiumGateOptions) {
  const { isPremium, isLoading } = usePremium();
  const [manualVisible, setManualVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isLocked = !isLoading && !isPremium;

  const premiumModalVisible =
    options?.showOnMount === true ? isLocked && !dismissed : manualVisible;

  const setPremiumModalVisible = useCallback(
    (visible: boolean) => {
      if (options?.showOnMount === true) {
        setDismissed(!visible);
      } else {
        setManualVisible(visible);
      }
    },
    [options?.showOnMount],
  );

  const showPremiumModal = useCallback(() => {
    if (isLocked) setPremiumModalVisible(true);
  }, [isLocked, setPremiumModalVisible]);

  const guardPremium = useCallback((): boolean => {
    if (isLoading) return false;
    if (isPremium) return true;
    setPremiumModalVisible(true);
    return false;
  }, [isLoading, isPremium, setPremiumModalVisible]);

  return {
    isPremium,
    loading: isLoading,
    isLocked,
    premiumModalVisible,
    setPremiumModalVisible,
    showPremiumModal,
    guardPremium,
  };
}
