import { Page } from "@playwright/test";

/**
 * Mock toàn bộ Directus API để E2E chạy được không cần tài khoản thật.
 * Mọi request HTTP tới marutek.space bị intercept tại browser.
 */
export async function mockBackend(page: Page): Promise<void> {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    // GraphQL
    if (path === "/graphql/system") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            auth_refresh: {
              access_token: "e2e-access-token",
              refresh_token: "e2e-refresh-token",
              expires: 900,
            },
          },
        }),
      });
    }

    if (path === "/graphql") {
      // Bilingual list: trả về 2 bài đọc để test trang /bilingual
      const body = route.request().postDataJSON();
      const query = body?.query || "";
      if (query.includes("Sections_aggregated")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              list: [
                {
                  id: "srv-e2e-1",
                  title: "Bài đọc E2E",
                  title_trans: "Bài đọc E2E",
                  image: null,
                  date_created: "2024-01-01T00:00:00.000Z",
                  genre_id: [],
                  level: "HSK4",
                },
                {
                  id: "srv-e2e-2",
                  title: "Văn hóa Trung Quốc",
                  title_trans: "Văn hóa Trung Quốc",
                  image: null,
                  date_created: "2024-01-02T00:00:00.000Z",
                  genre_id: [],
                  level: "HSK5",
                },
              ],
              meta: [{ count: { id: 2 } }],
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { Sections: [] } }),
      });
    }

    // Auth
    if (path === "/auth/login") {
      const body = route.request().postDataJSON();
      if (body?.password !== "correct-password") {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            errors: [{ message: "Thông tin đăng nhập không đúng" }],
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            access_token: "e2e-access-token",
            refresh_token: "e2e-refresh-token",
            expires: 900,
          },
        }),
      });
    }

    if (path === "/auth/logout") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: null }),
      });
    }

    // User me
    if (path === "/users/me") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "e2e-user",
            email: "e2e@example.com",
            first_name: "E2E",
            last_name: "User",
            role: "agency_sales",
          },
        }),
      });
    }

    // User profile
    if (path === "/items/user_profiles") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [{ id: "e2e-profile", user_id: "e2e-user" }] }),
      });
    }

    // Flows
    if (path.startsWith("/flows/trigger/")) {
      // GET email check flow → trả exists:false (email mới)
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ exists: false }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    }

    // Everything else — pass through
    return route.continue();
  });
}

/** Đăng nhập trực tiếp bằng cách set cookie — nhanh hơn đi qua form. */
export async function loginAsE2EUser(page: Page): Promise<void> {
  await page.context().addCookies([
    { name: "access_token", value: "e2e-access-token", url: "http://localhost:3100" },
    { name: "refresh_token", value: "e2e-refresh-token", url: "http://localhost:3100" },
  ]);
}
