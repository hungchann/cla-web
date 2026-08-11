import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import {
  segmentChineseText,
  segmentSingleChineseText,
  segmentChineseTextWithRetry,
  clearSegmentCache,
} from "@/api/segment";
import { acceptAIConsent } from "@/lib/ai/aiConsentStorage";

describe("segmentChineseText", () => {
  beforeEach(async () => {
    localStorage.clear();
    clearSegmentCache();
    await acceptAIConsent();
  });

  afterEach(() => {
    localStorage.clear();
    clearSegmentCache();
    vi.restoreAllMocks();
  });

  it("returns segments from API and caches them", async () => {
    server.use(
      http.post("/api/chinese/segment", () => {
        return HttpResponse.json([[{ word: "你好", pinyin: "nǐ hǎo" }]]);
      }),
    );

    const result = await segmentChineseText(["你好"]);

    expect(result).toEqual([[{ word: "你好", pinyin: "nǐ hǎo" }]]);
  });

  it("serves cached results on subsequent calls without hitting API", async () => {
    let apiCalls = 0;
    server.use(
      http.post("/api/chinese/segment", () => {
        apiCalls += 1;
        return HttpResponse.json([[{ word: "你好", pinyin: "nǐ hǎo" }]]);
      }),
    );

    await segmentChineseText(["你好"]);
    const second = await segmentChineseText(["你好"]);

    expect(apiCalls).toBe(1);
    expect(second).toEqual([[{ word: "你好", pinyin: "nǐ hǎo" }]]);
  });

  it("preserves result order when mixing cached and uncached texts", async () => {
    server.use(
      http.post("/api/chinese/segment", async ({ request }) => {
        const texts = (await request.json()) as string[];
        return HttpResponse.json(
          texts.map((t) => [{ word: t, pinyin: `py-${t}` }]),
        );
      }),
    );

    // Cache "你好" first
    await segmentChineseText(["你好"]);
    // Now ask for [cached, uncached]
    const result = await segmentChineseText(["你好", "世界"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([{ word: "你好", pinyin: "py-你好" }]);
    expect(result[1]).toEqual([{ word: "世界", pinyin: "py-世界" }]);
  });

  it("falls back to single-word segment on API failure", async () => {
    server.use(
      http.post("/api/chinese/segment", () => {
        return HttpResponse.error();
      }),
    );

    const result = await segmentChineseText(["你好"]);

    expect(result).toEqual([[{ word: "你好", pinyin: "" }]]);
  });

  it("throws AIConsentRequiredError when consent declined", async () => {
    localStorage.clear(); // không có consent
    server.use(
      http.post("/api/chinese/segment", () => {
        return HttpResponse.json([]);
      }),
    );

    await expect(segmentChineseText(["你好"])).rejects.toThrow(/consent/i);
  });
});

describe("segmentSingleChineseText", () => {
  beforeEach(async () => {
    localStorage.clear();
    clearSegmentCache();
    await acceptAIConsent();
  });

  afterEach(() => {
    localStorage.clear();
    clearSegmentCache();
  });

  it("returns empty array for empty input", async () => {
    expect(await segmentSingleChineseText("")).toEqual([]);
  });

  it("returns cached result for repeated text", async () => {
    let apiCalls = 0;
    server.use(
      http.post("/api/chinese/segment", () => {
        apiCalls += 1;
        return HttpResponse.json([[{ word: "你好", pinyin: "nǐ hǎo" }]]);
      }),
    );

    await segmentSingleChineseText("你好");
    await segmentSingleChineseText("你好");

    expect(apiCalls).toBe(1);
  });
});

describe("segmentChineseTextWithRetry", () => {
  beforeEach(async () => {
    localStorage.clear();
    clearSegmentCache();
    await acceptAIConsent();
  });

  afterEach(() => {
    localStorage.clear();
    clearSegmentCache();
    vi.useRealTimers();
  });

  it("retries and returns fallback after all attempts fail", async () => {
    vi.useFakeTimers();
    server.use(
      http.post("/api/chinese/segment", () => {
        return HttpResponse.json([{ error: "boom" }], { status: 500 });
      }),
    );

    let result!: unknown[];
    const promise = segmentChineseTextWithRetry(["你好"], 2)
      .then((r) => (result = r))
      .catch((e) => (result = e));
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(result).toEqual([[{ word: "你好", pinyin: "" }]]);
  });

  it("returns fallback on network failure (inner function swallows errors, no re-attempt)", async () => {
    vi.useFakeTimers();
    let calls = 0;
    server.use(
      http.post("/api/chinese/segment", () => {
        calls += 1;
        return HttpResponse.json([{ error: "boom" }], { status: 500 });
      }),
    );

    // NOTE: segmentChineseText swallows network errors and returns a fallback instead
    // of throwing, nên vòng retry trong segmentChineseTextWithRetry không bao giờ chạy lại
    // cho lỗi mạng. Test này ghi lại hành vi hiện tại (chỉ 1 lần gọi API).
    let result: unknown[] = [];
    const promise = segmentChineseTextWithRetry(["你好"], 3)
      .then((r) => (result = r))
      .catch(() => {});
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(calls).toBe(1);
    expect(result).toEqual([[{ word: "你好", pinyin: "" }]]);
  });

  it("returns fallback after retries when inner function throws (consent denied)", async () => {
    vi.useFakeTimers();
    let apiCalls = 0;
    server.use(
      http.post("/api/chinese/segment", () => {
        apiCalls += 1;
        return HttpResponse.json([[{ word: "你好", pinyin: "nǐ hǎo" }]]);
      }),
    );

    // Không có consent → mỗi attempt đều ném AIConsentRequiredError trước khi gọi API
    localStorage.clear();
    let result: unknown = null;
    const promise = segmentChineseTextWithRetry(["你好"], 2)
      .then((r) => (result = r))
      .catch((e) => (result = e));
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    // Consent bị chặn → API không bao giờ được gọi, trả fallback
    expect(apiCalls).toBe(0);
    expect(result).toEqual([[{ word: "你好", pinyin: "" }]]);
  });
});
