import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { vocabularyApi } from "@/api/vocabulary";
import { clearUserCache } from "@/api/apiService";
import {
  VOCAB_DETAIL_FLOW_PATH,
  UPDATE_NOTE_VOCAB_FLOW_PATH,
  ADD_NOTE_TO_VOCAB_FLOW_PATH,
} from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("vocabularyApi", () => {
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

  it("getDictionaryLevels returns levels from GraphQL", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ data: { dictionary_levels: [{ id: "l1", name: "HSK 1" }] } });
      }),
    );

    const result = await vocabularyApi.getDictionaryLevels();
    expect(result).toEqual([{ id: "l1", name: "HSK 1" }]);
  });

  it("getDictionaryLevels throws wrapped error on failure", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "boom" }] }, { status: 500 });
      }),
    );

    await expect(vocabularyApi.getDictionaryLevels()).rejects.toThrow(
      "Failed to fetch topics",
    );
  });

  it("getDetailVocabulary returns empty array on failure", async () => {
    document.cookie = "access_token=tok; refresh_token=ref; path=/";
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ data: { dictionary_levels: [] } });
      }),
      http.get(`${API}${VOCAB_DETAIL_FLOW_PATH}`, () => {
        return HttpResponse.json({ error: "nope" }, { status: 500 });
      }),
    );

    const result = await vocabularyApi.getDetailVocabulary("v-1");
    expect(result).toEqual([]);
  });

  it("updateNoteVocab posts userId and note to flow", async () => {
    document.cookie = "access_token=tok; refresh_token=ref; path=/";

    let capturedBody: object | null = null;
    server.use(
      http.post(`${API}${UPDATE_NOTE_VOCAB_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await vocabularyApi.updateNoteVocab("v-1", "my note");

    expect(capturedBody).toEqual({
      userId: "profile-001",
      vocabId: "v-1",
      note: "my note",
    });
  });

  it("addNoteToVocabulary posts vocabulary_id, note, user_id", async () => {
    document.cookie = "access_token=tok; refresh_token=ref; path=/";

    let capturedBody: object | null = null;
    server.use(
      http.post(`${API}${ADD_NOTE_TO_VOCAB_FLOW_PATH}`, async ({ request }) => {
        capturedBody = (await request.json()) as object;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await vocabularyApi.addNoteToVocabulary("v-2", "ghi chú");

    expect(capturedBody).toEqual({
      vocabulary_id: "v-2",
      note: "ghi chú",
      user_id: "profile-001",
    });
  });
});
