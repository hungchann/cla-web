import { logger } from "@/services/logger";

export async function speakChinese(text: string): Promise<void> {
  if (globalThis.window === undefined || !globalThis.speechSynthesis) {
    logger.warn("Speech synthesis not supported on this platform");
    return;
  }

  // Cancel any ongoing speech first
  globalThis.speechSynthesis.cancel();

  return new Promise((resolve) => {
    const utterance = new globalThis.SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";

    // Set voice to a Chinese one if available
    const voices = globalThis.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes("zh") || v.lang.includes("ZH"));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error !== "interrupted") {
        logger.error("SpeechSynthesis error:", e);
      }
      resolve();
    };

    globalThis.speechSynthesis.speak(utterance);
  });
}

export async function stopSpeech(): Promise<void> {
  if (globalThis.window !== undefined && globalThis.speechSynthesis) {
    globalThis.speechSynthesis.cancel();
  }
}
