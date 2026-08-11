import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { userApi } from "@/api/user";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("userApi", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getCurrentUser returns user data", async () => {
    server.use(
      http.get(`${API}/user/me`, () => {
        return HttpResponse.json({ data: { id: "u1" } });
      }),
    );
    expect(await userApi.getCurrentUser()).toEqual({ data: { id: "u1" } });
  });

  it("getCurrentUser returns null on failure", async () => {
    server.use(
      http.get(`${API}/user/me`, () => {
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );
    expect(await userApi.getCurrentUser()).toBeNull();
  });

  it("updateTopicsOfInterest puts topics", async () => {
    let requestedUrl = "";
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.put(`${API}/user/:id/topics`, async ({ request }) => {
        requestedUrl = request.url;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await userApi.updateTopicsOfInterest([1, 2, 3], "u-1");
    expect(requestedUrl).toContain("/user/u-1/topics");
    expect(capturedBody).toEqual({ topics: [1, 2, 3] });
  });

  it("deleteUser surfaces GraphQL error message", async () => {
    server.use(
      http.post(`${API}/graphql/system`, () => {
        return HttpResponse.json(
          { errors: [{ message: "Cannot delete admin user" }] },
          { status: 400 },
        );
      }),
    );

    await expect(userApi.deleteUser("u-1")).rejects.toThrow("Cannot delete admin user");
  });

  it("deleteUser returns deleted item on success", async () => {
    server.use(
      http.post(`${API}/graphql/system`, () => {
        return HttpResponse.json({ data: { delete_users_item: { id: "u-1" } } });
      }),
    );
    expect(await userApi.deleteUser("u-1")).toEqual({ id: "u-1" });
  });
});
