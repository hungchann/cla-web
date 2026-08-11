import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { notebookApi } from "@/api/notebook";
import { clearUserCache } from "@/api/apiService";
import { FLASHCARD_DECK_VOCABS_FLOW_PATH, VOCAB_DETAIL_FLOW_PATH } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function mockGraphQL(payload: unknown) {
  server.use(
    http.post(`${API}/graphql`, () => {
      return HttpResponse.json({ data: payload });
    }),
  );
}

describe("notebookApi", () => {
  beforeEach(() => {
    document.cookie = "access_token=tok; refresh_token=ref; path=/";
    localStorage.clear();
    clearUserCache();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    clearUserCache();
    vi.restoreAllMocks();
  });

  it("getNoteBooks returns dictionary levels", async () => {
    mockGraphQL({ dictionary_levels: [{ id: "l1", name: "HSK 1" }] });
    expect(await notebookApi.getNoteBooks()).toEqual([{ id: "l1", name: "HSK 1" }]);
  });

  it("createNoteBooks creates deck with user profile id", async () => {
    let capturedVariables: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        capturedVariables = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          data: { create_flashcard_deck_item: { id: "deck-1", title: "Sổ tay" } },
        });
      }),
    );

    const result = await notebookApi.createNoteBooks("Sổ tay");
    expect(capturedVariables?.["variables"]).toEqual({ userId: "profile-001", title: "Sổ tay" });
    expect(result).toEqual({ id: "deck-1", title: "Sổ tay" });
  });

  it("createNoteBooks returns undefined on error (swallowed)", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "boom" }] }, { status: 500 });
      }),
    );
    expect(await notebookApi.createNoteBooks("X")).toBeUndefined();
  });

  it("getPersonalNotebooks returns user decks", async () => {
    mockGraphQL({ flashcard_deck: [{ id: "d1", title: "Từ vựng" }] });
    expect(await notebookApi.getPersonalNotebooks()).toEqual([{ id: "d1", title: "Từ vựng" }]);
  });

  it("getListVocabByIdFlashcardDeck passes id and userId", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${API}${FLASHCARD_DECK_VOCABS_FLOW_PATH}*`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json([{ vocab_items_id: { id: "v1" } }]);
      }),
    );

    const result = await notebookApi.getListVocabByIdFlashcardDeck("deck-1");
    expect(requestedUrl).toContain("id=deck-1");
    expect(requestedUrl).toContain("userId=profile-001");
    expect(result).toEqual([{ vocab_items_id: { id: "v1" } }]);
  });

  it("getDetailVocabularyNotebook returns [] on failure", async () => {
    server.use(
      http.get(`${API}${VOCAB_DETAIL_FLOW_PATH}*`, () => {
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );
    expect(await notebookApi.getDetailVocabularyNotebook("v1")).toEqual([]);
  });

  it("getProgressVocab returns [] when user not authenticated (401)", async () => {
    // Xóa mọi cookie + cache để getUser ném lỗi 401
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    clearUserCache();

    const result = await notebookApi.getProgressVocab();
    expect(result).toEqual([]);
  });
});

describe("notebookApi.updateVocabProgress", () => {
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

  it("updates existing flashcard when record exists", async () => {
    let calls = 0;
    let capturedVariables: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { variables?: Record<string, unknown> };
        capturedVariables = body.variables ?? null;
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ data: { UserFlashcard: [{ id: "uf-1", status: "learning" }] } });
        }
        return HttpResponse.json({ data: { update_UserFlashcard_item: { id: "uf-1", status: "mastered" } } });
      }),
    );

    const result = await notebookApi.updateVocabProgress("system", null, "v1", "mastered");
    expect(calls).toBe(2);
    expect(capturedVariables).toEqual({ id: "uf-1", status: "mastered" });
    expect(result).toEqual({ id: "uf-1", status: "mastered" });
  });

  it("creates new flashcard when no record exists", async () => {
    let calls = 0;
    let capturedVariables: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { variables?: Record<string, unknown> };
        capturedVariables = body.variables ?? null;
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ data: { UserFlashcard: [] } });
        }
        return HttpResponse.json({ data: { create_UserFlashcard_item: { id: "uf-new", status: "favorite" } } });
      }),
    );

    const result = await notebookApi.updateVocabProgress("system", null, "v2", "favorite");
    expect(calls).toBe(2);
    expect(capturedVariables).toEqual({
      userId: "profile-001",
      status: "favorite",
      dictionaryVocabId: "v2",
      flashcardItemId: null,
      deckId: null,
    });
    expect(result).toEqual({ id: "uf-new", status: "favorite" });
  });
});
