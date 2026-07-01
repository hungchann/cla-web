import { hasAcceptedAIConsent } from "@/lib/ai/aiConsentStorage";
import { AIConsentRequiredError } from "@/services/aiConsentErrors";

type ConsentPromptHandler = () => Promise<boolean>;

let consentPromptHandler: ConsentPromptHandler | null = null;

export function registerAIConsentPrompt(handler: ConsentPromptHandler): void {
  consentPromptHandler = handler;
}

export function unregisterAIConsentPrompt(): void {
  consentPromptHandler = null;
}

/**
 * Ensures the user has accepted AI data sharing.
 * If not yet accepted, invokes the registered in-app prompt (AIConsentProvider).
 */
export async function ensureAIConsent(): Promise<boolean> {
  if (await hasAcceptedAIConsent()) {
    return true;
  }

  if (!consentPromptHandler) {
    throw new AIConsentRequiredError(
      "AI consent prompt is not available. Wrap the app with AIConsentProvider.",
    );
  }

  return consentPromptHandler();
}
