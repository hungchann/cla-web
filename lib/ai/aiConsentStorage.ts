import { logger } from "@/services/logger";

const AI_CONSENT_KEY = "@sun_chinese_ai_consent_accepted_v1";

export async function hasAcceptedAIConsent(): Promise<boolean> {
  try {
    if (typeof window === "undefined") {
      return false; // Server-side default
    }
    const value = window.localStorage.getItem(AI_CONSENT_KEY);
    return value === "true";
  } catch (error) {
    logger.error("[AIConsent] Failed to read consent flag", error);
    return false;
  }
}

export async function acceptAIConsent(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AI_CONSENT_KEY, "true");
    }
  } catch (error) {
    logger.error("[AIConsent] Failed to save consent flag", error);
    throw error;
  }
}

export async function resetAIConsent(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AI_CONSENT_KEY);
    }
  } catch (error) {
    logger.error("[AIConsent] Failed to reset consent flag", error);
    throw error;
  }
}
