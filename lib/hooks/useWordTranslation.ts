import { translateWord } from "@/api/apiService";
import { logger } from "@/services/logger";
import { useCallback, useRef, useState } from "react";

export function useWordTranslation() {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // Prevent stale async responses overwriting newer selections.
  const requestIdRef = useRef(0);

  const close = useCallback(() => {
    setModalVisible(false);
  }, []);

  const onWordPress = useCallback(async (word: string) => {
    setSelectedWord(word);
    setModalVisible(true);

    const requestId = ++requestIdRef.current;
    try {
      const wordData = await translateWord(word);
      if (requestIdRef.current !== requestId) return;
      setWordInfo(wordData?.[0] ?? null);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      logger.warn("Translate word failed", error);
      setWordInfo(null);
    }
  }, []);

  return {
    selectedWord,
    wordInfo,
    isModalVisible,
    setModalVisible,
    close,
    onWordPress,
  };
}
