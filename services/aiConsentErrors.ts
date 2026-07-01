export const AI_CONSENT_REQUIRED_CODE = "AI_CONSENT_REQUIRED";

export class AIConsentRequiredError extends Error {
  readonly code = AI_CONSENT_REQUIRED_CODE;

  constructor(
    message = "AI consent is required before this request can be sent.",
  ) {
    super(message);
    this.name = "AIConsentRequiredError";
  }
}

export function isAIConsentRequiredError(error: unknown): error is AIConsentRequiredError {
  return (
    error instanceof AIConsentRequiredError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === AI_CONSENT_REQUIRED_CODE)
  );
}
