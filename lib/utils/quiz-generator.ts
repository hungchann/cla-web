// Pure helpers to auto-generate quiz questions from client-side vocab data.
// Single question model: LISTEN to the word (TTS) → pick the correct 汉字
// among 4 Chinese-character options. No pinyin/meaning prompts.

export type QuizVocab = {
  word: string;
  pinyin?: string;
  meaning?: string;
};

export type QuizOption = {
  key: string; // "A" | "B" | "C" | "D"
  label: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  prompt: string;
  options: QuizOption[];
  hasAnswer: boolean; // false = card too thin to form a valid question
};

export const QUIZ_PROMPT = "Bạn nghe được chữ nào?";

const FALLBACK_CHARS = ["是", "好", "不", "这", "我", "你", "爱", "谁"];
const OPTION_KEYS = ["A", "B", "C", "D"] as const;

/** Pick 4 option labels (1 correct + 3 distractors), or [] when impossible */
function buildOptionLabels(current: QuizVocab, pool: QuizVocab[]): string[] {
  const correct = current.word.trim();
  if (!correct) return [];

  const picked: string[] = [correct];
  for (const label of pool
    .map((v) => (v.word || "").trim())
    .filter((label) => label && label !== correct && !picked.includes(label))) {
    if (picked.length >= 4) break;
    picked.push(label);
  }
  for (const label of FALLBACK_CHARS) {
    if (picked.length >= 4) break;
    if (!picked.includes(label)) picked.push(label);
  }
  return picked.length >= 4 ? picked : [];
}

/**
 * Build one "listen and pick the 汉字" question. Deterministic for a given
 * (word, pool) pair so React re-renders don't shuffle options around.
 */
export function buildQuizQuestion(
  current: QuizVocab,
  pool: QuizVocab[]
): QuizQuestion {
  const labels = buildOptionLabels(current, pool);
  if (labels.length < 4) {
    return { prompt: QUIZ_PROMPT, options: [], hasAnswer: false };
  }

  const correct = current.word.trim();
  const shuffled = seededShuffle(labels, `${correct}-options`);
  const options: QuizOption[] = shuffled.map((label, idx) => ({
    key: OPTION_KEYS[idx],
    label,
    isCorrect: label === correct,
  }));

  return {
    prompt: QUIZ_PROMPT,
    options,
    hasAnswer: true,
  };
}

/** Deterministic seeded shuffle (same algorithm as the flashcard page used) */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let h = 0;
  for (const ch of seed) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
