import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { speakingApi } from "@/api/speaking";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("speakingApi", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getSpeakingModules returns speaking topics from GraphQL", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({
          data: { speaking_topics: [{ id: "t1", title: "Giao tiếp cơ bản" }] },
        });
      }),
    );

    const result = await speakingApi.getSpeakingModules();
    expect(result).toEqual([{ id: "t1", title: "Giao tiếp cơ bản" }]);
  });

  it("getSpeakingCategories passes moduleId variable", async () => {
    let capturedVariables: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        capturedVariables = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: { speaking_scenarios: [{ id: "s1", title: "Chào hỏi" }] },
        });
      }),
    );

    const result = await speakingApi.getSpeakingCategories("t1");
    expect(result).toEqual([{ id: "s1", title: "Chào hỏi" }]);
    expect(capturedVariables?.["variables"]).toEqual({ moduleId: "t1" });
  });

  it("getConversation returns dialogue lines", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({
          data: { speaking_dialogues: [{ id: "d1", chinese_text: "你好" }] },
        });
      }),
    );

    const result = await speakingApi.getConversation("s1");
    expect(result).toEqual([{ id: "d1", chinese_text: "你好" }]);
  });

  it("getAllSpeakingScenarios returns all scenarios", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({
          data: { speaking_scenarios: [{ id: "s1" }, { id: "s2" }] },
        });
      }),
    );

    const result = await speakingApi.getAllSpeakingScenarios();
    expect(result).toHaveLength(2);
  });
});
