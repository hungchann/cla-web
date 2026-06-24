import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { sendAIRequest } from "@/services/aiRequestService";
import { logger } from "@/services/logger";
import axios from "axios";

// Interface cho kết quả segment
export interface SegmentResult {
  word: string;
  pinyin: string;
}

// Interface cho request
export interface SegmentRequest {
  text: string[];
}

// Global Memory Cache for segmentation results
// Key is the Chinese string, value is the segment array
const segmentCache = new Map<string, SegmentResult[]>();

/**
 * Gọi API segment để phân đoạn văn bản tiếng Trung
 * @param chineseTexts - Mảng các văn bản tiếng Trung cần phân đoạn
 * @returns Promise<SegmentResult[][]> - Mảng các kết quả phân đoạn
 */
export async function segmentChineseText(chineseTexts: string[]): Promise<SegmentResult[][]> {
  const results: SegmentResult[][] = new Array(chineseTexts.length);
  const indexesToFetch: number[] = [];
  const textsToFetch: string[] = [];

  // Check cache first
  chineseTexts.forEach((text, index) => {
    const cached = segmentCache.get(text);
    if (cached) {
      results[index] = cached;
    } else {
      indexesToFetch.push(index);
      textsToFetch.push(text);
    }
  });

  // If everything is in cache, return immediately
  if (textsToFetch.length === 0) {
    return results;
  }

  try {
    const fetchedResults = await sendAIRequest(
      async () => {
        const response = await axios.post(
          "https://marutek.space/api/chinese/segment",
          textsToFetch,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 15000,
          },
        );
        return response.data as SegmentResult[][];
      },
      {
        kind: "text",
        declinedMessage:
          "Text segmentation requires your consent to send learning content to our AI service (OpenAI).",
      },
    );

    // Save to results array and cache for future use
    fetchedResults.forEach((segmentResult, i) => {
      const originalIndex = indexesToFetch[i];
      const originalText = textsToFetch[i];

      results[originalIndex] = segmentResult;
      segmentCache.set(originalText, segmentResult);
    });

    return results;
  } catch (error) {
    if (isAIConsentRequiredError(error)) {
      throw error;
    }

    logger.error("Error segmenting chinese text:", error);

    // Fallback for failed items: return empty or single word as fallback
    indexesToFetch.forEach((index) => {
      if (!results[index]) {
        results[index] = [{ word: chineseTexts[index], pinyin: "" }];
      }
    });

    return results;
  }
}

/**
 * Gọi API segment cho một văn bản đơn lẻ
 * @param chineseText - Văn bản tiếng Trung cần phân đoạn
 * @returns Promise<SegmentResult[]> - Kết quả phân đoạn
 */
export async function segmentSingleChineseText(chineseText: string): Promise<SegmentResult[]> {
  if (!chineseText) return [];

  // Quick cache check
  const cached = segmentCache.get(chineseText);
  if (cached) return cached;

  try {
    const result = await segmentChineseText([chineseText]);
    return result[0] || [];
  } catch (error) {
    logger.error("Error segmenting single chinese text:", error);
    return [{ word: chineseText, pinyin: "" }];
  }
}

/**
 * Gọi API segment với retry logic
 */
export async function segmentChineseTextWithRetry(
  chineseTexts: string[],
  maxRetries: number = 3,
): Promise<SegmentResult[][]> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await segmentChineseText(chineseTexts);
    } catch (error) {
      lastError = error;
      logger.warn(`Segment attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
  }

  logger.error(`All ${maxRetries} segment attempts failed. Last error:`, lastError);
  return chineseTexts.map((text) => [{ word: text, pinyin: "" }]);
}

/**
 * Clear the segmentation cache if needed (e.g. on memory warning)
 */
export function clearSegmentCache() {
  segmentCache.clear();
}
