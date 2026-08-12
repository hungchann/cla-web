import { test, expect } from "@playwright/test";
import { mockBackend, loginAsE2EUser } from "./helpers";

test.describe("Bilingual reading", () => {
  test("logged-in user sees bilingual article list", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/bilingual");

    await expect(page.getByRole("heading", { name: "Đọc Song Ngữ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bài đọc E2E" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Văn hóa Trung Quốc" })).toBeVisible();
  });

  test("logged-in user can open an article detail", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/bilingual");
    await page.getByRole("heading", { name: "Bài đọc E2E" }).click();

    await expect(page).toHaveURL(/\/bilingual\/srv-e2e-1/);
  });
});
