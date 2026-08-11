import { test, expect } from "@playwright/test";
import { mockBackend } from "./helpers";

test.describe("Auth guard", () => {
  test("unauthenticated user visiting /dashboard is redirected to /sign-in", async ({ page }) => {
    await mockBackend(page);

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText("Chào mừng quay lại!")).toBeVisible();
  });

  test("unauthenticated user visiting /bilingual keeps redirect param", async ({ page }) => {
    await mockBackend(page);

    await page.goto("/bilingual");

    await expect(page).toHaveURL(/\/sign-in\?redirect=%2Fbilingual/);
  });
});
