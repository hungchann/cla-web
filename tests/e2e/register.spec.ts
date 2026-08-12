import { test, expect } from "@playwright/test";
import { mockBackend } from "./helpers";

test.describe("Register flow", () => {
  test("user can register a new account", async ({ page }) => {
    await mockBackend(page);

    await page.goto("/register");

    await page.getByLabel(/Họ/).fill("Nguyen");
    await page.getByLabel(/Tên \*/).fill("An");
    await page.getByLabel("Email *").fill("new-user@example.com");
    await page.getByLabel(/Mật khẩu \*/).fill("123456");
    await page.getByRole("button", { name: /đăng ký/i }).click();

    await expect(page.getByText(/Đăng ký thành công/)).toBeVisible();
  });

  test("register page validates required fields", async ({ page }) => {
    await mockBackend(page);

    await page.goto("/register");

    // HTML5 required ngăn submit khi form trống — URL không đổi, không có success
    await page.getByRole("button", { name: /đăng ký/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText(/Đăng ký thành công/)).not.toBeVisible();
  });
});
