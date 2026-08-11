import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { getTargetUser, updateTargetUser } from "@/api/target";
import { UPDATE_TARGET_USER_FLOW_PATH } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("getTargetUser", () => {
  it("returns target users from GraphQL", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({
          data: { target_user: [{ id: "t1", title: "HSK 1", description: "..." }] },
        });
      }),
    );

    expect(await getTargetUser()).toEqual([{ id: "t1", title: "HSK 1", description: "..." }]);
  });

  it("throws on failure", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "x" }] }, { status: 500 });
      }),
    );
    await expect(getTargetUser()).rejects.toThrow();
  });
});

describe("updateTargetUser", () => {
  it("posts idprofile and target_id", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}${UPDATE_TARGET_USER_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await updateTargetUser("prof-1", 3);
    expect(capturedBody).toEqual({ idprofile: "prof-1", target_id: 3 });
  });
});
