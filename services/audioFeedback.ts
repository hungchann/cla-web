import { Audio } from "expo-av";
import { logger } from "@/services/logger";

// Audio assets - using require for Metro bundler
// NOTE: These files must exist in the repository (sound/ directory should NOT be in .gitignore)
// as require() is evaluated at module load time. Missing files will cause build/runtime errors.
let SOUNDS: {
  correct: any;
  incorrect: any;
  scoreUnder50: any;
  score50to70: any;
  score80to90: any;
  scoreOver90: any;
};

try {
  SOUNDS = {
    correct: require("@/sound/correct_TracNghiem.wav"),
    incorrect: require("@/sound/wrong_TracNghiem.wav"),
    scoreUnder50: require("@/sound/correct_up_50_.mp3"),
    score50to70: require("@/sound/correct_50-70_.mp3"),
    score80to90: require("@/sound/correct_80-90_.mp3"),
    scoreOver90: require("@/sound/correct_up_90_.mp3"),
  };
} catch (error) {
  logger.error(
    "Failed to load sound files. Ensure sound/ directory exists and is not ignored by git.",
    error,
  );
  // Provide fallback empty objects to prevent app crash
  // In production, this should never happen if sound/ is properly tracked in git
  SOUNDS = {
    correct: null,
    incorrect: null,
    scoreUnder50: null,
    score50to70: null,
    score80to90: null,
    scoreOver90: null,
  };
}

let soundObject: Audio.Sound | null = null;

/**
 * Configure audio mode for playback
 */
async function configureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    logger.error("Error configuring audio mode:", error);
  }
}

/**
 * Play a sound effect
 */
async function playSound(soundSource: any) {
  try {
    // Skip playback if sound source is null (files missing)
    if (!soundSource) {
      logger.warn("Sound file not available, skipping playback");
      return;
    }

    // Stop any currently playing sound
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }

    await configureAudioMode();

    const { sound } = await Audio.Sound.createAsync(soundSource, {
      shouldPlay: true,
      volume: 1.0,
    });

    soundObject = sound;

    // Clean up when sound finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        soundObject = null;
      }
    });
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
  // For video/exercise results, use correct_TracNghiem sound
  const sound = SOUNDS.correct;
  await playSound(sound);
}

/**
 * Play result sound based on score percentage for Translation and Speaking
 * Used for: Dịch trung-việt, việt-trung, AI luyện nói
 * Score ranges:
 * - < 50%: correct_up_50_
 * - 50-79%: correct_50-70_
 * - 80-89%: correct_80-90_
 * - >= 90%: correct_up_90_
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
  if (soundObject) {
    try {
      await soundObject.unloadAsync();
      soundObject = null;
    } catch (error) {
      logger.error("Error cleaning up audio:", error);
    }
  }
}
