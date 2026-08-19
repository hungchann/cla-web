import { logger } from "@/services/logger";
/**
 * Text Comparison Service
 *
 * - Advanced text comparison algorithm
 * - Character-level accuracy calculation
 * - Word-by-word highlighting system
 * - Correct/Missing/Extra word detection
 * - Chinese text segmentation support
 * - Visual feedback cho user input
 * - Integration với Shadowing features
 * - Real-time comparison results
 * - Integration với Marutek transcription service
 *
 */

export interface ComparisonResult {
  accuracy: number;
  correctWords: string[];
  incorrectWords: string[];
  missingWords: string[];
  extraWords: string[];
  substitutions?: string[]; // New: track character substitutions
  highlightedText: {
    word: string;
    isCorrect: boolean;
    isMissing: boolean;
    isExtra: boolean;
    isSubstitution?: boolean; // New: track if this is a substitution
  }[];
  wordDetails?: {
    word: string;
    expected: string;
    isCorrect: boolean;
    isMissing: boolean;
    isExtra: boolean;
    isSubstitution?: boolean; // New: track if this is a substitution
  }[];
}

/**
 * Compare user speech with target text and calculate accuracy
 */
export function compareTexts(targetText: string, userText: string): ComparisonResult {
  // Normalize texts - remove punctuation, convert to lowercase
  const normalize = (text: string) =>
    text
      .replace(/[，。！？、；：""''（）【】]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

  const normalizedTarget = normalize(targetText);
  const normalizedUser = normalize(userText);

  // Split into words (Chinese characters)
  const targetWords = normalizedTarget.split("").filter((char) => char.trim());
  const userWords = normalizedUser.split("").filter((char) => char.trim());

  const correctWords: string[] = [];
  const incorrectWords: string[] = [];
  const missingWords: string[] = [];
  const extraWords: string[] = [];
  const highlightedText: {
    word: string;
    isCorrect: boolean;
    isMissing: boolean;
    isExtra: boolean;
  }[] = [];

  // Create a map for faster lookup
  const userWordMap = new Map<string, number>();
  userWords.forEach((word) => {
    userWordMap.set(word, (userWordMap.get(word) || 0) + 1);
  });

  // Check target words against user words
  targetWords.forEach((word, index) => {
    if (userWordMap.has(word) && userWordMap.get(word)! > 0) {
      // Correct word
      correctWords.push(word);
      highlightedText.push({
        word,
        isCorrect: true,
        isMissing: false,
        isExtra: false,
      });
      userWordMap.set(word, userWordMap.get(word)! - 1);
    } else {
      // Missing word
      missingWords.push(word);
      highlightedText.push({
        word,
        isCorrect: false,
        isMissing: true,
        isExtra: false,
      });
    }
  });

  // Find extra words (words user said that weren't in target)
  userWordMap.forEach((count, word) => {
    for (let i = 0; i < count; i++) {
      extraWords.push(word);
      highlightedText.push({
        word,
        isCorrect: false,
        isMissing: false,
        isExtra: true,
      });
    }
  });

  // Calculate accuracy
  const totalTargetWords = targetWords.length;
  const correctCount = correctWords.length;
  const accuracy = totalTargetWords > 0 ? (correctCount / totalTargetWords) * 100 : 0;

  return {
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
    correctWords,
    incorrectWords,
    missingWords,
    extraWords,
    highlightedText,
  };
}

/**
 * Advanced comparison with fuzzy matching for similar characters
 */
export function compareTextsAdvanced(targetText: string, userText: string): ComparisonResult {
  const normalize = (text: string) =>
    text
      .replace(/[，。！？、；：""''（）【】]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

  const normalizedTarget = normalize(targetText);
  const normalizedUser = normalize(userText);

  const targetWords = normalizedTarget.split("").filter((char) => char.trim());
  const userWords = normalizedUser.split("").filter((char) => char.trim());

  const correctWords: string[] = [];
  const incorrectWords: string[] = [];
  const missingWords: string[] = [];
  const extraWords: string[] = [];
  const highlightedText: {
    word: string;
    isCorrect: boolean;
    isMissing: boolean;
    isExtra: boolean;
  }[] = [];

  // Use dynamic programming for better matching
  const dp: number[][] = Array(targetWords.length + 1)
    .fill(null)
    .map(() => Array(userWords.length + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= targetWords.length; i++) {
    for (let j = 1; j <= userWords.length; j++) {
      if (targetWords[i - 1] === userWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matches
  let i = targetWords.length;
  let j = userWords.length;
  const matchedPairs: { target: number; user: number }[] = [];

  while (i > 0 && j > 0) {
    if (targetWords[i - 1] === userWords[j - 1]) {
      matchedPairs.push({ target: i - 1, user: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // Mark matched words
  const matchedTarget = new Set(matchedPairs.map((p) => p.target));
  const matchedUser = new Set(matchedPairs.map((p) => p.user));

  // Process target words
  targetWords.forEach((word, index) => {
    if (matchedTarget.has(index)) {
      correctWords.push(word);
      highlightedText.push({
        word,
        isCorrect: true,
        isMissing: false,
        isExtra: false,
      });
    } else {
      missingWords.push(word);
      highlightedText.push({
        word,
        isCorrect: false,
        isMissing: true,
        isExtra: false,
      });
    }
  });

  // Process user words - improved logic for substitution vs extra words
  userWords.forEach((word, index) => {
    if (!matchedUser.has(index)) {
      // Check if this is a substitution (same position, different character)
      const targetWord = targetWords[index];
      if (targetWord && targetWord !== word) {
        // This is a substitution, not an extra word
        incorrectWords.push(word);
        highlightedText.push({
          word,
          isCorrect: false,
          isMissing: false,
          isExtra: false,
        });
      } else {
        // This is truly an extra word
        extraWords.push(word);
        highlightedText.push({
          word,
          isCorrect: false,
          isMissing: false,
          isExtra: true,
        });
      }
    }
  });

  // Calculate accuracy - improved to handle substitutions properly
  const totalTargetWords = targetWords.length;
  const correctCount = correctWords.length;
  const substitutionCount = incorrectWords.length;

  // For substitutions, we count them as partial credit (0.5) instead of full error
  const adjustedCorrectCount = correctCount + substitutionCount * 0.5;
  const accuracy = totalTargetWords > 0 ? (adjustedCorrectCount / totalTargetWords) * 100 : 0;

  // Create wordDetails for UI display
  const wordDetails: {
    word: string;
    expected: string;
    isCorrect: boolean;
    isMissing: boolean;
    isExtra: boolean;
    isSubstitution?: boolean; // New: track if this is a substitution
  }[] = [];

  // Map user index → target index cho các cặp LCS match (index có thể bị lệch).
  const userToTargetMatch = new Map<number, number>();
  matchedPairs.forEach((p) => userToTargetMatch.set(p.user, p.target));

  // Combine target and user words with their match status - improved logic
  const maxLength = Math.max(targetWords.length, userWords.length);
  for (let i = 0; i < maxLength; i++) {
    const targetWord = targetWords[i] || "";
    const userWord = userWords[i] || "";
    const matchedTargetIndex = userToTargetMatch.get(i);
    const isMatched = matchedTargetIndex !== undefined && userWord !== "";

    if (targetWord && userWord) {
      const expected = matchedTargetIndex !== undefined ? targetWords[matchedTargetIndex] : targetWord;
      const isSubstitution = !isMatched && targetWord !== userWord;
      wordDetails.push({
        word: userWord,
        expected,
        isCorrect: isMatched,
        isMissing: false,
        isExtra: false,
        isSubstitution: isSubstitution || false,
      });
    } else if (targetWord && !userWord) {
      wordDetails.push({
        word: "",
        expected: targetWord,
        isCorrect: false,
        isMissing: true,
        isExtra: false,
      });
    } else if (!targetWord && userWord) {
      wordDetails.push({
        word: userWord,
        expected: "",
        isCorrect: false,
        isMissing: false,
        isExtra: true,
      });
    }
  }

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    correctWords,
    incorrectWords,
    missingWords,
    extraWords,
    substitutions: incorrectWords, // Track substitutions separately
    highlightedText,
    wordDetails,
  };
}

/**
 * Compare Marutek transcription result with target text
 */
export function compareMarutekResult(
  targetText: string,
  marutekResult: { transcription: string; confidence: number },
): ComparisonResult & { confidence: number } {
  logger.debug(" [TEXT_COMPARISON] Comparing Marutek result:");
  logger.debug("  - Target text:", targetText);
  logger.debug("  - Transcription:", marutekResult.transcription);
  logger.debug("  - Confidence:", marutekResult.confidence);

  const comparison = compareTextsAdvanced(targetText, marutekResult.transcription);

  logger.debug(" [TEXT_COMPARISON] Comparison result:");
  logger.debug("  - Accuracy:", comparison.accuracy + "%");
  logger.debug("  - Correct words:", comparison.correctWords.length);
  logger.debug("  - Missing words:", comparison.missingWords.length);
  logger.debug("  - Extra words:", comparison.extraWords.length);

  return {
    ...comparison,
    confidence: marutekResult.confidence,
  };
}
