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

export async function ensureAIConsent(): Promise<boolean> {
  if (await hasAcceptedAIConsent()) {
    return true;
  }

  // If prompt handler is not registered yet, wait up to 1 second for it (React mounts bottom-up)
  if (!consentPromptHandler) {
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (consentPromptHandler) {
        break;
      }
    }
  }

  if (!consentPromptHandler) {
    throw new AIConsentRequiredError(
      "AI consent prompt is not available. Wrap the app with AIConsentProvider.",
    );
  }

  return consentPromptHandler();
}
