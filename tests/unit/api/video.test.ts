import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { fetchVideoGenres } from "@/api/video";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("fetchVideoGenres", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("returns video genres from GraphQL", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ data: { video_genre: [{ id: "g1", title: "Kinh tế" }] } });
      }),
    );
    expect(await fetchVideoGenres()).toEqual([{ id: "g1", title: "Kinh tế" }]);
  });

  it("rethrows errors", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "x" }] }, { status: 500 });
      }),
    );
    await expect(fetchVideoGenres()).rejects.toThrow();
  });
});
