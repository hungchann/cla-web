import { test, expect } from "@playwright/test";
import { mockBackend, loginAsE2EUser } from "./helpers";

test.describe("Video library", () => {
  test("logged-in user sees video page", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/video");

    await expect(page.getByText(/Video/i).first()).toBeVisible();
  });
});
