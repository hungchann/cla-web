import { test, expect } from "@playwright/test";
import { mockBackend, loginAsE2EUser } from "./helpers";

test.describe("Flashcard study", () => {
  test("logged-in user can study flashcards", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/flashcard/study?notebook=test");

    // Trang fallback về mock words khi API không trả dữ liệu
    await expect(page.getByText("爱", { exact: true }).first()).toBeVisible({ timeout: 15000 });
  });

  test("user can flip the flashcard", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/flashcard/study?notebook=test");
    await expect(page.getByText("爱", { exact: true }).first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /lật thẻ/i }).click();
    // Meaning hiển thị sau khi flip
    await expect(page.getByText("Yêu", { exact: true })).toBeVisible();
  });

  test("user can answer mastered and advance", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/flashcard/study?notebook=test");
    await expect(page.getByText("爱", { exact: true }).first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /đã thuộc/i }).click();
    // Sang từ tiếp theo (学习)
    await expect(page.getByText("学习", { exact: true }).first()).toBeVisible();
  });
});
