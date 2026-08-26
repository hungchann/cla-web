"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getBookLibraryById, saveReadingProgress, getReadingProgress } from "@/api/stories";
import { translateWord } from "@/api/apiService";
import { segmentChineseText as apiSegmentChineseText, type SegmentResult } from "@/api/segment";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { BackButton } from "@/components/BackButton";
import { PageContainer } from "@/components/PageContainer";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremiumGate } from "@/lib/hooks/usePremiumGate";
import { canAccessStoryChapter } from "@/lib/premium";
import { buildCheckoutUrl } from "@/api/plans";
import { RubyText } from "@/components/RubyText";
import { PinyinToggle } from "@/components/PinyinToggle";
import { X } from "lucide-react";

export default function StoryDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [isOpenPinyin, setIsOpenPinyin] = useState(true);
  const [segmentedLines, setSegmentedLines] = useState<SegmentResult[][]>([]);
  const [segmentedChapterId, setSegmentedChapterId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string; meaning: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Premium gate: chương 1 free, các chương sau là Premium (giống mobile).
  const { isPremium, premiumModalVisible, setPremiumModalVisible } = usePremiumGate();

  // Fetch book detail
  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBookLibraryById(id as string),
    enabled: !!id,
  });

  const { data: progressList } = useQuery({
    queryKey: ["readingProgress", id],
    queryFn: () => getReadingProgress(),
    enabled: !!id,
  });

  // Sort chapters by sort_id descending or ascending (we want ascending)
  const chapters = useMemo(
    () => (book?.chapters_id ? [...book.chapters_id].sort((a: any, b: any) => a.sort_id - b.sort_id) : []),
    [book],
  );
  const currentChapter = selectedChapterIndex !== null ? chapters[selectedChapterIndex] : null;

  // Split content by newline to display lines nicely
  const getLines = (text: any): string[] => {
    if (!text) return [];
    if (typeof text === "string") {
      return text.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0);
    }
    if (Array.isArray(text)) {
      return text.map(String).filter((t) => t.trim().length > 0);
    }
    if (typeof text === "object" && text.blocks && Array.isArray(text.blocks)) {
      // Handle rich text blocks if applicable
      return text.blocks.map((b: any) => b?.data?.text || "").filter((t: string) => t.trim().length > 0);
    }
    return String(text).split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0);
  };

  let chineseLines: string[] = [];
  let vietnameseLines: string[] = [];
  let pinyinLines: string[] = [];

  if (currentChapter) {
    if (Array.isArray(currentChapter.book_content) && currentChapter.book_content.length > 0 && typeof currentChapter.book_content[0] === 'object' && ('zn' in currentChapter.book_content[0])) {
      chineseLines = currentChapter.book_content.map((item: any) => item.zn || "");
      vietnameseLines = currentChapter.book_content.map((item: any) => item.vi || "");
      pinyinLines = currentChapter.book_content.map((item: any) => item.py || item.pinyin || "");
    } else {
      chineseLines = getLines(currentChapter.book_content);
      vietnameseLines = getLines(currentChapter.content).map(line => line.replace(/<[^>]*>?/gm, ''));
    }

  }

  const fallbackSegments = (line: string): SegmentResult[] =>
    Array.from(line).map((word) => ({ word, pinyin: "" }));

  const storyContent = chineseLines.map((chinese, index) => ({
    id: index,
    chinese,
    vietnamese: vietnameseLines[index] || "",
    pinyin: pinyinLines[index] || "",
    segmentedWords:
      segmentedChapterId === currentChapter?.id
        ? segmentedLines[index] || fallbackSegments(chinese)
        : fallbackSegments(chinese),
  }));

  const saveProgressMutation = useMutation({
    mutationFn: ({ chapterId, percentage }: { chapterId: number; percentage: number }) =>
      saveReadingProgress(id as string, chapterId, percentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readingProgress", id] });
    },
  });

  // Auto-select first chapter if not selected
  useEffect(() => {
    if (book && chapters.length > 0 && selectedChapterIndex === null) {
      const lastReadIndex = chapters.findIndex((c: any) => {
        const prog = progressList?.find((p: any) => p.chapter_id === c.sort_id);
        return prog && prog.percentage < 100;
      });
      setSelectedChapterIndex(lastReadIndex !== -1 ? lastReadIndex : 0);
    }
  }, [book, progressList, id, selectedChapterIndex, chapters]);

  // Segment each line so pinyin is rendered above its matching word.
  useEffect(() => {
    if (!currentChapter) return;

    setSegmentedLines([]);
    setSegmentedChapterId(null);
    setSelectedWord(null);
    let cancelled = false;

    apiSegmentChineseText(chineseLines)
      .then((segments) => {
        if (!cancelled) {
          setSegmentedLines(segments.map((line, index) => {
            const isUnsegmented =
              line.length === 0 || (line.length === 1 && line[0].word === chineseLines[index] && !line[0].pinyin);
            return isUnsegmented ? fallbackSegments(chineseLines[index]) : line;
          }));
          setSegmentedChapterId(currentChapter.id ?? null);
        }
      })
      .catch((error) => {
        if (isAIConsentRequiredError(error)) {
          console.log("AI consent not granted yet, using local story view fallback.");
        } else {
          console.warn("Failed to segment story content", error);
        }
        if (!cancelled) {
          setSegmentedLines(chineseLines.map(fallbackSegments));
          setSegmentedChapterId(currentChapter.id ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentChapter]);

  const handleWordPress = async (word: string) => {
    setSelectedWord({ word, pinyin: "Đang tải...", meaning: "Đang dịch nghĩa..." });
    setIsTranslating(true);

    const formatMeaning = (raw: unknown): string => {
      if (Array.isArray(raw)) return raw.join(", ");
      if (typeof raw === "string") return raw;
      if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
      return "";
    };

    try {
      const translated = (await translateWord(word))?.[0];
      const meaning = formatMeaning(translated?.meaning) || formatMeaning(translated?.meanings);
      setSelectedWord({
        word: translated?.word || word,
        pinyin: translated?.pinyin || "N/A",
        meaning: meaning || "Không tìm thấy nghĩa.",
      });
    } catch (error) {
      console.warn("Failed to translate story word", error);
      setSelectedWord({ word, pinyin: "N/A", meaning: "Dịch vụ tạm thời không khả dụng." });
    } finally {
      setIsTranslating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-zinc-500 font-bold">Không tìm thấy tác phẩm yêu cầu.</p>
            <Link href="/stories" className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-amber-600">
              Quay lại thư viện
            </Link>
          </div>
      </div>
    );
  }

  const handleSelectChapter = (index: number) => {
    // Free user chỉ đọc được chương đầu tiên / chương is_free_preview.
    if (!canAccessStoryChapter(chapters[index], index, isPremium)) {
      setPremiumModalVisible(true);
      return;
    }
    setSelectedChapterIndex(index);
    const chapter = chapters[index];
    if (chapter) {
      saveProgressMutation.mutate({
        chapterId: chapter.sort_id || index + 1,
        percentage: 100, // Completed reading this chapter
      });
    }
  };

  return (
    <PageContainer maxWidth="full" className="gap-6">
      <BackButton href="/stories" label="Danh sách sách" />
      <PremiumGate
        isOpen={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        feature="đọc các chương truyện nâng cao"
        upgradeUrl={buildCheckoutUrl(undefined, `book-${id}`)}
      />
        <main className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cột trái: Nội dung chương đang đọc */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-end">

              {currentChapter && (
                <PinyinToggle isOpen={isOpenPinyin} onChange={setIsOpenPinyin} />
              )}
            </div>

            {currentChapter ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 md:p-8 shadow-xs space-y-6">
                {/* Chapter Title */}
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 text-center">
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                    {currentChapter.title}
                  </h2>
                </div>

                {/* Chapter Lines – book reading style */}
                <div className="space-y-8 text-lg leading-loose text-zinc-800 dark:text-zinc-200">
                  {storyContent.map((line: any, idx: number) => {
                    const words = Array.isArray(line.segmentedWords) && line.segmentedWords.length > 0
                      ? line.segmentedWords
                      : fallbackSegments(line.chinese);

                    return (
                      <div key={line.chinese || `line-${idx}`} className="space-y-2">
                        {/* Chinese + Pinyin inline */}
                        <p className="leading-relaxed">
                          {words.map((w: { word: string; pinyin: string }, i: number) => (
                            <RubyText
                              key={`ruby-${idx}-${i}`}
                              word={w.word}
                              pinyin={isOpenPinyin ? w.pinyin : undefined}
                              fontSize={24}
                              pinyinSize={13}
                              onPress={(event) => {
                                event.stopPropagation();
                                handleWordPress(w.word);
                              }}
                              containerClassName="mr-0.5"
                            />
                          ))}
                        </p>

                        {/* Vietnamese Translation */}
                        {line.vietnamese && (
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-500 leading-relaxed">
                            {line.vietnamese}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedWord && (
                  /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setSelectedWord(null);
                      }
                    }}
                  >
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 cursor-default">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-2xl font-black text-amber-600 dark:text-amber-500">
                              {selectedWord.word}
                            </h4>
                            {isTranslating ? (
                              <span className="inline-block w-4 h-4 border-2 border-zinc-200 border-t-amber-600 rounded-full animate-spin"></span>
                            ) : (
                              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550">
                                {selectedWord.pinyin}
                              </span>
                            )}
                          </div>
                          <div className="mt-3">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              Ý nghĩa
                            </h5>
                            <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-350 leading-relaxed">
                              {selectedWord.meaning}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedWord(null)}
                          className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chapter Navigation Buttons */}
                <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  <button
                    type="button"
                    onClick={() => handleSelectChapter(selectedChapterIndex! - 1)}
                    disabled={selectedChapterIndex === 0}
                    className="px-4 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
                  >
                    &larr; Chương trước
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectChapter(selectedChapterIndex! + 1)}
                    disabled={selectedChapterIndex === chapters.length - 1}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl disabled:opacity-40 cursor-pointer"
                  >
                    Chương tiếp &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-12 text-center text-zinc-400 font-bold">
                Chọn một chương từ danh sách bên phải để bắt đầu đọc.
              </div>
            )}
          </div>

          {/* Cột phải: Danh sách chương và thông tin sách */}
          <div className="space-y-6">
            {/* Book Metadata */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Thông tin tác phẩm</h3>
              <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <p><strong>Tác giả:</strong> {book.author || book.author_trans || "Khuyết danh"}</p>
                {book.author_trans && <p><strong>Dịch giả:</strong> {book.author_trans}</p>}
                <p><strong>Lượt đọc:</strong> {book.view_count || 0}</p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-2">
                  <p className="font-bold text-zinc-600 dark:text-zinc-300 mb-1">Tóm tắt:</p>
                  <p className="leading-relaxed">{book.summary || "Chưa có tóm tắt chi tiết."}</p>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Danh sách chương ({chapters.length})</h3>
              
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {chapters.map((chap: any, idx: number) => {
                  const isActive = selectedChapterIndex === idx;
                  const isLocked = !canAccessStoryChapter(chap, idx, isPremium);
                  return (
                    <button
                      type="button"
                      key={chap.id}
                      onClick={() => handleSelectChapter(idx)}
                      className={`w-full text-left text-xs font-bold p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive
                           ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                           : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span>
                          Chương {chap.sort_id || idx + 1}: {chap.title}
                        </span>
                        {isLocked && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                            VIP
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
    </PageContainer>
  );
}
