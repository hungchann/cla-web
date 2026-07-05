"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useVocabFlashcardData } from "@/lib/hooks/useVocabFlashcardData";
import { FlashcardCard } from "@/components/flashcard/FlashcardC";
import { FlashcardControls } from "@/components/flashcard/FlashcardControls";
import { speakChinese } from "@/lib/utils/speech";
import { notebookApi } from "@/api/notebook";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import Link from "next/link";

// Mock data từ vựng phong phú làm fallback
const MOCK_FLASHCARDS = [
  {
    vocab_items_id: {
      id: "m1",
      name: "学习",
      pinyin: "xuéxí",
      note: "Từ quan trọng cho HSK 1",
      senses: [
        {
          id: "s1",
          meaning_vi: "Học tập, nghiên cứu",
          pos_label: "Động từ",
          examples: [
            {
              chinese: "我们每天学习汉语。",
              pinyin: "Wǒmen měitiān xuéxí Hànyǔ.",
              vietnamese: "Chúng tôi học tiếng Trung mỗi ngày.",
            },
          ],
        },
      ],
    },
  },
  {
    vocab_items_id: {
      id: "m2",
      name: "漂亮",
      pinyin: "piàoliang",
      note: "Hình dung từ",
      senses: [
        {
          id: "s2",
          meaning_vi: "Xinh đẹp, đẹp đẽ",
          pos_label: "Tính từ",
          examples: [
            {
              chinese: "她穿这件衣服非常漂亮。",
              pinyin: "Tā chuān zhè jiàn yīfu fēicháng piàoliang.",
              vietnamese: "Cô ấy mặc bộ quần áo này vô cùng xinh đẹp.",
            },
          ],
        },
      ],
    },
  },
  {
    vocab_items_id: {
      id: "m3",
      name: "苹果",
      pinyin: "píngguǒ",
      note: "Danh từ chỉ hoa quả",
      senses: [
        {
          id: "s3",
          meaning_vi: "Quả táo",
          pos_label: "Danh từ",
          examples: [
            {
              chinese: "我想吃一个红苹果。",
              pinyin: "Wǒ xiǎng chī yí gè hóng píngguǒ.",
              vietnamese: "Tôi muốn ăn một quả táo đỏ.",
            },
          ],
        },
      ],
    },
  },
];

function FlashcardDashboard() {
  const [activeTab, setActiveTab] = useState<"suggest" | "personal" | "system">("suggest");
  const [personalDecks, setPersonalDecks] = useState<any[]>([]);
  const [hskLevels, setHskLevels] = useState<any[]>([]);
  const [expandedHskId, setExpandedHskId] = useState<string | null>(null);
  const [hskTopics, setHskTopics] = useState<Record<string, any[]>>({});
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingHsk, setLoadingHsk] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const status = await tokenUtils.checkTokenStatus();
      setIsAuthenticated(status.accessToken);
    };
    checkAuth();
  }, []);

  // Fetch personal decks
  useEffect(() => {
    if (activeTab === "personal" && isAuthenticated) {
      const fetchPersonal = async () => {
        setLoadingPersonal(true);
        try {
          const decks = await notebookApi.getPersonalNotebooks();
          setPersonalDecks(decks || []);
        } catch (e) {
          console.error("Failed to load personal decks", e);
        } finally {
          setLoadingPersonal(false);
        }
      };
      fetchPersonal();
    }
  }, [activeTab, isAuthenticated]);

  // Fetch HSK levels
  useEffect(() => {
    if (activeTab === "system") {
      const fetchHsk = async () => {
        setLoadingHsk(true);
        try {
          const levels = await notebookApi.getNoteBooks();
          setHskLevels(levels || []);
        } catch (e) {
          console.error("Failed to load HSK levels", e);
        } finally {
          setLoadingHsk(false);
        }
      };
      fetchHsk();
    }
  }, [activeTab]);

  // Fetch HSK sub-topics when expanded
  const handleToggleHsk = async (levelId: string) => {
    if (expandedHskId === levelId) {
      setExpandedHskId(null);
      return;
    }
    setExpandedHskId(levelId);

    if (!hskTopics[levelId]) {
      setLoadingTopics((prev) => ({ ...prev, [levelId]: true }));
      try {
        const topics = await notebookApi.getCategoryByNotebookId(levelId);
        setHskTopics((prev) => ({ ...prev, [levelId]: topics || [] }));
      } catch (e) {
        console.error("Failed to load HSK topics", e);
      } finally {
        setLoadingTopics((prev) => ({ ...prev, [levelId]: false }));
      }
    }
  };

  // Create personal deck
  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    setIsCreatingDeck(true);
    try {
      await notebookApi.createNoteBooks(newDeckTitle);
      const decks = await notebookApi.getPersonalNotebooks();
      setPersonalDecks(decks || []);
      setNewDeckTitle("");
    } catch (e) {
      console.error("Failed to create deck", e);
    } finally {
      setIsCreatingDeck(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-3xl font-black text-zinc-950 dark:text-white tracking-tight">
          🗂️ Thẻ Ghi Nhớ Flashcard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Chọn một bộ từ vựng dưới đây để bắt đầu ôn tập theo phương pháp lặp lại ngắt quãng (SRS).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(["suggest", "personal", "system"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-extrabold border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === tab
                ? "border-amber-500 text-amber-600 dark:text-amber-500"
                : "border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
            }`}
          >
            {tab === "suggest" && "💡 Gợi ý học nhanh"}
            {tab === "personal" && "👤 Sổ tay của tôi"}
            {tab === "system" && "📚 Trình độ HSK"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Suggest Tab */}
        {activeTab === "suggest" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/flashcard?type=suggest"
              className="flex flex-col justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center text-xl font-bold">
                  💡
                </div>
                <h3 className="text-lg font-black group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  Bộ từ gợi ý hệ thống
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                  Luyện tập nhanh với các từ vựng thiết yếu và phổ biến nhất (học thử demo).
                </p>
              </div>
              <span className="mt-6 inline-flex items-center text-xs font-bold text-amber-600 hover:underline">
                Bắt đầu học ngay →
              </span>
            </Link>
          </div>
        )}

        {/* Personal Tab */}
        {activeTab === "personal" && (
          <div className="flex flex-col gap-6">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-250 dark:border-zinc-800 text-center gap-4">
                <span className="text-3xl">🔑</span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Yêu cầu đăng nhập</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Bạn cần đăng nhập để quản lý và học sổ tay từ vựng cá nhân của mình.</p>
                </div>
                <Link
                  href="/sign-in"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-all"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Create Deck Form */}
                <form onSubmit={handleCreateDeck} className="flex gap-3 w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Tên sổ tay mới... (vd: Từ vựng giao tiếp)"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm text-zinc-800 dark:text-white dark:bg-zinc-950 dark:border-zinc-800 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingDeck}
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-55"
                  >
                    {isCreatingDeck ? "Đang tạo..." : "Tạo mới"}
                  </button>
                </form>

                {/* Decks list */}
                {loadingPersonal ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent"></div>
                  </div>
                ) : personalDecks.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">Bạn chưa tạo sổ tay từ vựng nào.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {personalDecks.map((deck) => (
                      <Link
                        key={deck.id}
                        href={`/flashcard?type=personal&notebookId=${deck.id}`}
                        className="flex flex-col justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:shadow-lg transition-all hover:-translate-y-1 group"
                      >
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center text-xl font-bold">
                            📓
                          </div>
                          <h3 className="text-lg font-black group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-1">
                            {deck.title}
                          </h3>
                        </div>
                        <span className="mt-6 inline-flex items-center text-xs font-bold text-amber-600 hover:underline">
                          Luyện tập sổ tay →
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* System (HSK) Tab */}
        {activeTab === "system" && (
          <div className="flex flex-col gap-4">
            {loadingHsk ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-600 border-t-transparent"></div>
              </div>
            ) : hskLevels.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">Không tải được cấp độ HSK.</p>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                {hskLevels.map((level) => {
                  const isExpanded = expandedHskId === level.id;
                  const topicsList = hskTopics[level.id] || [];
                  const topicsLoading = loadingTopics[level.id];

                  return (
                    <div
                      key={level.id}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-all shadow-2xs"
                    >
                      {/* Header */}
                      <button
                        onClick={() => handleToggleHsk(level.id)}
                        className="w-full flex items-center justify-between p-5 text-left font-black text-base text-zinc-900 dark:text-white cursor-pointer select-none"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-xl">🏆</span> {level.name}
                        </span>
                        <span className="text-zinc-400 font-bold transition-transform duration-250">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </button>

                      {/* Content */}
                      {isExpanded && (
                        <div className="border-t border-zinc-100 dark:border-zinc-800/80 p-5 bg-zinc-50/50 dark:bg-zinc-900/30">
                          {topicsLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                            </div>
                          ) : topicsList.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">Không có chủ đề nào.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {topicsList.map((item: any) => (
                                <Link
                                  key={item.id}
                                  href={`/flashcard?type=system&notebookId=${level.id}&topicId=${item.topic_id?.id}`}
                                  className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-950 border border-zinc-200/85 dark:border-zinc-800 rounded-2xl hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-2xs transition-all text-sm font-bold text-zinc-800 dark:text-zinc-200 group"
                                >
                                  <span className="text-amber-500">📁</span>
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors truncate">
                                      {item.topic_id?.name}
                                    </span>
                                    {item.topic_id?.chinese_name && (
                                      <span className="text-[10px] text-zinc-400 font-medium">
                                        {item.topic_id.chinese_name}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface FlashcardStudySessionProps {
  type: string;
  notebookId: string;
  topicId: string;
  restart: string;
  paramFakeData: string | null;
}

function FlashcardStudySession({
  type,
  notebookId,
  topicId,
  restart,
  paramFakeData,
}: Readonly<FlashcardStudySessionProps>) {
  // Nén data mock để truyền vào hook nếu cần
  const defaultMockJson = useMemo(() => {
    return encodeURIComponent(
      JSON.stringify(
        MOCK_FLASHCARDS.map((m) => ({
          id: m.vocab_items_id.id,
          word: m.vocab_items_id.name,
          pinyin: m.vocab_items_id.pinyin,
          note: m.vocab_items_id.note,
        }))
      )
    );
  }, []);

  const fakeData = paramFakeData || defaultMockJson;

  const hookData = useVocabFlashcardData({
    type,
    notebookId,
    topicId,
    restart,
    fakeData,
  });

  const {
    dataVocal,
    isLoadingList,
    currentIndex,
    isFlipped,
    knownCount,
    unknownCount,
    currentVocabDetail,
    isLoadingDetail,
    favoriteStatus,
    moveToNext,
    moveToPrevious,
    flip,
    toggleFavorite,
  } = hookData;

  const [fallbackDataActive, setFallbackDataActive] = useState(false);
  const [localIndex, setLocalIndex] = useState(0);
  const [localFlipped, setLocalFlipped] = useState(false);

  // Phát âm khi đổi thẻ
  const currentCard = dataVocal[currentIndex] || (fallbackDataActive ? MOCK_FLASHCARDS[localIndex] : null);
  const currentWord = currentCard?.vocab_items_id?.name || "";

  useEffect(() => {
    if (currentWord) {
      speakChinese(currentWord);
    }
  }, [currentIndex, localIndex, currentWord]);

  const handleNextAction = useCallback((status: "mastered" | "uncertain" | "learning") => {
    if (fallbackDataActive) {
      const isLast = localIndex >= MOCK_FLASHCARDS.length - 1;
      if (isLast) {
        // Đi tới trang kết quả với tham số mock
        const searchParams = new URLSearchParams({
          known: String(status === "mastered" ? MOCK_FLASHCARDS.length : MOCK_FLASHCARDS.length - 1),
          unknown: String(status === "mastered" ? 0 : 1),
          total: String(MOCK_FLASHCARDS.length),
        });
        globalThis.location.replace(`/flashcard/results?${searchParams.toString()}`);
      } else {
        setLocalIndex((prev) => prev + 1);
        setLocalFlipped(false);
      }
    } else {
      moveToNext(status);
    }
  }, [fallbackDataActive, localIndex, moveToNext]);

  const handlePrevAction = useCallback(() => {
    if (fallbackDataActive) {
      if (localIndex > 0) {
        setLocalIndex((prev) => prev - 1);
        setLocalFlipped(false);
      }
    } else {
      moveToPrevious();
    }
  }, [fallbackDataActive, localIndex, moveToPrevious]);

  const handleFlipAction = useCallback(() => {
    if (fallbackDataActive) {
      setLocalFlipped((f) => !f);
    } else {
      flip();
    }
  }, [fallbackDataActive, flip]);

  // Lắng nghe phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlipAction();
      } else if (e.code === "ArrowRight" || e.code === "Digit1") {
        // Thuộc từ
        handleNextAction("mastered");
      } else if (e.code === "ArrowLeft" || e.code === "Digit2") {
        // Chưa thuộc
        handleNextAction("learning");
      } else if (e.code === "ArrowUp") {
        // Xem lại
        handleNextAction("uncertain");
      } else if (e.code === "ArrowDown") {
        // Quay lại
        handlePrevAction();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleFlipAction, handleNextAction, handlePrevAction]);

  // Kích hoạt Mock Data khi API rỗng
  useEffect(() => {
    if (!isLoadingList && dataVocal.length === 0) {
      setFallbackDataActive(true);
    } else {
      setFallbackDataActive(false);
    }
  }, [isLoadingList, dataVocal]);

  if (isLoadingList) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  // Lấy dữ liệu chi tiết hiển thị
  const activeVocab = fallbackDataActive ? MOCK_FLASHCARDS[localIndex]?.vocab_items_id : currentCard?.vocab_items_id;
  const activeDetail = fallbackDataActive
    ? {
        word: activeVocab?.name || "",
        pinyin: activeVocab?.pinyin || "",
        meaning: activeVocab?.senses?.[0]?.meaning_vi || "",
        note: activeVocab?.note || "",
        groupedSenses: {
          [activeVocab?.senses?.[0]?.pos_label || "Từ loại"]: activeVocab?.senses || [],
        },
      }
    : currentVocabDetail;

  const isCardFlipped = fallbackDataActive ? localFlipped : isFlipped;
  const totalCards = fallbackDataActive ? MOCK_FLASHCARDS.length : dataVocal.length;
  const displayIndex = fallbackDataActive ? localIndex : currentIndex;

  const isFavorite = activeVocab?.id ? favoriteStatus[String(activeVocab.id)] : false;

  // Render detail senses definition (tránh nested ternary operation)
  let sensesContent: React.ReactNode = (
    <p className="text-zinc-400 italic">Không có nghĩa tiếng Việt.</p>
  );

  if (activeDetail?.groupedSenses) {
    sensesContent = Object.entries(activeDetail.groupedSenses).map(([pos, senses]) => (
      <div key={pos} className="flex flex-col gap-2">
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 w-fit">
          {pos}
        </span>
        {senses.map((sense: any, idx) => (
          <div key={sense.id || `sense-${idx}`} className="flex flex-col gap-1.5 pl-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-150">
              {idx + 1}. {sense.meaning_vi}
            </p>
            
            {sense.examples?.map((ex: any, eIdx: number) => (
              <div key={`ex-${eIdx}`} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2.5 flex flex-col gap-0.5 border border-zinc-100 dark:border-zinc-850">
                <p className="font-medium text-amber-600 dark:text-amber-500">{ex.chinese}</p>
                <p className="text-xs text-zinc-400 font-semibold">{ex.pinyin}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{ex.vietnamese || ex.p_vi}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    ));
  }

  return (
    <div className="flex-1 flex flex-col gap-6 py-4 max-w-lg mx-auto w-full items-center">
      {/* Progress header */}
      <div className="w-full flex items-center justify-between text-sm font-semibold text-zinc-500">
        <span>Từ số: {displayIndex + 1} / {totalCards}</span>
        <div className="flex gap-4">
          <span className="text-emerald-500">Thuộc: {knownCount}</span>
          <span className="text-rose-500">Chưa thuộc: {unknownCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 transition-all duration-300"
          style={{ width: `${((displayIndex + 1) / totalCards) * 100}%` }}
        ></div>
      </div>

      {/* Main Flashcard Container */}
      <div className="w-full aspect-[3/4] max-h-[480px] min-h-[380px] relative">
        {activeVocab && (
          <FlashcardCard
            isFlipped={isCardFlipped}
            onFlip={handleFlipAction}
            frontContent={
              <div className="flex-1 h-full flex flex-col justify-between p-8 relative">
                {/* Header actions on card */}
                <div className="flex justify-between items-center w-full z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite();
                    }}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={isFavorite ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5 text-yellow-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499c.195-.39.687-.39.882 0l2.3 4.697 5.181.753c.43.062.602.593.292.897l-3.75 3.655.886 5.161c.078.453-.398.8-.798.58L11.5 16.5l-4.63 2.433c-.4.21-.878-.137-.798-.58L7 13.047l-3.75-3.655c-.31-.304-.138-.834.292-.897l5.181-.754 2.3-4.697Z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakChinese(activeVocab.name || "");
                    }}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                  </button>
                </div>

                {/* Center Word */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-6xl font-black text-white select-all">{activeVocab.name}</span>
                  {activeVocab.pinyin && (
                    <span className="text-xl font-semibold text-amber-100">{activeVocab.pinyin}</span>
                  )}
                </div>

                {/* Footer hints */}
                <div className="text-center text-xs text-amber-200">
                  Nhấn Space hoặc Click để lật thẻ
                </div>
              </div>
            }
            backContent={
              <div className="flex-1 h-full flex flex-col justify-between p-8 relative">
                {/* Header word pinyin */}
                <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-500">{activeVocab.name}</h3>
                    <p className="text-sm font-semibold text-zinc-500">{activeVocab.pinyin}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakChinese(activeVocab.name || "");
                    }}
                    className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                  </button>
                </div>

                {/* Senses Definition detail */}
                <div className="flex-1 my-4 overflow-y-auto pr-1 flex flex-col gap-4 text-sm scrollbar-thin">
                  {isLoadingDetail ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></div>
                    </div>
                  ) : (
                    sensesContent
                  )}
                  
                  {activeDetail?.note && (
                    <div className="mt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2 text-xs text-zinc-400">
                      <strong>Ghi chú:</strong> {activeDetail.note}
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-zinc-400">
                  Nhập để quay lại mặt trước
                </div>
              </div>
            }
          />
        )}
      </div>

      {/* Control panel buttons */}
      <div className="w-full mt-2">
        <FlashcardControls
          onNext={handleNextAction}
          onPrevious={handlePrevAction}
          onFlip={handleFlipAction}
          currentIndex={displayIndex}
          isFirst={displayIndex === 0}
        />
      </div>

      {/* Shortcuts Guide for Premium Web UX */}
      <div className="w-full text-center text-xs text-zinc-400 dark:text-zinc-500 mt-4 border-t border-zinc-200 dark:border-zinc-850 pt-3 hidden sm:block">
        <span className="font-bold">Phím tắt:</span> <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">Space</kbd> để lật | <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">1</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">←</kbd> (Chưa thuộc) | <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">4</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">→</kbd> (Thuộc)
      </div>
    </div>
  );
}

function FlashcardContent() {
  const searchParams = useSearchParams();

  const type = searchParams.get("type");
  const notebookId = searchParams.get("notebookId") || "";
  const topicId = searchParams.get("topicId") || "";
  const restart = searchParams.get("restart") || "";
  const fakeData = searchParams.get("fakeData");

  if (!type) {
    return <FlashcardDashboard />;
  }

  return (
    <FlashcardStudySession
      type={type}
      notebookId={notebookId}
      topicId={topicId}
      restart={restart}
      paramFakeData={fakeData}
    />
  );
}

export default function FlashcardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    }>
      <FlashcardContent />
    </Suspense>
  );
}
