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
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Folder, Lightbulb, User, Library, Notebook, Key, Trophy, FolderOpen, ChevronDown, ChevronUp, Heart } from "lucide-react";

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
    <PageContainer className="max-w-4xl">
          <PageHeader
            title="Thẻ Ghi Nhớ Flashcard"
            description="Chọn một bộ từ vựng dưới đây để bắt đầu ôn tập theo phương pháp lặp lại ngắt quãng (SRS)."
            icon={<Folder className="w-7 h-7" />}
          />

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {(["suggest", "personal", "system"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-extrabold border-b-2 transition-all duration-200 cursor-pointer ${activeTab === tab
                    ? "border-amber-500 text-amber-600 dark:text-amber-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                  }`}
              >
                {tab === "suggest" && <><Lightbulb className="w-4 h-4 mr-2 inline" /> Gợi ý học nhanh</>}
                {tab === "personal" && <><User className="w-4 h-4 mr-2 inline" /> Sổ tay của tôi</>}
                {tab === "system" && <><Library className="w-4 h-4 mr-2 inline" /> Trình độ HSK</>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {/* Suggest Tab */}
            {activeTab === "suggest" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/flashcard?type=suggest" className="block group">
                  <Card className="flex flex-col justify-between p-6 rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-amber-900 h-full">
                    <div className="space-y-3">
                        <Lightbulb className="w-6 h-6" />
                      <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-lg tracking-tight">
                        Bộ từ gợi ý hệ thống
                      </h3>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed">
                        Luyện tập nhanh với các từ vựng thiết yếu và phổ biến nhất (học thử demo).
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center text-xs font-bold text-amber-600 hover:underline">
                      Bắt đầu học ngay →
                    </span>
                  </Card>
                </Link>
              </div>
            )}

            {/* Personal Tab */}
            {activeTab === "personal" && (
              <div className="flex flex-col gap-6">
                {!isAuthenticated ? (
                  <Card className="flex flex-col items-center justify-center p-12 text-center gap-4 border-dashed border-zinc-250 dark:border-zinc-800">
                    <Key className="w-10 h-10 text-zinc-400" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-250">Yêu cầu đăng nhập</h3>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">Bạn cần đăng nhập để quản lý và học sổ tay từ vựng cá nhân của mình.</p>
                    </div>
                    <Button asChild size="sm">
                      <Link href="/sign-in">Đăng nhập ngay</Link>
                    </Button>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Create Deck Form */}
                    <form onSubmit={handleCreateDeck} className="flex gap-3 w-full max-w-md">
                      <Input
                        type="text"
                        placeholder="Tên sổ tay mới... (vd: Từ vựng giao tiếp)"
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.target.value)}
                        required
                        className="flex-1 font-medium"
                      />
                      <Button
                        type="submit"
                        disabled={isCreatingDeck}
                        size="default"
                      >
                        {isCreatingDeck ? "Đang tạo..." : "Tạo mới"}
                      </Button>
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
                            className="block group"
                          >
                            <Card className="flex flex-col justify-between p-6 rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-amber-900 h-full">
                              <div className="space-y-3">
                                  <Notebook className="w-6 h-6" />
                                <h3 className="text-lg font-black group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-1">
                                  {deck.title}
                                </h3>
                              </div>
                              <span className="mt-6 inline-flex items-center text-xs font-bold text-amber-600 hover:underline">
                                Luyện tập sổ tay →
                              </span>
                            </Card>
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
                        <Card
                          key={level.id}
                          className="overflow-hidden rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          {/* Header */}
                          <button
                            onClick={() => handleToggleHsk(level.id)}
                            className="w-full flex items-center justify-between p-5 text-left font-black text-base text-zinc-900 dark:text-white cursor-pointer select-none bg-transparent border-none"
                          >
                            <span className="flex items-center gap-3">
                              <Trophy className="w-5 h-5 text-amber-500" /> {level.name}
                            </span>
                            <span className="text-zinc-400 font-bold transition-transform duration-250">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
                                      className="block group"
                                    >
                                      <Card className="flex items-center gap-3 p-4 rounded-xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900 text-sm font-bold text-zinc-800 dark:text-zinc-200 h-full">
                                        <FolderOpen className="w-5 h-5 text-amber-500" />
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
                                      </Card>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
    </PageContainer>
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
              <div key={ex.chinese} className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-2.5 flex flex-col gap-0.5 border border-zinc-150 dark:border-zinc-850">
                <p className="font-semibold text-amber-650 dark:text-amber-500">{ex.chinese}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold">{ex.pinyin}</p>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">{ex.vietnamese || ex.p_vi}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    ));
  }

  return (
    <PageContainer className="max-w-3xl">
          <div className="bg-amber-500 text-white font-black py-4 px-6 rounded-2xl text-center shadow-xs text-sm uppercase tracking-wide">
            {fallbackDataActive ? "Thử thách Flashcard" : "Học tập Flashcard"}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 dark:text-zinc-400 select-none px-1">
              <span>Tiến trình học: {displayIndex + 1} / {totalCards}</span>
              <button
                onClick={toggleFavorite}
                className={`cursor-pointer bg-transparent border-none transition-all active:scale-90 ${isFavorite ? "text-rose-500" : "text-zinc-300 dark:text-zinc-700 hover:text-rose-400"}`}
              >
                <Heart className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>
            {/* Dynamic Progress Bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${((displayIndex + 1) / totalCards) * 100}%` }}
              />
            </div>
          </div>

          <div className="h-96 w-full mt-2">
            <FlashcardCard
              isFlipped={isCardFlipped}
              onFlip={handleFlipAction}
              frontContent={
                <div className="flex-1 flex flex-col items-center justify-center p-8 h-full text-center rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-6xl font-black text-zinc-900 dark:text-white tracking-wider">
                    {activeVocab?.name || activeDetail?.word}
                  </span>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-6 tracking-wide">Nhấp vào thẻ hoặc ấn [Space] để xem nghĩa</p>
                </div>
              }
              backContent={
                <div className="flex-1 flex flex-col justify-between p-8 h-full overflow-y-auto scrollbar-thin rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="space-y-5">
                    <div className="text-center">
                      <span className="text-5xl font-black text-zinc-900 dark:text-white tracking-wider">
                        {activeVocab?.name || activeDetail?.word}
                      </span>
                      <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 font-mono mt-2">
                        {activeVocab?.pinyin || activeDetail?.pinyin}
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-4">
                      {sensesContent}
                    </div>

                    {activeDetail?.note && (
                      <div className="text-xs text-zinc-400 dark:text-zinc-550 border-t border-zinc-100 dark:border-zinc-800/85 pt-3">
                        <span className="font-bold text-zinc-500">Ghi chú: </span>
                        {activeDetail.note}
                      </div>
                    )}
                  </div>

                  <div className="text-center pt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(activeVocab?.name || activeDetail?.word || "");
                      }}
                      className="border border-amber-500/25 text-amber-700 dark:text-amber-500 hover:bg-amber-50/50 dark:hover:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 justify-center bg-transparent"
                    >
                      🔊 Nghe phát âm
                    </button>
                    <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 font-semibold">
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
              className="text-xs font-black text-zinc-400 hover:text-amber-600 dark:text-zinc-550 dark:hover:text-amber-500 transition-colors"
            >
              &larr; Về sổ tay cá nhân
            </Link>
          </div>
    </PageContainer>
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

