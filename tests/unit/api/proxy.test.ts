import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function makeRequest(
  url: string,
  options?: { accessToken?: string },
): NextRequest {
  const headers = new Headers();
  if (options?.accessToken) {
    headers.set("Cookie", `access_token=${options.accessToken}`);
  }
  return new NextRequest(url, { headers });
}

describe("proxy middleware — auth route guard", () => {
  it("redirects to /sign-in when accessing /dashboard without token", () => {
    const res = proxy(makeRequest("http://localhost:3000/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("redirects to /sign-in with redirect param preserving target", () => {
    const res = proxy(makeRequest("http://localhost:3000/bilingual"));
    const location = res.headers.get("location")!;
    const url = new URL(location);
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("redirect")).toBe("/bilingual");
  });

  it("allows access to protected routes when token present", () => {
    const res = proxy(makeRequest("http://localhost:3000/dashboard", { accessToken: "tok" }));
    expect(res.status).toBe(200);
  });

  it("redirects /sign-in to /dashboard when token exists", () => {
    const res = proxy(makeRequest("http://localhost:3000/sign-in", { accessToken: "tok" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("allows access to /sign-in without token", () => {
    const res = proxy(makeRequest("http://localhost:3000/sign-in"));
    expect(res.status).toBe(200);
  });

  it("redirects root / to /dashboard when token exists", () => {
    const res = proxy(makeRequest("http://localhost:3000/", { accessToken: "tok" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("serves landing page at / without token", () => {
    const res = proxy(makeRequest("http://localhost:3000/"));
    expect(res.status).toBe(200);
  });

  it("protects nested routes under /dashboard", () => {
    const res = proxy(makeRequest("http://localhost:3000/dashboard/services"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("rewrites speech transcription requests to marutek.space", () => {
    const res = proxy(makeRequest("http://localhost:3000/api/speech/transcribe"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toContain("marutek.space");
  });
});
