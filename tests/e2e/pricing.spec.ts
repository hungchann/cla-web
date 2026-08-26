import { test, expect } from "@playwright/test";
import { mockBackend, loginAsE2EUser } from "./helpers";

/** Mock danh sách gói cước + lịch sử payment (đăng ký sau mockBackend để override catch-all). */
async function mockPricingBackend(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/items/account_plans**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: 2,
            key: "yearly",
            name: "Premium Năm",
            name_trans: "Premium Năm",
            description: "Toàn bộ quyền lợi trong 365 ngày",
            price_vnd: 599000,
            duration_days: 365,
            is_premium: true,
            is_featured: true,
            features: "Video không giới hạn\nSách song ngữ",
            status: "published",
            sort: 1,
          },
          {
            id: 3,
            key: "lifetime",
            name: "Premium Trọn đời",
            name_trans: "Premium Trọn đời",
            description: "Một lần thanh toán, dùng mãi mãi",
            price_vnd: 999000,
            duration_days: 0,
            is_premium: true,
            is_featured: false,
            features: "Mọi quyền lợi Premium vĩnh viễn",
            status: "published",
            sort: 2,
          },
        ],
      }),
    }),
  );

  await page.route("**/api/payments*", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          payments: [
            {
              id: 3,
              status: "verified",
              amount_vnd: 599000,
              discount_vnd: 0,
              date_created: "2026-08-20T10:00:00.000Z",
              verified_at: "2026-08-21T09:00:00.000Z",
            },
          ],
        }),
      });
    }
    return route.fulfill({ status: 401, body: JSON.stringify({ error: "unauthorized" }) });
  });
}

test.describe("Pricing & checkout", () => {
  test("logged-in user sees plans and payment history", async ({ page }) => {
    await mockBackend(page);
    await mockPricingBackend(page);
    await loginAsE2EUser(page);

    await page.goto("/pricing");

    await expect(page.getByRole("heading", { name: "Nâng cấp Premium" })).toBeVisible();
    await expect(page.getByText("Premium Năm")).toBeVisible();
    await expect(page.getByText("Lịch sử thanh toán")).toBeVisible();
    await expect(page.getByText("Đã kích hoạt").first()).toBeVisible();
  });

  test("guest selecting a plan is asked to sign in", async ({ page }) => {
    await mockBackend(page);
    await mockPricingBackend(page);

    await page.goto("/pricing?plan=yearly");

    await expect(page.getByText("Đăng nhập để thanh toán")).toBeVisible();
  });
});
