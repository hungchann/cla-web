import { notebookApi } from "@/api/notebook";
import { safeNavigation } from "@/lib/utils/safeNavigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { logger } from "@/services/logger";

export type VocabCardItem = {
  vocab_items_id?: {
    id?: string | number;
    name?: string;
    pinyin?: string;
    note?: string;
    senses?: VocabSense[];
  };
};

export type VocabSense = {
  id: string | number;
  meaning_vi: string;
  pos_label: string;
  examples: {
    chinese: string;
    pinyin: string;
    vietnamese?: string;
    p_vi?: string;
  }[];
};

export type VocabDetail = {
  word: string;
  pinyin: string;
  meaning: string;
  note: string;
  groupedSenses: {
    [posLabel: string]: VocabSense[];
  };
};

export type FlashcardSource = "suggest" | "personal" | "system";
export type RawParam = string | string[] | undefined;

export interface UseVocabFlashcardDataProps {
  type: RawParam;
  notebookId: RawParam;
  topicId: RawParam;
  restart: RawParam;
  fakeData: RawParam;
}

interface FakeVocabItem {
  id: string | number;
  word: string;
  pinyin: string;
  note?: string;
}

interface UserFlashcardProgress {
  dictionary_vocab_id?: string;
  flashcard_item_id?: string;
  status?: string;
}

export type FlashcardStatus = "mastered" | "uncertain" | "learning" | "favorite";

export function useVocabFlashcardData({
  type,
  notebookId,
  topicId,
  restart,
  fakeData,
}: UseVocabFlashcardDataProps) {
  // --- State Management ---
  const [dataVocal, setDataVocal] = useState<VocabCardItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [vocabDetailCache, setVocabDetailCache] = useState<Record<string, VocabDetail>>({});
  const fetchingVocabIds = useRef<Set<string>>(new Set());

  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});
  const [previousStatus, setPreviousStatus] = useState<Record<string, string>>({});

  // --- Normalization ---
  const normalized = useMemo(() => {
    const getFirst = (p: RawParam) => (Array.isArray(p) ? p[0] : p) ?? "";
    return {
      type: getFirst(type) as FlashcardSource | "",
      notebookId: getFirst(notebookId),
      topicId: getFirst(topicId),
      restart: getFirst(restart),
      fakeData: getFirst(fakeData),
    };
  }, [fakeData, notebookId, restart, topicId, type]);

  const populateCacheFromItems = useCallback((items: VocabCardItem[]) => {
    const newCache: Record<string, VocabDetail> = {};
    items.forEach((item: any) => {
      const vocab = item.vocab_items_id;
      if (vocab?.id && vocab.senses) {
        const groupedSenses = vocab.senses.reduce(
          (acc: Record<string, VocabSense[]>, sense: VocabSense) => {
            const posLabel = sense.pos_label || "Khác";
            if (!acc[posLabel]) acc[posLabel] = [];
            acc[posLabel].push(sense);
            return acc;
          },
          {},
        );

        newCache[String(vocab.id)] = {
          word: vocab.name || "",
          pinyin: vocab.pinyin || "",
          meaning: vocab.senses[0]?.meaning_vi || "Nghĩa không có sẵn",
          note: vocab.note || "",
          groupedSenses,
        };
      }
    });
    if (Object.keys(newCache).length > 0) {
      setVocabDetailCache((prev) => ({ ...prev, ...newCache }));
    }
  }, []);

  // --- Initial Data Loading ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingList(true);
      try {
        const {
          type: sourType,
          notebookId: deckId,
          topicId: subTopicId,
          fakeData: rawJson,
        } = normalized;

        if (sourType === "suggest") {
          const parsed: FakeVocabItem[] = rawJson ? JSON.parse(decodeURIComponent(rawJson)) : [];
          setDataVocal(
            parsed.map((item) => ({
              vocab_items_id: {
                id: item.id,
                name: item.word,
                pinyin: item.pinyin,
                note: item.note || "",
              },
            })),
          );
        } else if (sourType === "personal") {
          if (deckId) {
            const response = await notebookApi.getListVocabByIdFlashcardDeck(deckId);
            setDataVocal(Array.isArray(response) ? response : []);
          } else {
            setDataVocal([]);
          }
        } else if (sourType === "system") {
          if (subTopicId && deckId) {
            const response = await notebookApi.getListVocabByTopicIdAndLevelIdNotebook(
              subTopicId,
              deckId,
            );
            const items = Array.isArray(response) ? response : [];
            setDataVocal(items);
            populateCacheFromItems(items);
          } else {
            setDataVocal([]);
          }
        } else {
          setDataVocal([]);
        }
      } catch (error) {
        logger.error("Error fetching flashcard data:", error);
        setDataVocal([]);
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchData();
  }, [normalized, populateCacheFromItems]);

  // --- Favorite/Progress Loading ---
  useEffect(() => {
    const loadProgress = async () => {
      if (dataVocal.length === 0) return;
      try {
        const progressVocab: UserFlashcardProgress[] = await notebookApi.getProgressVocab();
        const statusMap: Record<string, boolean> = {};
        const prevStatusMap: Record<string, string> = {};

        progressVocab.forEach((item) => {
          const id = item.dictionary_vocab_id || item.flashcard_item_id;
          if (id) {
            if (item.status === "favorite") {
              statusMap[id] = true;
            } else if (item.status) {
              prevStatusMap[id] = item.status;
            }
          }
        });

        setFavoriteStatus(statusMap);
        setPreviousStatus(prevStatusMap);
      } catch (error) {
        logger.error("Error loading progress:", error);
      }
    };
    loadProgress();
  }, [dataVocal]);

  // --- Detail Fetching logic ---
  const getOrFetchVocabDetail = useCallback(
    async (
      vocabId: string,
      fallback: VocabDetail,
      skipLoadingState = false,
    ): Promise<VocabDetail | null> => {
      if (!vocabId) return null;
      if (vocabDetailCache[vocabId]) return vocabDetailCache[vocabId];
      if (fetchingVocabIds.current.has(vocabId)) return null;

      fetchingVocabIds.current.add(vocabId);
      if (!skipLoadingState) setIsLoadingDetail(true);
      try {
        const response = await notebookApi.getDetailVocabularyNotebook(vocabId);
        const vocabData = Array.isArray(response) ? response[0] : response;

        if (vocabData?.word) {
          const groupedSenses =
            vocabData.senses?.reduce((acc: Record<string, VocabSense[]>, sense: VocabSense) => {
              const posLabel = sense.pos_label || "Khác";
              if (!acc[posLabel]) acc[posLabel] = [];
              acc[posLabel].push(sense);
              return acc;
            }, {}) || {};

          const detail: VocabDetail = {
            word: vocabData.word,
            pinyin: vocabData.pinyin,
            meaning: vocabData.senses?.[0]?.meaning_vi || "Nghĩa không có sẵn",
            note: fallback?.note || "",
            groupedSenses,
          };

          setVocabDetailCache((prev) => ({ ...prev, [vocabId]: detail }));
          return detail;
        }
        return fallback;
      } catch (error) {
        logger.error("Error fetching vocab detail:", error);
        return fallback;
      }
    },
    [vocabDetailCache, fetchingVocabIds],
  );

  // Pre-fetch/Sync detail fetch trigger
  useEffect(() => {
    if (dataVocal.length === 0 || currentIndex >= dataVocal.length) return;
    const item = dataVocal[currentIndex];
    const vocabId = item.vocab_items_id?.id ? String(item.vocab_items_id.id) : "";
    if (!vocabId) return;

    if (vocabDetailCache[vocabId]) {
      setIsLoadingDetail(false);
      return;
    }

    const fallback: VocabDetail = {
      word: item.vocab_items_id?.name || "",
      pinyin: item.vocab_items_id?.pinyin || "",
      meaning: "Đang tải...",
      note: item.vocab_items_id?.note || "",
      groupedSenses: {},
    };

    getOrFetchVocabDetail(vocabId, fallback).then(() => {
      setIsLoadingDetail(false);
      fetchingVocabIds.current.delete(vocabId);
    });
  }, [currentIndex, dataVocal, getOrFetchVocabDetail, vocabDetailCache, fetchingVocabIds]);

  // Background Pre-fetching for next 3 items
  useEffect(() => {
    if (dataVocal.length === 0) return;

    const prefetchCount = 3;
    const startIndex = currentIndex + 1;
    const endIndex = Math.min(startIndex + prefetchCount, dataVocal.length);

    for (let i = startIndex; i < endIndex; i++) {
      const item = dataVocal[i];
      const vocabId = item.vocab_items_id?.id ? String(item.vocab_items_id.id) : "";
      if (vocabId && !vocabDetailCache[vocabId] && !fetchingVocabIds.current.has(vocabId)) {
        const fallback: VocabDetail = {
          word: item.vocab_items_id?.name || "",
          pinyin: item.vocab_items_id?.pinyin || "",
          meaning: "Đang tải...",
          note: item.vocab_items_id?.note || "",
          groupedSenses: {},
        };
        // Skip global loading state for background fetches
        getOrFetchVocabDetail(vocabId, fallback, true).then(() => {
          fetchingVocabIds.current.delete(vocabId);
        });
      }
    }
  }, [currentIndex, dataVocal, vocabDetailCache, getOrFetchVocabDetail, fetchingVocabIds]);

  // --- Actions ---

  const saveProgress = useCallback(
    async (status: FlashcardStatus) => {
      if (dataVocal.length === 0 || currentIndex >= dataVocal.length) return;

      const vocabId = dataVocal[currentIndex]?.vocab_items_id?.id
        ? String(dataVocal[currentIndex].vocab_items_id.id)
        : null;
      if (!vocabId) return;

      try {
        const sourceType = normalized.type === "system" ? "system" : "personal";
        const deckId = normalized.notebookId || null;
        const flashcardItemId = normalized.type === "personal" ? vocabId : null;

        await notebookApi.updateVocabProgress(sourceType, deckId, vocabId, status, flashcardItemId);

        if (status === "favorite") {
          setFavoriteStatus((prev) => ({ ...prev, [vocabId]: true }));
        }
      } catch (e) {
        logger.error("Failed to save progress", e);
      }
    },
    [currentIndex, dataVocal, normalized],
  );

  const toggleFavorite = useCallback(async () => {
    if (dataVocal.length === 0 || currentIndex >= dataVocal.length) return;

    const vocabId = dataVocal[currentIndex]?.vocab_items_id?.id
      ? String(dataVocal[currentIndex].vocab_items_id.id)
      : null;
    if (!vocabId) return;

    const isCurrentlyFavorite = favoriteStatus[vocabId] || false;
    const newStatus = isCurrentlyFavorite ? previousStatus[vocabId] || "learning" : "favorite";

    try {
      const sourceType = normalized.type === "system" ? "system" : "personal";
      const deckId = normalized.notebookId || null;
      const flashcardItemId = normalized.type === "personal" ? vocabId : null;

      await notebookApi.updateVocabProgress(
        sourceType,
        deckId,
        vocabId,
        newStatus,
        flashcardItemId,
      );

      setFavoriteStatus((prev) => ({ ...prev, [vocabId]: !isCurrentlyFavorite }));
      if (isCurrentlyFavorite) {
        setPreviousStatus((prev) => {
          const updated = { ...prev };
          delete updated[vocabId];
          return updated;
        });
      }
    } catch (e) {
      logger.error("Failed to toggle favorite", e);
    }
  }, [currentIndex, dataVocal, favoriteStatus, normalized, previousStatus]);

  const navigateToResult = useCallback(
    (finalKnown: number, finalUnknown: number) => {
      safeNavigation.replace("/screens/flashcard/StudyResults", {
        known: String(finalKnown),
        unknown: String(finalUnknown),
        total: String(dataVocal.length),
        notebookId: normalized.notebookId,
        topicId: normalized.topicId,
        type: normalized.type,
      });
    },
    [dataVocal.length, normalized],
  );

  const moveToNext = useCallback(
    async (status: "mastered" | "uncertain" | "learning") => {
      await saveProgress(status);

      const isLast = currentIndex >= dataVocal.length - 1;
      let nextKnown = knownCount;
      let nextUnknown = unknownCount;

      if (status === "mastered") nextKnown++;
      else nextUnknown++;

      if (isLast) {
        navigateToResult(nextKnown, nextUnknown);
      } else {
        setKnownCount(nextKnown);
        setUnknownCount(nextUnknown);
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setExpandedSections({});
      }
    },
    [currentIndex, dataVocal.length, knownCount, unknownCount, saveProgress, navigateToResult],
  );

  const moveToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setExpandedSections({});
    }
  }, [currentIndex]);

  const flip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // --- Reset logic ---
  useEffect(() => {
    if (restart) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnownCount(0);
      setUnknownCount(0);
      setExpandedSections({});
    }
  }, [restart]);

  // Synchronously derive current detail
  const currentDetail = useMemo(() => {
    if (dataVocal.length === 0 || currentIndex >= dataVocal.length) return null;
    const item = dataVocal[currentIndex];
    const vocabId = item.vocab_items_id?.id ? String(item.vocab_items_id.id) : "";
    return vocabDetailCache[vocabId] || null;
  }, [currentIndex, dataVocal, vocabDetailCache]);

  return {
    // Data
    dataVocal,
    isLoadingList,
    currentIndex,
    isFlipped,
    knownCount,
    unknownCount,
    currentVocabDetail: currentDetail,
    isLoadingDetail,
    expandedSections,
    favoriteStatus,

    // Actions
    setExpandedSections,
    moveToNext,
    moveToPrevious,
    flip,
    toggleFavorite,
    getOrFetchVocabDetail,
    setCurrentIndex,
    setIsFlipped,
  };
}
