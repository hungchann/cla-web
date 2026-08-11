import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { bilingualApi } from "@/api/bilingual";
import { RAW_SECTION } from "@/tests/mocks/fixtures/bilingual";
import { ADD_NOTE_TO_VOCAB_FLOW_PATH, EXERCISE_BY_ID_FLOW_PATH, SUBMIT_EXERCISE_FLOW_PATH } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function mockGraphQL(payload: unknown) {
  server.use(
    http.post(`${API}/graphql`, () => {
      return HttpResponse.json({ data: payload });
    }),
  );
}

describe("bilingualApi — GraphQL fetchers", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getTopics returns genres", async () => {
    mockGraphQL({ genre_of_section: [{ id: "g1", title: "Văn hóa" }] });
    expect(await bilingualApi.getTopics()).toEqual([{ id: "g1", title: "Văn hóa" }]);
  });

  it("getLevels returns hsk levels", async () => {
    mockGraphQL({ hsk_level: [{ id: "l1", title: "HSK 1" }] });
    expect(await bilingualApi.getLevels()).toEqual([{ id: "l1", title: "HSK 1" }]);
  });

  it("getBilingualItemsPaged maps items and totalCount", async () => {
    const section = { ...RAW_SECTION, id: "srv-01" };
    mockGraphQL({
      list: [section, { ...section, id: "srv-02" }],
      meta: [{ count: { id: 42 } }],
    });

    const result = await bilingualApi.getBilingualItemsPaged({ limit: 10, offset: 0 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("srv-01");
    expect(result.totalCount).toBe(42);
  });

  it("getBilingualItemsPaged falls back totalCount when aggregate missing", async () => {
    mockGraphQL({ list: [RAW_SECTION], meta: null });
    const result = await bilingualApi.getBilingualItemsPaged({ limit: 10, offset: 0 });
    expect(result.totalCount).toBe(1); // items.length < limit → offset + length
  });

  it("getBilingualItemById returns section", async () => {
    mockGraphQL({ Sections_by_id: RAW_SECTION });
    expect((await bilingualApi.getBilingualItemById("s1")).id).toBe("srv-01");
  });

  it("getBilingualItemById maps 401 to Unauthorized error", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
      }),
    );
    await expect(bilingualApi.getBilingualItemById("s1")).rejects.toThrow("Unauthorized");
  });
});

describe("bilingualApi — flow endpoints", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("getVocabularyById posts to vocab flow with id param", async () => {
    let requestedUrl = "";
    server.use(
      http.post(`${API}${ADD_NOTE_TO_VOCAB_FLOW_PATH}*`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await bilingualApi.getVocabularyById("v-1");
    expect(requestedUrl).toContain("id=v-1");
  });

  it("getExerciseById returns empty exercise object when no result", async () => {
    server.use(
      http.post(`${API}${EXERCISE_BY_ID_FLOW_PATH}*`, () => {
        return HttpResponse.json({ data: { result: [] } });
      }),
    );

    const result = await bilingualApi.getExerciseById("ex-1");
    expect(result).toEqual({ exercises: [], id: "ex-1", title: "", description: "" });
  });

  it("getExerciseById returns first result when present", async () => {
    server.use(
      http.post(`${API}${EXERCISE_BY_ID_FLOW_PATH}*`, () => {
        return HttpResponse.json({ result: [{ id: "ex-1", title: "Bài tập" }] });
      }),
    );
    expect(await bilingualApi.getExerciseById("ex-1")).toEqual({ id: "ex-1", title: "Bài tập" });
  });

  it("submitExercise posts answers", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}${SUBMIT_EXERCISE_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: { score: 80 } });
      }),
    );

    const result = await bilingualApi.submitExercise([{ q: 1, a: "A" }]);
    expect(capturedBody).toEqual({ answers: [{ q: 1, a: "A" }] });
    expect(result).toEqual({ data: { score: 80 } });
  });
});
