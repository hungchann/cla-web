import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import {
  getAccountType,
  getSubscriptionInfo,
  updateHskLevel,
  getTargets,
  postTarget,
  changeNotification,
} from "@/api/profile";
import { clearUserCache } from "@/api/apiService";
import {
  ACCOUNT_TYPE_FLOW_PATH,
  GET_TARGETS_FLOW_PATH,
  UPDATE_HSK_LEVEL_FLOW_PATH,
  UPDATE_TARGET_USER_FLOW_PATH,
} from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("getAccountType", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
    vi.restoreAllMocks();
  });

  it("passes userId from user_data as query param", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-123" }));
    let requestedUrl = "";
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    await getAccountType();
    expect(requestedUrl).toContain(`id=u-123`);
  });

  it("maps flow response to user_profiles shape with active premium", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-123" }));
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, () => {
        return HttpResponse.json([
          { id: 4, user_id: "u-123", expired_time: "2999-01-01T00:00:00", type: "Lifetime" },
        ]);
      }),
    );

    const result = await getAccountType();

    expect(result.user_profiles[0].account_type_id).toEqual({ id: 4, name: "Lifetime" });
    expect(result.user_profiles[0].is_active).toBe(true);
  });

  it("marks subscription inactive when expired", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-123" }));
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, () => {
        return HttpResponse.json([
          { id: 5, user_id: "u-123", expired_time: "2020-01-01T00:00:00", type: "Monthly" },
        ]);
      }),
    );

    const result = await getAccountType();
    expect(result.user_profiles[0].is_active).toBe(false);
  });

  it("returns empty user_profiles when no subscription", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-123" }));
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, () => {
        return HttpResponse.json([]);
      }),
    );

    const result = await getAccountType();
    expect(result.user_profiles).toEqual([]);
  });

  it("passes through already-mapped response", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-123" }));
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, () => {
        return HttpResponse.json({ user_profiles: [{ account_type_id: null, is_active: false }] });
      }),
    );

    const result = await getAccountType();
    expect(result.user_profiles).toEqual([{ account_type_id: null, is_active: false }]);
  });
});

describe("getSubscriptionInfo", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("returns first subscription item", async () => {
    localStorage.setItem("user_data", JSON.stringify({ user_id: "u-1" }));
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, () => {
        return HttpResponse.json([
          { id: 1, user_id: "u-1", expired_time: "2026-01-01", type: "Lifetime" },
        ]);
      }),
    );

    const result = await getSubscriptionInfo();
    expect(result).toEqual({ id: 1, user_id: "u-1", expired_time: "2026-01-01", type: "Lifetime" });
  });

  it("returns null when no subscriptions", async () => {
    server.use(
      http.get(`${API}${ACCOUNT_TYPE_FLOW_PATH}*`, () => {
        return HttpResponse.json([]);
      }),
    );
    expect(await getSubscriptionInfo()).toBeNull();
  });
});

describe("updateHskLevel", () => {
  beforeEach(() => {
    document.cookie = "access_token=tok; refresh_token=ref; path=/";
    localStorage.clear();
    clearUserCache();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
  });

  it("posts profile id and level to flow", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}${UPDATE_HSK_LEVEL_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await updateHskLevel("hsk-5");
    expect(capturedBody).toEqual({ id: "profile-001", self_assessed_hsk_level: "hsk-5" });
  });
});

describe("getTargets / postTarget / changeNotification", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getTargets fetches targets flow", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${API}${GET_TARGETS_FLOW_PATH}`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ data: [{ id: "t1" }] });
      }),
    );
    const result = await getTargets();
    expect(requestedUrl).toContain(GET_TARGETS_FLOW_PATH);
    expect(result).toEqual({ data: [{ id: "t1" }] });
  });

  it("postTarget sends topic_id body and id query param", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    let requestedUrl = "";
    server.use(
      http.post(`${API}${UPDATE_TARGET_USER_FLOW_PATH}*`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        requestedUrl = request.url;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await postTarget({ id: "profile-1", topic_id: "topic-9" });
    expect(capturedBody).toEqual({ topic_id: "topic-9" });
    expect(requestedUrl).toContain("id=profile-1");
  });

  it("changeNotification patches user profile", async () => {
    let requestedUrl = "";
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${API}/items/user_profiles/:id`, async ({ request, params }) => {
        requestedUrl = request.url;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { id: params.id } });
      }),
    );

    await changeNotification(true, "prof-1");
    expect(requestedUrl).toContain("/items/user_profiles/prof-1");
    expect(capturedBody).toEqual({ notification_enabled: true });
  });
});
