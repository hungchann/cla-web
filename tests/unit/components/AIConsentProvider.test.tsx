import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIConsentProvider from "@/components/AIConsentProvider";
import { ensureAIConsent } from "@/services/aiConsentGate";
import { hasAcceptedAIConsent } from "@/lib/ai/aiConsentStorage";

function renderWithProvider() {
  return render(
    <AIConsentProvider>
      <div>Nội dung con</div>
    </AIConsentProvider>,
  );
}

describe("AIConsentProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders children", () => {
    renderWithProvider();
    expect(screen.getByText("Nội dung con")).toBeInTheDocument();
  });

  it("registers a consent prompt handler that opens the dialog", async () => {
    renderWithProvider();

    const consentPromise = ensureAIConsent();

    expect(await screen.findByText("Kích hoạt tính năng thông minh AI")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /chấp nhận & tiếp tục/i }));
    await expect(consentPromise).resolves.toBe(true);
  });

  it("accepting consent saves it to storage", async () => {
    renderWithProvider();

    const consentPromise = ensureAIConsent();
    await screen.findByText("Kích hoạt tính năng thông minh AI");

    await userEvent.click(screen.getByRole("button", { name: /chấp nhận & tiếp tục/i }));
    await consentPromise;

    expect(await hasAcceptedAIConsent()).toBe(true);
  });

  it("declining consent resolves false and does not save", async () => {
    renderWithProvider();

    const consentPromise = ensureAIConsent();
    await screen.findByText("Kích hoạt tính năng thông minh AI");

    await userEvent.click(screen.getByRole("button", { name: /để sau/i }));
    await expect(consentPromise).resolves.toBe(false);

    expect(await hasAcceptedAIConsent()).toBe(false);
  });

  it("dialog closes after decision", async () => {
    renderWithProvider();

    const consentPromise = ensureAIConsent();
    await screen.findByText("Kích hoạt tính năng thông minh AI");

    await userEvent.click(screen.getByRole("button", { name: /để sau/i }));
    await consentPromise;

    await waitFor(() => {
      expect(screen.queryByText("Kích hoạt tính năng thông minh AI")).not.toBeInTheDocument();
    });
  });

  it("unregisters the prompt handler on unmount", async () => {
    const { unmount } = renderWithProvider();
    unmount();

    // Không có handler → ensureAIConsent phải throw AIConsentRequiredError sau khi chờ
    await expect(ensureAIConsent()).rejects.toThrow(/consent/i);
  });
});
