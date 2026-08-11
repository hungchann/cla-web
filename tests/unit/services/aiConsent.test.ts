import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  AIConsentRequiredError,
  isAIConsentRequiredError,
  AI_CONSENT_REQUIRED_CODE,
} from "@/services/aiConsentErrors";
import { sendAIRequest } from "@/services/aiRequestService";
import {
  registerAIConsentPrompt,
  unregisterAIConsentPrompt,
  ensureAIConsent,
} from "@/services/aiConsentGate";
import {
  acceptAIConsent,
  resetAIConsent,
  hasAcceptedAIConsent,
} from "@/lib/ai/aiConsentStorage";

describe("aiConsentErrors", () => {
  it("marks instance as consent required", () => {
    const err = new AIConsentRequiredError("need consent");
    expect(err.code).toBe(AI_CONSENT_REQUIRED_CODE);
    expect(err.name).toBe("AIConsentRequiredError");
    expect(isAIConsentRequiredError(err)).toBe(true);
  });

  it("detects plain objects with matching code", () => {
    expect(isAIConsentRequiredError({ code: AI_CONSENT_REQUIRED_CODE })).toBe(true);
    expect(isAIConsentRequiredError({ code: "OTHER" })).toBe(false);
    expect(isAIConsentRequiredError(null)).toBe(false);
    expect(isAIConsentRequiredError(new Error("x"))).toBe(false);
  });
});

describe("aiConsentStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false when consent not accepted", async () => {
    expect(await hasAcceptedAIConsent()).toBe(false);
  });

  it("returns true after accepting consent", async () => {
    await acceptAIConsent();
    expect(await hasAcceptedAIConsent()).toBe(true);
  });

  it("returns false after resetting consent", async () => {
    await acceptAIConsent();
    await resetAIConsent();
    expect(await hasAcceptedAIConsent()).toBe(false);
  });
});

describe("ensureAIConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    unregisterAIConsentPrompt();
  });

  afterEach(() => {
    unregisterAIConsentPrompt();
    vi.restoreAllMocks();
  });

  it("returns true when consent already accepted", async () => {
    await acceptAIConsent();
    expect(await ensureAIConsent()).toBe(true);
  });

  it("returns result of registered prompt handler", async () => {
    registerAIConsentPrompt(() => Promise.resolve(true));
    expect(await ensureAIConsent()).toBe(true);
  });

  it("returns false when prompt handler returns false", async () => {
    registerAIConsentPrompt(() => Promise.resolve(false));
    expect(await ensureAIConsent()).toBe(false);
  });

  it("throws AIConsentRequiredError when no handler registered", async () => {
    await expect(ensureAIConsent()).rejects.toBeInstanceOf(AIConsentRequiredError);
  });
});

describe("sendAIRequest", () => {
  beforeEach(() => {
    localStorage.clear();
    unregisterAIConsentPrompt();
  });

  afterEach(() => {
    unregisterAIConsentPrompt();
    vi.restoreAllMocks();
  });

  it("executes the request when consent is accepted", async () => {
    await acceptAIConsent();
    const executor = vi.fn().mockResolvedValue("result");
    await expect(sendAIRequest(executor)).resolves.toBe("result");
    expect(executor).toHaveBeenCalledOnce();
  });

  it("throws AIConsentRequiredError when consent declined", async () => {
    registerAIConsentPrompt(() => Promise.resolve(false));
    const executor = vi.fn();
    await expect(
      sendAIRequest(executor, { declinedMessage: "Bạn chưa đồng ý" }),
    ).rejects.toThrow("Bạn chưa đồng ý");
    expect(executor).not.toHaveBeenCalled();
  });

  it("uses default message when declinedMessage omitted", async () => {
    registerAIConsentPrompt(() => Promise.resolve(false));
    const executor = vi.fn();
    await expect(sendAIRequest(executor)).rejects.toThrow(
      "You chose not to share data with our AI learning service",
    );
  });
});
