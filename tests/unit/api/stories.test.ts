import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import {
  getBookLibraryById,
  getBookGenres,
  getTrendingBooks,
  getRandomBooks,
  getLatestBooks,
  saveReadingProgress,
  deleteReadingProgress,
  getRandomGenresWithBooks,
} from "@/api/stories";
import { clearUserCache } from "@/api/apiService";
import { TEST_PROFILE } from "@/tests/mocks/fixtures/users";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function mockGraphQL(payload: unknown) {
  server.use(
    http.post(`${API}/graphql`, () => {
      return HttpResponse.json({ data: payload });
    }),
  );
}

describe("stories API — GraphQL fetchers", () => {
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

  it("getBookLibraryById returns first matching book", async () => {
    mockGraphQL({ book_library: [{ id: "b-1", title: "Truyện Kiều" }] });
    expect(await getBookLibraryById("b-1")).toEqual({ id: "b-1", title: "Truyện Kiều" });
  });

  it("getBookGenres returns genre list", async () => {
    mockGraphQL({ book_genre: [{ id: "g-1", title: "Truyện" }] });
    expect(await getBookGenres()).toEqual([{ id: "g-1", title: "Truyện" }]);
  });

  it("getTrendingBooks filters popular books", async () => {
    mockGraphQL({
      book_library: [
        { id: "b-1", popular: true },
        { id: "b-2", popular: false },
        { id: "b-3", popular: true },
      ],
    });
    const result = await getTrendingBooks();
    expect(result.map((b: { id: string }) => b.id)).toEqual(["b-1", "b-3"]);
  });

  it("getTrendingBooks returns [] on error instead of throwing", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "boom" }] }, { status: 500 });
      }),
    );
    expect(await getTrendingBooks()).toEqual([]);
  });

  it("getRandomBooks returns at most 5 books", async () => {
    mockGraphQL({
      book_library: Array.from({ length: 20 }, (_, i) => ({ id: `b-${i}` })),
    });
    const result = await getRandomBooks();
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("getLatestBooks returns book list", async () => {
    mockGraphQL({ book_library: [{ id: "b-1" }] });
    expect(await getLatestBooks()).toEqual([{ id: "b-1" }]);
  });

  it("getRandomGenresWithBooks groups and returns at most 4 genres", async () => {
    mockGraphQL({
      book_library_book_genre: Array.from({ length: 10 }, (_, i) => ({
        book_genre_id: { id: `g-${i % 4}`, title: `Genre ${i % 4}` },
        book_library_id: { id: `b-${i}` },
      })),
    });
    const result = await getRandomGenresWithBooks();
    expect(result.length).toBeLessThanOrEqual(4);
    expect(result.every((g: { books: unknown[] }) => g.books.length > 0)).toBe(true);
  });
});

describe("saveReadingProgress", () => {
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

  it("throws when bookId is missing", async () => {
    await expect(
      saveReadingProgress("", 1, 50),
    ).rejects.toThrow("Invalid parameters for saving reading progress");
  });

  it("throws when chapterId is 0", async () => {
    await expect(saveReadingProgress("b-1", 0, 50)).rejects.toThrow(
      "Invalid parameters for saving reading progress",
    );
  });

  it("throws when progressPercentage is 0", async () => {
    await expect(saveReadingProgress("b-1", 1, 0)).rejects.toThrow(
      "Invalid parameters for saving reading progress",
    );
  });

  it("updates existing progress when record exists", async () => {
    const capturedVariables: (object | undefined)[] = [];
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { variables?: object };
        capturedVariables.push(body.variables);
        return HttpResponse.json({
          data: {
            User_Reading_Progress: [{ id: "rp-1" }],
            update_User_Reading_Progress_items: [{ id: "rp-1" }],
          },
        });
      }),
    );

    await saveReadingProgress("b-1", 3, 75.6);

    // Call 1 = exist check; call 2 = update mutation
    expect(capturedVariables).toHaveLength(2);
    expect(capturedVariables[0]).toEqual({ userId: TEST_PROFILE.id, bookId: "b-1" });
    expect(capturedVariables[1]).toEqual({ ids: ["rp-1"], chapter: 3, decimal: 75 });
  });

  it("creates new progress when record does not exist", async () => {
    const capturedVariables: (object | undefined)[] = [];
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { variables?: object };
        capturedVariables.push(body.variables);
        return HttpResponse.json({
          data: {
            User_Reading_Progress: [],
            create_User_Reading_Progress_item: { id: "rp-new" },
          },
        });
      }),
    );

    await saveReadingProgress("b-1", 2, 40);

    expect(capturedVariables).toHaveLength(2);
    expect(capturedVariables[1]).toEqual({
      userId: TEST_PROFILE.id,
      bookId: "b-1",
      chapter: 2,
      decimal: 40,
    });
  });

  it("floors chapterId and progressPercentage", async () => {
    const capturedVariables: (object | undefined)[] = [];
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { variables?: object };
        capturedVariables.push(body.variables);
        return HttpResponse.json({ data: { User_Reading_Progress: [] } });
      }),
    );

    await saveReadingProgress("b-1", 3.9, 99.9);

    const second = capturedVariables[1] as { chapter: number; decimal: number };
    expect(second.chapter).toBe(3);
    expect(second.decimal).toBe(99);
  });
});

describe("deleteReadingProgress", () => {
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

  it("deletes existing progress", async () => {
    const capturedVariables: (object | undefined)[] = [];
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { variables?: object };
        capturedVariables.push(body.variables);
        return HttpResponse.json({
          data: {
            User_Reading_Progress: [{ id: "rp-1" }],
            delete_User_Reading_Progress_item: { id: "rp-1" },
          },
        });
      }),
    );

    await deleteReadingProgress("b-1");

    expect(capturedVariables).toHaveLength(2);
    expect(capturedVariables[1]).toEqual({ id: "rp-1" });
  });

  it("returns { deleted: false } when record has no id", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ data: { User_Reading_Progress: [{}] } });
      }),
    );

    const result = await deleteReadingProgress("b-1");
    expect(result).toEqual({ deleted: false });
  });
});
