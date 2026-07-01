import { ensureAIConsent } from "@/services/aiConsentGate";
import { AIConsentRequiredError } from "@/services/aiConsentErrors";

export type AIRequestKind = "text" | "voice" | "mixed";

export type SendAIOptions = {
  kind?: AIRequestKind;
  /** Shown when the user declines the consent dialog */
  declinedMessage?: string;
};

const DEFAULT_DECLINED_MESSAGE =
  "You chose not to share data with our AI learning service. This feature is unavailable until you accept the AI disclosure.";

/**
 * Runs an AI-backed network call only after the user has granted AI data-sharing consent.
 * Blocks the request and throws {@link AIConsentRequiredError} if consent was declined or unavailable.
 */
export async function sendAIRequest<T>(
  executor: () => Promise<T>,
  options?: SendAIOptions,
): Promise<T> {
  const consented = await ensureAIConsent();

  if (!consented) {
    throw new AIConsentRequiredError(
      options?.declinedMessage ?? DEFAULT_DECLINED_MESSAGE,
    );
  }

  return executor();
}
