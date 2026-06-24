/**
 * 🔊 Audio Feedback Service
 *
 * - Play sound effects (correct/incorrect answer, translation score) on web
 * - Browser standard HTMLAudioElement (window.Audio)
 */

import { logger } from "@/services/logger";

const SOUNDS = {
  correct: "/sound/correct_TracNghiem.wav",
  incorrect: "/sound/wrong_TracNghiem.wav",
  scoreUnder50: "/sound/correct_up_50_.mp3",
  score50to70: "/sound/correct_50-70_.mp3",
  score80to90: "/sound/correct_80-90_.mp3",
  scoreOver90: "/sound/correct_up_90_.mp3",
};

let currentAudio: HTMLAudioElement | null = null;

/**
 * Play a sound effect
 */
async function playSound(soundPath: string) {
  if (globalThis.window === undefined) {
    return;
  }

  try {
    // Stop any currently playing sound
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new globalThis.window.Audio(soundPath);
    currentAudio = audio;

    // Start playing
    await audio.play();
  } catch (error) {
    logger.error("Error playing sound:", error);
  }
}

/**
 * Play feedback sound for correct/incorrect answer
 * Used for: Video, Bilingual exercise (choose answer), Bài tập
 */
export async function playAnswerFeedback(isCorrect: boolean) {
  const sound = isCorrect ? SOUNDS.correct : SOUNDS.incorrect;
  await playSound(sound);
}

/**
 * Play result sound based on score percentage for Video/Exercise results
 * Used for: Video exercise results, Bilingual exercise results, Bài tập results
 */
export async function playQuizResultSound(score: number) {
  const sound = SOUNDS.correct;
  await playSound(sound);
}

/**
 * Play result sound based on score percentage for Translation and Speaking
 * Used for: Dịch trung-việt, việt-trung, AI luyện nói
 */
export async function playTranslationResultSound(score: number) {
  let sound;

  if (score < 50) {
    sound = SOUNDS.scoreUnder50;
  } else if (score >= 50 && score < 80) {
    sound = SOUNDS.score50to70;
  } else if (score >= 80 && score < 90) {
    sound = SOUNDS.score80to90;
  } else {
    sound = SOUNDS.scoreOver90;
  }

  await playSound(sound);
}

/**
 * Cleanup function to unload sounds
 */
export async function cleanupAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio = null;
    } catch (error) {
      logger.error("Error cleaning up audio:", error);
    }
  }
}
