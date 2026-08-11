import { http, HttpResponse } from "msw";
import {
  AUTH_LOGIN_RESPONSE,
  REFRESH_TOKENS_RESPONSE,
  TEST_PROFILE,
  TEST_USER,
} from "@/tests/mocks/fixtures/users";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

export const handlers = [
  // ─── Auth ───────────────────────────────────────────────────────────────
  http.post(`${API}/auth/login`, () => {
    return HttpResponse.json(AUTH_LOGIN_RESPONSE);
  }),

  http.post(`${API}/auth/logout`, () => {
    return HttpResponse.json({ data: null });
  }),

  http.post(`${API}/auth/forgot-password`, () => {
    return HttpResponse.json({ data: null });
  }),

  http.get(`${API}/users/me`, () => {
    return HttpResponse.json({ data: TEST_USER });
  }),

  http.get(`${API}/items/user_profiles`, () => {
    return HttpResponse.json({ data: [TEST_PROFILE] });
  }),

  // ─── Flows ──────────────────────────────────────────────────────────────
  http.get(`${API}/flows/trigger/*`, () => {
    return HttpResponse.json({ exists: false });
  }),

  http.post(`${API}/flows/trigger/*`, () => {
    return HttpResponse.json({ data: {} });
  }),

  // ─── GraphQL ────────────────────────────────────────────────────────────
  http.post(`${API}/graphql`, () => {
    return HttpResponse.json({ data: { Sections: [] } });
  }),

  http.post(`${API}/graphql/system`, () => {
    return HttpResponse.json(REFRESH_TOKENS_RESPONSE);
  }),

  // ─── Speech transcription proxy ─────────────────────────────────────────
  http.post(`${API}/api/speech/transcribe`, () => {
    return HttpResponse.json({
      success: true,
      transcription: "你好，世界",
      confidence: 0.95,
      wordCount: 4,
      languageCode: "zh-CN",
      requestId: "req-test-001",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
  }),

  // ─── Chinese NLP proxy ──────────────────────────────────────────────────
  http.get(`${API}/api/chinese/*`, () => {
    return HttpResponse.json({ data: { result: "ok" } });
  }),

  http.post(`${API}/api/chinese/*`, () => {
    return HttpResponse.json({ data: { result: "ok" } });
  }),
];
