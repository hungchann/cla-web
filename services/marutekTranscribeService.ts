/**
 * Marutek Speech-to-Text Service
 *
 * - HTTP API integration với Marutek Speech API
 * - Audio file upload và transcription
 * - MIME type detection từ file extension
 * - Error handling và fallback
 * - Support cho multiple audio formats
 * - Integration với audioRecordingService
 * - Chinese language transcription
 * - Text comparison functionality
 *
 */

import {
  MARUTEK_CONFIG,
  marutekTranscribeBase64Url,
} from "@/lib/constants";
import { sendAIRequest } from "@/services/aiRequestService";
import { logger } from "@/services/logger";

export type TranscribeResponse = {
  success: boolean;
  transcription: string;
  confidence: number;
  wordCount: number;
  languageCode: string;
  requestId: string;
  timestamp: string;
};

export type ComparisonResult = {
  correctWords: string[];
  incorrectWords: string[];
  accuracy: number;
  details: {
    word: string;
    isCorrect: boolean;
    userInput: string;
    expectedText: string;
  }[];
};

type TranscriptionMethod = "multipart" | "base64";

interface TranscriptionErrorDetails {
  method: TranscriptionMethod;
  endpoint: string;
  status?: number;
  duration?: number;
  attempt?: number;
  response?: TranscribeResponse;
}

export class EmptyTranscriptionError extends Error {
  readonly details: TranscriptionErrorDetails;

  constructor(details: TranscriptionErrorDetails) {
    super(
      `Empty transcription result (method: ${details.method}` +
        (typeof details.attempt === "number" ? `, attempt: ${details.attempt}` : "") +
        ")",
    );
    this.name = "EmptyTranscriptionError";
    this.details = details;
  }
}

export class TranscriptionAggregateError extends Error {
  readonly errors: Error[];

  constructor(message: string, errors: Error[]) {
    super(message);
    this.name = "TranscriptionAggregateError";
    this.errors = errors;
  }
}

function isEmptyTranscription(text: string | undefined | null): boolean {
  return !text || text.trim().length === 0;
}

function buildEmptyResultError(
  method: TranscriptionMethod,
  endpoint: string,
  metadata: { status?: number; duration?: number; attempt?: number; response: TranscribeResponse },
): EmptyTranscriptionError {
  return new EmptyTranscriptionError({
    method,
    endpoint,
    status: metadata.status,
    duration: metadata.duration,
    attempt: metadata.attempt,
    response: metadata.response,
  });
}

/**
 * Determine a reasonable MIME type from a local file URI by extension.
 */
function guessMimeTypeFromUri(uri: string): string {
  const lower = uri.split("?")[0].toLowerCase();
  // Many servers expect 'audio/mp4' for .m4a
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".3gp") || lower.endsWith(".3gpp")) return "audio/3gpp";
  if (lower.endsWith(".pcm")) return "audio/L16;rate=16000";
  return "application/octet-stream";
}

/**
 * Build Marutek multipart transcribe URL (POST multipart/form-data, field `audio`).
 */
function buildTranscribeEndpoint(customEndpoint?: string): string {
  if (customEndpoint) return customEndpoint;
  return MARUTEK_CONFIG.API_URL;
}

function isPayloadTooLargeError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /\b413\b|payload too large|entity too large|request entity too large/i.test(msg);
}

/**
 * Test if Marutek server is available
 */
export async function testMarutekServer(endpoint?: string): Promise<boolean> {
  try {
    const testEndpoint = buildTranscribeEndpoint(endpoint);
    logger.debug("🌐 [MARUTEK] Testing server availability:", testEndpoint);

    const res = await fetch(testEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    logger.debug("🌐 [MARUTEK] Server test result:", {
      status: res.status,
      ok: res.ok,
      statusText: res.statusText,
    });

    // Server is available if it responds (even with error, it means server is up)
    return res.status !== 404;
  } catch (error) {
    logger.error("🌐 [MARUTEK] Server test failed:", error);
    return false;
  }
}

/**
 * Upload a local file (by URI) using multipart/form-data.
 */
export async function transcribeAudioFromUri(
  uri: string,
  options?: { language?: string; endpoint?: string; filename?: string; contentType?: string },
): Promise<TranscribeResponse> {
  const language = options?.language ?? "zh-CN";
  const endpoint = buildTranscribeEndpoint(options?.endpoint);
  const name = options?.filename ?? "audio.m4a";
  const type = options?.contentType ?? guessMimeTypeFromUri(uri);

  logger.debug("🌐 [MARUTEK] Starting transcription request...");
  logger.debug("  - URI:", uri);
  logger.debug("  - Endpoint:", endpoint);
  logger.debug("  - Language:", language);
  logger.debug("  - Filename:", name);
  logger.debug("  - Content Type:", type);

  let blob: Blob;
  try {
    const response = await fetch(uri);
    blob = await response.blob();
    logger.debug("🌐 [MARUTEK] File size:", blob.size, "bytes");

    if (blob.size === 0) {
      throw new Error("Audio file is empty");
    }

    if (blob.size < 1000) {
      logger.warn("🌐 [MARUTEK] Warning: Audio file is very small - might be too short");
    }
  } catch (fileError) {
    logger.error("🌐 [MARUTEK] File check failed:", fileError);
    throw new Error(
      `Audio file validation failed: ${fileError instanceof Error ? fileError.message : "Unknown error"}`,
    );
  }

  const form = new FormData();
  form.append("audio", blob, name);
  form.append("language", language);

  logger.debug("🌐 [MARUTEK] Sending request to:", endpoint);

  const startTime = Date.now();
  const res = await fetch(endpoint, {
    method: "POST",
    body: form,
    headers: { Accept: "application/json" },
  });
  const duration = Date.now() - startTime;

  logger.debug("🌐 [MARUTEK] Response received:");
  logger.debug("  - Status:", res.status);
  logger.debug("  - OK:", res.ok);
  logger.debug("  - Duration:", duration, "ms");
  logger.debug("  - Headers:", Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error("🌐 [MARUTEK] Request failed:", res.status, text);
    throw new Error(`Transcribe failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as TranscribeResponse;

  logger.debug("🌐 [MARUTEK] Transcription successful:");
  logger.debug("  - Success:", json.success);
  logger.debug("  - Transcription:", json.transcription);
  logger.debug("  - Confidence:", json.confidence);
  logger.debug("  - Word Count:", json.wordCount);
  logger.debug("  - Language Code:", json.languageCode);
  logger.debug("  - Request ID:", json.requestId);
  logger.debug("  - Timestamp:", json.timestamp);
  logger.debug("  - Full response:", JSON.stringify(json, null, 2));

  // Check for empty results and provide diagnostic info
  if (!json.success || isEmptyTranscription(json.transcription)) {
    logger.warn("🌐 [MARUTEK] WARNING: Empty transcription result received");
    logger.warn("  - This is now treated as an error to trigger fallback attempts");
    logger.warn("  - Inspect EmptyTranscriptionError.details for diagnostics");
    throw buildEmptyResultError("multipart", endpoint, {
      status: res.status,
      duration,
      response: json,
    });
  }

  return json;
}

/**
 * POST /transcribe/base64 — chỉ dùng khi multipart không khả dụng.
 * Body đúng contract server: `{ "audioBase64": "..." }` (base64 phình ~33% so với file gốc → dễ vượt limit).
 */
export async function transcribeAudioAsBase64(
  uri: string,
  options?: { endpoint?: string },
): Promise<TranscribeResponse> {
  const multipartRef = buildTranscribeEndpoint(options?.endpoint);
  const endpoint = marutekTranscribeBase64Url(multipartRef);

  logger.debug("🌐 [MARUTEK] Starting base64 transcription...");
  logger.debug("  - URI:", uri);
  logger.debug("  - Endpoint (base64):", endpoint);

  let blob: Blob;
  try {
    const response = await fetch(uri);
    blob = await response.blob();
  } catch (error) {
    logger.error("🌐 [MARUTEK] Failed to fetch blob for base64:", error);
    throw new Error("Failed to read audio data");
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error("Failed to read file as base64"));
    reader.readAsDataURL(blob);
  });

  logger.debug("  - Base64 length:", base64.length);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audioBase64: base64 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error("🌐 [MARUTEK] Base64 request failed:", res.status, text);
    throw new Error(`Transcribe failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as TranscribeResponse;
  logger.debug("🌐 [MARUTEK] Base64 transcription result:", json);

  if (!json.success || isEmptyTranscription(json.transcription)) {
    logger.warn("🌐 [MARUTEK] WARNING: Empty base64 transcription result received");
    throw buildEmptyResultError("base64", endpoint, {
      status: res.status,
      response: json,
    });
  }

  return json;
}

async function transcribeAudioWithFallbackInternal(
  uri: string,
  options?: { language?: string; endpoint?: string; filename?: string; contentType?: string },
): Promise<TranscribeResponse> {
  logger.debug("🌐 [MARUTEK] Starting transcription with fallback...");

  // Retry multipart only (khuyến nghị). Base64 chỉ thử một lần sau khi multipart thất bại hoàn toàn.
  const maxRetries = 2;
  const errors: Error[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.debug(`🌐 [MARUTEK] Multipart attempt ${attempt}/${maxRetries}`);

    try {
      logger.debug("🌐 [MARUTEK] Attempting multipart form-data (field: audio)...");
      const result = await transcribeAudioFromUri(uri, options);
      logger.debug("🌐 [MARUTEK] Multipart transcription successful");
      return result;
    } catch (multipartError) {
      logger.warn(`🌐 [MARUTEK] Multipart failed (attempt ${attempt}):`, multipartError);
      const err =
        multipartError instanceof Error ? multipartError : new Error(String(multipartError));
      errors.push(err);

      if (isPayloadTooLargeError(multipartError)) {
        throw new TranscriptionAggregateError(
          "Request quá lớn (multipart). Không dùng Base64 fallback vì payload còn nặng hơn; cần tăng BODY_LIMIT phía server (vd. docker-compose) hoặc ghi âm ngắn hơn.",
          errors,
        );
      }

      if (attempt < maxRetries) {
        logger.debug("🌐 [MARUTEK] Retrying multipart in 1 second...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  try {
    logger.debug("🌐 [MARUTEK] Multipart exhausted; attempting base64 once (POST .../transcribe/base64)...");
    const result = await transcribeAudioAsBase64(uri, { endpoint: options?.endpoint });
    logger.debug("🌐 [MARUTEK] Base64 transcription successful");
    return result;
  } catch (base64Error) {
    const err = base64Error instanceof Error ? base64Error : new Error(String(base64Error));
    errors.push(err);
    logger.warn("🌐 [MARUTEK] Base64 transcription failed:", base64Error);
  }

  const onlyEmptyResults =
    errors.length > 0 && errors.every((e) => e instanceof EmptyTranscriptionError);

  if (onlyEmptyResults) {
    logger.warn(
      "🌐 [MARUTEK] Mọi lần gửi đều trả về transcription rỗng — có thể file không có lời hoặc server không nhận được âm thanh hữu ích.",
    );
  } else {
    logger.error(
      "🌐 [MARUTEK] All transcription methods failed after",
      maxRetries,
      "multipart attempt(s) + base64",
    );
    logger.error("🌐 [MARUTEK] This could be due to:");
    logger.error("  - Server is down or unreachable");
    logger.error("  - Audio file is corrupted or empty");
    logger.error("  - Network connectivity issues");
    logger.error("  - Marutek API authentication problems");
    logger.error("  - Server rate limiting or temporary issues");
    errors.forEach((error, index) => {
      logger.error(`🌐 [MARUTEK] Attempt ${index + 1} error:`, error);
    });
  }

  throw new TranscriptionAggregateError("All transcription attempts failed", errors);
}

/**
 * Try multiple transcription methods with fallback (requires AI consent).
 */
export async function transcribeAudioWithFallback(
  uri: string,
  options?: { language?: string; endpoint?: string; filename?: string; contentType?: string },
): Promise<TranscribeResponse> {
  return sendAIRequest(() => transcribeAudioWithFallbackInternal(uri, options), {
    kind: "voice",
    declinedMessage:
      "Voice analysis requires your consent to send recordings to our AI learning service (OpenAI).",
  });
}

/**
 * Compare transcribed text with expected text
 */
export function compareTexts(transcribedText: string, expectedText: string): ComparisonResult {
  logger.debug("🔍 [MARUTEK] Comparing texts:");
  logger.debug("  - Transcribed:", transcribedText);
  logger.debug("  - Expected:", expectedText);

  // Normalize texts for comparison
  const normalizeText = (text: string) => {
    return text;
    // .toLowerCase()
    // .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    // .trim();
  };

  const normalizedTranscribed = normalizeText(transcribedText);
  const normalizedExpected = normalizeText(expectedText);

  logger.debug("🔍 [MARUTEK] Normalized texts:");
  logger.debug("  - Transcribed:", normalizedTranscribed);
  logger.debug("  - Expected:", normalizedExpected);

  // Split into words/characters for detailed comparison
  const transcribedWords = normalizedTranscribed.split(/\s+/).filter((word) => word.length > 0);
  const expectedWords = normalizedExpected.split(/\s+/).filter((word) => word.length > 0);

  logger.debug("🔍 [MARUTEK] Word arrays:");
  logger.debug("  - Transcribed words:", transcribedWords);
  logger.debug("  - Expected words:", expectedWords);

  const correctWords: string[] = [];
  const incorrectWords: string[] = [];
  const details: ComparisonResult["details"] = [];

  // Compare word by word
  const maxLength = Math.max(transcribedWords.length, expectedWords.length);

  for (let i = 0; i < maxLength; i++) {
    const transcribedWord = transcribedWords[i] || "";
    const expectedWord = expectedWords[i] || "";
    const isCorrect = transcribedWord === expectedWord;

    if (isCorrect && transcribedWord) {
      correctWords.push(transcribedWord);
    } else if (transcribedWord && expectedWord) {
      incorrectWords.push(transcribedWord);
    }

    details.push({
      word: expectedWord || transcribedWord,
      isCorrect,
      userInput: transcribedWord,
      expectedText: expectedWord,
    });
  }

  // Calculate accuracy
  const totalWords = Math.max(transcribedWords.length, expectedWords.length);
  const accuracy = totalWords > 0 ? (correctWords.length / totalWords) * 100 : 0;

  const result: ComparisonResult = {
    correctWords,
    incorrectWords,
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
    details,
  };

  logger.debug("🔍 [MARUTEK] Comparison result:");
  logger.debug("  - Correct words:", result.correctWords);
  logger.debug("  - Incorrect words:", result.incorrectWords);
  logger.debug("  - Accuracy:", result.accuracy + "%");
  logger.debug("  - Total details:", result.details.length);

  return result;
}
