import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { grammarApi } from "@/api/grammar";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function mockGraphQL(payload: unknown) {
  server.use(
    http.post(`${API}/graphql`, () => {
      return HttpResponse.json({ data: payload });
    }),
  );
}

describe("grammarApi", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getGrammarModules returns modules", async () => {
    mockGraphQL({ grammar_modules: [{ id: "m1", title: "Ngữ pháp cơ bản" }] });
    expect(await grammarApi.getGrammarModules()).toEqual([
      { id: "m1", title: "Ngữ pháp cơ bản" },
    ]);
  });

  it("getGrammarModules throws wrapped error on failure", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "boom" }] }, { status: 500 });
      }),
    );
    await expect(grammarApi.getGrammarModules()).rejects.toThrow(
      "Failed to fetch grammar Modules",
    );
  });

  it("getGrammarItems returns items", async () => {
    mockGraphQL({ grammar_item: [{ id: "g1", title: "了" }] });
    expect(await grammarApi.getGrammarItems()).toEqual([{ id: "g1", title: "了" }]);
  });

  it("getRandomGrammarItems returns at most 4 items", async () => {
    mockGraphQL({ grammar_item: Array.from({ length: 10 }, (_, i) => ({ id: `g${i}` })) });
    const result = await grammarApi.getRandomGrammarItems();
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("getGrammarDetailById passes both variables", async () => {
    let capturedVariables: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        capturedVariables = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: { grammar_item: [{ id: "g1" }] },
        });
      }),
    );

    await grammarApi.getGrammarDetailById("m1", "t1");
    expect(capturedVariables?.["variables"]).toEqual({ grammarModuleId: "m1", topicId: "t1" });
  });
});
