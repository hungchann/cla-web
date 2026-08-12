import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { graphqlRequest, graphqlRequestSystem, graphqlSystemRequest } from "@/api/graphql/client";
import gql from "graphql-tag";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const QUERY = gql`
  query Test {
    Sections {
      id
    }
  }
`;

describe("graphqlRequest", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns data on success", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ data: { Sections: [{ id: "s1" }] } });
      }),
    );

    const result = await graphqlRequest<{ Sections: { id: string }[] }>(QUERY);
    expect(result.data.Sections).toEqual([{ id: "s1" }]);
  });

  it("sends query and variables in body", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API}/graphql`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: {} });
      }),
    );

    await graphqlRequest(QUERY, { id: "abc" });
    expect(capturedBody?.["query"]).toContain("query Test");
    expect(capturedBody?.["variables"]).toEqual({ id: "abc" });
  });

  it("throws when GraphQL returns errors", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "boom" }] });
      }),
    );

    await expect(graphqlRequest(QUERY)).rejects.toThrow("GraphQL request failed");
  });

  it("throws on HTTP error", async () => {
    server.use(
      http.post(`${API}/graphql`, () => {
        return HttpResponse.json({ errors: [{ message: "x" }] }, { status: 500 });
      }),
    );
    await expect(graphqlRequest(QUERY)).rejects.toThrow();
  });
});

describe("graphqlRequestSystem", () => {
  it("posts to /graphql/system", async () => {
    let requestedUrl = "";
    server.use(
      http.post(`${API}/graphql/system`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await graphqlRequestSystem(QUERY);
    expect(requestedUrl).toContain("/graphql/system");
  });
});

describe("graphqlSystemRequest (raw axios, custom url)", () => {
  it("posts to provided URL", async () => {
    let requestedUrl = "";
    server.use(
      http.post(`${API}/graphql/system`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ data: { auth_refresh: { access_token: "t" } } });
      }),
    );

    await graphqlSystemRequest(QUERY, { refresh_token: "r" }, `${API}/graphql/system`);
    expect(requestedUrl).toContain("/graphql/system");
  });

  it("throws on GraphQL errors", async () => {
    server.use(
      http.post(`${API}/graphql/system`, () => {
        return HttpResponse.json({ errors: [{ message: "invalid" }] });
      }),
    );

    await expect(
      graphqlSystemRequest(QUERY, {}, `${API}/graphql/system`),
    ).rejects.toThrow("GraphQL system request failed");
  });
});
