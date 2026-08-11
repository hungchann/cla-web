import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";

vi.mock("axios");

import { GET, POST } from "@/app/api/chinese/[action]/route";

const mockedAxios = vi.mocked(axios, true);

describe("POST /api/chinese/[action]", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("proxies request body to marutek.space and returns response data", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { translation: "你好" },
    });

    const request = new Request("http://localhost:3000/api/chinese/translate", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
    });
    const params = Promise.resolve({ action: "translate" });

    const res = await POST(request, { params });
    const body = await res.json();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://marutek.space/api/chinese/translate",
      { text: "hello" },
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(res.status).toBe(200);
    expect(body).toEqual({ translation: "你好" });
  });

  it("returns 500 with error message on upstream failure", async () => {
    mockedAxios.post.mockRejectedValueOnce(
      Object.assign(new Error("boom"), { response: { status: 500, data: {} } }),
    );

    const request = new Request("http://localhost:3000/api/chinese/translate", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
    });
    const params = Promise.resolve({ action: "translate" });

    const res = await POST(request, { params });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("boom");
  });

  it("forwards upstream error status code", async () => {
    mockedAxios.post.mockRejectedValueOnce(
      Object.assign(new Error("not found"), { response: { status: 404, data: {} } }),
    );

    const request = new Request("http://localhost:3000/api/chinese/translate", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const params = Promise.resolve({ action: "translate" });

    const res = await POST(request, { params });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/chinese/[action]", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes query params through to upstream", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { word: "你好" } });

    const request = new Request(
      "http://localhost:3000/api/chinese/translate?word=%E4%BD%A0%E5%A5%BD",
    );
    const params = Promise.resolve({ action: "translate" });

    const res = await GET(request, { params });
    const body = await res.json();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://marutek.space/api/chinese/translate",
      expect.objectContaining({
        params: { word: "你好" },
        timeout: 30000,
      }),
    );
    expect(res.status).toBe(200);
    expect(body).toEqual({ word: "你好" });
  });

  it("returns 500 on upstream failure", async () => {
    mockedAxios.get.mockRejectedValueOnce(
      Object.assign(new Error("down"), { response: { status: 502, data: {} } }),
    );

    const request = new Request("http://localhost:3000/api/chinese/translate?word=hi");
    const params = Promise.resolve({ action: "translate" });

    const res = await GET(request, { params });
    expect(res.status).toBe(502);
  });
});
