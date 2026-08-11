import { test, expect } from "@playwright/test";
import { mockBackend, loginAsE2EUser } from "./helpers";

test.describe("Login flow", () => {
  test("user can login with valid credentials and reaches dashboard", async ({ page }) => {
    await mockBackend(page);

    await page.goto("/sign-in");

    await page.getByLabel("Email").fill("e2e@example.com");
    await page.getByLabel("Mật khẩu").fill("correct-password");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Chào bạn, cùng học tiếng Trung nhé")).toBeVisible();
  });

  test("login with wrong password shows error and stays on page", async ({ page }) => {
    await mockBackend(page);

    await page.goto("/sign-in");

    await page.getByLabel("Email").fill("e2e@example.com");
    await page.getByLabel("Mật khẩu").fill("wrong-password");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Thông tin" })).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("logged-in user visiting /sign-in is redirected to /dashboard", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/sign-in");

    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Dashboard", () => {
  test("logged-in user sees all learning areas", async ({ page }) => {
    await mockBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/dashboard");

    for (const title of ["Khóa học", "Đọc song ngữ", "AI luyện nói", "Từ vựng"]) {
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    }
  });
});
