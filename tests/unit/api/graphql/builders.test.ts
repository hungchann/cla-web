import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { buildBilingualItemsPagedQuery } from "@/api/graphql/builders/bilingual";
import { bilingualApi } from "@/api/bilingual";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

describe("buildBilingualItemsPagedQuery", () => {
  it("builds query with limit and offset", () => {
    const q = buildBilingualItemsPagedQuery({
      limit: 10,
      offset: 20,
      listSuffix: "",
      aggregateArgs: "",
    });

    expect(q).toContain("limit: 10");
    expect(q).toContain("offset: 20");
    expect(q).toContain("Sections_aggregated");
    expect(q).toContain("Sections(");
  });

  it("embeds listSuffix filter", () => {
    const q = buildBilingualItemsPagedQuery({
      limit: 5,
      offset: 0,
      listSuffix: ', filter: { level: { _eq: "HSK 4" } }',
      aggregateArgs: '(filter: { level: { _eq: "HSK 4" } })',
    });

    expect(q).toContain('filter: { level: { _eq: "HSK 4" } }');
    expect(q).toContain("Sections_aggregated(filter: { level: { _eq: \"HSK 4\" } })");
  });
});

describe("getBilingualItemsPaged — filter & escape logic", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("applies level filter to list and aggregate", async () => {
    let capturedQuery = "";
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { query?: string };
        capturedQuery = body.query ?? "";
        return HttpResponse.json({
          data: {
            list: [{ id: "s1", title: "X", date_created: "2024-01-01" }],
            meta: [{ count: { id: 1 } }],
          },
        });
      }),
    );

    const result = await bilingualApi.getBilingualItemsPaged({
      limit: 10,
      offset: 0,
      level: "HSK 4",
    });

    expect(capturedQuery).toContain('level: { _eq: "HSK 4" }');
    expect(capturedQuery).toContain("Sections_aggregated(filter: { level: { _eq: \"HSK 4\" } })");
    expect(result.totalCount).toBe(1);
  });

  it("escapes quotes in level to prevent injection", async () => {
    let capturedQuery = "";
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { query?: string };
        capturedQuery = body.query ?? "";
        return HttpResponse.json({ data: { list: [], meta: [{ count: { id: 0 } }] } });
      }),
    );

    await bilingualApi.getBilingualItemsPaged({
      limit: 10,
      offset: 0,
      level: 'HSK "4"',
    });

    // Dấu nháy phải được escape để không phá vỡ GraphQL string
    expect(capturedQuery).not.toContain('level: { _eq: "HSK "4"" }');
    expect(capturedQuery).toContain('HSK \\"4\\"');
  });

  it("combines level and topicTitle with _and", async () => {
    let capturedQuery = "";
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { query?: string };
        capturedQuery = body.query ?? "";
        return HttpResponse.json({ data: { list: [], meta: [{ count: { id: 0 } }] } });
      }),
    );

    await bilingualApi.getBilingualItemsPaged({
      limit: 10,
      offset: 0,
      level: "HSK 4",
      topicTitle: "Văn hóa",
    });

    expect(capturedQuery).toContain("_and: [");
    expect(capturedQuery).toContain('level: { _eq: "HSK 4" }');
    expect(capturedQuery).toContain("Văn hóa");
  });

  it("omits filter when no level or topic", async () => {
    let capturedQuery = "";
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        const body = (await request.json()) as { query?: string };
        capturedQuery = body.query ?? "";
        return HttpResponse.json({ data: { list: [], meta: [{ count: { id: 0 } }] } });
      }),
    );

    await bilingualApi.getBilingualItemsPaged({ limit: 10, offset: 0 });

    expect(capturedQuery).not.toContain("filter:");
  });
});

