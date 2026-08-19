import { speakingApi } from "@/api/speaking";
import { speakChinese, stopSpeech } from "@/lib/utils/speech";
import { usePremium } from "@/lib/hooks/usePremium";
import { playTranslationResultSound } from "@/services/audioFeedback";
import {
  audioRecordingService,
  RecordingResult,
  RecordingState,
} from "@/services/audioRecordingService";
import { compareTextsAdvanced, ComparisonResult } from "@/services/textComparisonService";
import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "@/services/logger";

export interface ConversationItem {
  id: string;
  chinese_text: string;
  pinyin: string;
  vietnamese_text: string;
  speaker: string;
  order: number;
}

export interface ConversationMessage extends ConversationItem {
  recording?: {
    state: RecordingState;
    result?: RecordingResult;
    comparison?: ComparisonResult;
  };
}

export function useConversationDetail(conversationId: string | null, overrideItems?: ConversationItem[]) {
  const { isPremium } = usePremium();

  const [items, setItems] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  // ---  TỰ ĐỘNG HIỂN THỊ CÂU KẾ TIẾP & PHÁT AUDIO ---
  useEffect(() => {
    if (loading || items.length === 0) return;

    const currentMessage = items[visibleCount - 1];
    if (!currentMessage) return;

    // Nếu đã hết hội thoại thì dừng
    if (visibleCount >= items.length) return;

    // Nếu là nhân vật A -> tự động phát audio và chuyển câu tiếp theo
    if (currentMessage.speaker?.toUpperCase() === "A") {
      handleSpeak(currentMessage.chinese_text);

      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 1, items.length));
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Nếu là nhân vật B -> chỉ auto chuyển khi đã có kết quả so sánh
    if (currentMessage.speaker?.toUpperCase() === "B" && currentMessage.recording?.comparison) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + 1, items.length));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, items, loading]);

  useEffect(() => {
    const unsubscribe = audioRecordingService.subscribe((state) => {
      if (!activeRecordingId) {
        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === activeRecordingId
            ? {
                ...item,
                recording: {
                  ...item.recording,
                  state: state,
                  result: item.recording?.result,
                },
              }
            : item,
        ),
      );
    });

    return () => {
      unsubscribe();
      stopSpeech().catch((error: unknown) => {
        logger.error("Error stopping speech:", error);
      });
      audioRecordingService.cleanup().catch((error: unknown) => {
        logger.error("Recording cleanup error:", error);
      });
    };
  }, [activeRecordingId]);

  // Stop speech audio when screen loses focus (user navigates away)
  useEffect(() => {
    return () => {
      stopSpeech().catch((error: unknown) => {
        logger.error("Error stopping speech on unmount:", error);
      });
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchConversation = async () => {
      // Nếu bài học tự chứa dialogues (lesson_dialogues) thì dùng thẳng, không fetch từ speaking
      if (overrideItems && overrideItems.length > 0) {
        const sortedItems: ConversationMessage[] = [...overrideItems]
          .sort((a: ConversationItem, b: ConversationItem) => a.order - b.order)
          .map((item) => ({
            ...item,
            recording: {
              state: audioRecordingService.getState(),
              result: undefined,
              comparison: undefined,
            },
          }));
        if (isMounted) {
          setItems(sortedItems);
          setVisibleCount(sortedItems.length > 0 ? 1 : 0);
          setErrorMessage(null);
          setLoading(false);
        }
        return;
      }

      if (!conversationId) {
        setItems([]);
        setVisibleCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await speakingApi.getConversation(conversationId);
        const sortedItems: ConversationMessage[] = Array.isArray(response)
          ? [...response]
              .sort((a: ConversationItem, b: ConversationItem) => a.order - b.order)
              .map((item) => ({
                ...item,
                recording: {
                  state: audioRecordingService.getState(),
                  result: undefined,
                  comparison: undefined,
                },
              }))
          : [];

        if (!isMounted) {
          return;
        }

        if (sortedItems.length === 0) {
          setErrorMessage("Không tìm thấy hội thoại");
        } else {
          setErrorMessage(null);
        }

        setItems(sortedItems);
        setVisibleCount(sortedItems.length > 0 ? 1 : 0);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        logger.error("Error fetching conversation:", error);
        setErrorMessage("Không thể tải hội thoại, hiển thị nội dung mẫu");
        const fallbackItems: ConversationMessage[] = [
          {
            id: "fallback-1",
            chinese_text: "你好",
            pinyin: "nǐ hǎo",
            vietnamese_text: "Xin chào",
            speaker: "A",
            order: 1,
          },
          {
            id: "fallback-2",
            chinese_text: "你好吗？",
            pinyin: "nǐ hǎo ma?",
            vietnamese_text: "Bạn khỏe không?",
            speaker: "B",
            order: 2,
            recording: {
              state: audioRecordingService.getState(),
            },
          },
        ];
        setItems(fallbackItems);
        setVisibleCount(fallbackItems.length);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConversation();

    return () => {
      isMounted = false;
    };
  }, [conversationId, overrideItems]);

  const visibleMessages = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const hasMoreMessages = visibleCount < items.length;

  const handleContinue = useCallback(() => {
    if (!hasMoreMessages) {
      return;
    }
    setVisibleCount((prev) => Math.min(prev + 1, items.length));
  }, [hasMoreMessages, items.length]);

  const handleSpeak = useCallback((text: string) => {
    if (!text) {
      return;
    }
    try {
      speakChinese(text);
    } catch (error) {
      logger.error("Failed to play speech", error);
    }
  }, []);

  const updateMessageRecording = useCallback(
    (messageId: string, updates: Partial<NonNullable<ConversationMessage["recording"]>>) => {
      setItems((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                recording: {
                  state: message.recording?.state || audioRecordingService.getState(),
                  result: message.recording?.result,
                  comparison: message.recording?.comparison,
                  ...updates,
                },
              }
            : message,
        ),
      );
    },
    [],
  );

  const handleToggleRecording = useCallback(
    async (messageId: string) => {
      const message = items.find((item) => item.id === messageId);
      if (!message) {
        return;
      }

      const isRecording = message.recording?.state.isRecording && activeRecordingId === messageId;

      try {
        if (isRecording) {
          updateMessageRecording(messageId, {
            state: {
              ...audioRecordingService.getState(),
              isRecording: false,
              isProcessing: true,
            },
          });

          const result = await audioRecordingService.stopRecordingAndTranscribe();
          let comparison: ComparisonResult | undefined;
          if (!result.errorType && result.text && result.text.trim().length > 0) {
            comparison = compareTextsAdvanced(message.chinese_text, result.text || "");
            if (!isPremium && comparison) {
              comparison = undefined;
              setPremiumModalVisible(true);
            }

            if (comparison) {
              playTranslationResultSound(comparison.accuracy).catch((error) => {
                logger.warn("Không phát được âm thanh phản hồi", error);
              });
            }
          }

          updateMessageRecording(messageId, {
            state: audioRecordingService.getState(),
            result,
            comparison,
          });
          setActiveRecordingId(null);
        } else {
          if (activeRecordingId && activeRecordingId !== messageId) {
            await audioRecordingService.cancelRecording();
            updateMessageRecording(activeRecordingId, {
              state: audioRecordingService.getState(),
            });
            setActiveRecordingId(null);
          }

          setActiveRecordingId(messageId);
          await audioRecordingService.startRecording();
          updateMessageRecording(messageId, {
            state: audioRecordingService.getState(),
            result: undefined,
            comparison: undefined,
          });
        }
      } catch (error) {
        logger.error("Recording error:", error);
        updateMessageRecording(messageId, {
          state: {
            ...audioRecordingService.getState(),
            isRecording: false,
            isProcessing: false,
            error: error instanceof Error ? error.message : "Không thể xử lý ghi âm",
          },
        });
        setActiveRecordingId(null);
      }
    },
    [activeRecordingId, isPremium, items, updateMessageRecording],
  );

  const computeSpeakerBStats = useCallback(() => {
    const speakerBMessages = items.filter((item) => item.speaker?.toUpperCase() === "B");
    const speakerBWithRecording = speakerBMessages.filter((item) => item.recording?.comparison);
    const totalSpeakerB = speakerBMessages.length;
    const completedSpeakerB = speakerBWithRecording.length;

    const totalAccuracy = speakerBWithRecording.reduce((sum, item) => {
      return sum + (item.recording?.comparison?.accuracy || 0);
    }, 0);
    const averageAccuracy = completedSpeakerB > 0 ? totalAccuracy / completedSpeakerB : 0;

    return { totalSpeakerB, completedSpeakerB, averageAccuracy };
  }, [items]);

  return {
    // state
    items,
    loading,
    errorMessage,
    visibleCount,
    visibleMessages,
    hasMoreMessages,
    activeRecordingId,
    isPremium,
    premiumModalVisible,
    // setters
    setPremiumModalVisible,
    // actions
    handleContinue,
    handleSpeak,
    handleToggleRecording,
    computeSpeakerBStats,
  };
}
