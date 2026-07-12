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
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

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
    currentVocabDetail,
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
          <div key={sense.id || sense.meaning_vi} className="flex flex-col gap-1.5 pl-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-150">
              {idx + 1}. {sense.meaning_vi}
            </p>
            
            {sense.examples?.map((ex: any) => (
              <div key={ex.chinese} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2.5 flex flex-col gap-0.5 border border-zinc-100 dark:border-zinc-850">
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
    <div className="flex min-h-screen overflow-hidden bg-white text-gray-800 flex-1 -m-4 sm:-m-6 lg:-m-8">
      <Sidebar view="flashcard" setView={() => globalThis.location.replace("/flashcard")} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header view="flashcard" setView={() => globalThis.location.replace("/flashcard")} showLogo={false} />

        <div className="p-6 md:p-8 space-y-8 max-w-xl w-full mx-auto flex-1 flex flex-col justify-start pb-20">
          <div className="bg-[#f59e0b] text-gray-950 font-black py-3 px-6 rounded-xl text-center shadow-xs text-sm uppercase tracking-wide">
            {fallbackDataActive ? "Thử thách Flashcard" : "Học tập Flashcard"}
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-gray-400 select-none px-2">
            <span>Tiến trình: {displayIndex + 1} / {totalCards}</span>
            <button
              onClick={toggleFavorite}
              className={`text-lg cursor-pointer ${isFavorite ? "text-red-500" : "text-gray-300"}`}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>

          <div className="h-64 w-full">
            <FlashcardCard
              isFlipped={isCardFlipped}
              onFlip={handleFlipAction}
              frontContent={
                <div className="flex-1 flex flex-col items-center justify-center p-6 h-full text-center">
                  <span className="text-4xl font-extrabold text-gray-900 tracking-wider">
                    {activeVocab?.name || activeDetail?.word}
                  </span>
                  <p className="text-xs text-gray-400 font-bold mt-4">Nhấp để xem nghĩa</p>
                </div>
              }
              backContent={
                <div className="flex-1 flex flex-col justify-between p-6 h-full overflow-y-auto scrollbar-thin">
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-3xl font-extrabold text-gray-900 tracking-wider">
                        {activeVocab?.name || activeDetail?.word}
                      </span>
                      <p className="text-sm font-semibold text-gray-400 font-mono mt-1">
                        {activeVocab?.pinyin || activeDetail?.pinyin}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      {sensesContent}
                    </div>

                    {activeDetail?.note && (
                      <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                        <span className="font-bold">Ghi chú: </span>
                        {activeDetail.note}
                      </div>
                    )}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(activeVocab?.name || activeDetail?.word || "");
                      }}
                      className="border border-amber-250 text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 justify-center"
                    >
                      🔊 Nghe phát âm
                    </button>
                    <div className="text-center text-xs text-zinc-400 mt-2">
                      Nhấp để quay lại mặt trước
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <FlashcardControls
            onNext={handleNextAction}
            onPrevious={handlePrevAction}
            onFlip={handleFlipAction}
            currentIndex={displayIndex}
            isFirst={displayIndex === 0}
          />

          <div className="flex justify-start w-full pt-4">
            <Link
              href="/flashcard"
              className="text-xs font-black text-gray-400 hover:text-gray-600"
            >
              &larr; Về sổ tay cá nhân
            </Link>
          </div>
        </div>
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

