"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { speakChinese } from "@/lib/utils/speech";
import { notebookApi } from "@/api/notebook";
import { ArrowLeft } from "lucide-react";
import { FlashcardControls } from "@/components/flashcard/FlashcardControls";

// Helper to generate dynamic quiz options from vocabulary list
function generateQuizOptions(currentWord: any, allWords: any[]) {
  const correctOption = { k: "A", w: currentWord.word, m: currentWord.meaning };
  
  // Get other words as distractors
  const distractors = allWords
    .filter(w => w.word !== currentWord.word)
    .map(w => ({ w: w.word, m: w.meaning }));
    
  // Shuffle distractors
  const shuffledDistractors = distractors.sort(() => 0.5 - Math.random());
  
  // Fallback pool if not enough distractors
  const fallbackPool = [
    { w: "是", m: "Là, vâng" },
    { w: "好", m: "Tốt, khỏe" },
    { w: "不", m: "Không" },
    { w: "这", m: "Đây, này" },
    { w: "我", m: "Tôi, tớ" },
    { w: "你", m: "Bạn, cậu" },
    { w: "he", m: "Anh ấy" },
    { w: "she", m: "Cô ấy" },
    { w: "我们", m: "Chúng tôi" },
  ];
  
  const optionsList = [correctOption];
  let distractorIdx = 0;
  
  while (optionsList.length < 4) {
    if (distractorIdx < shuffledDistractors.length) {
      const dist = shuffledDistractors[distractorIdx++];
      if (!optionsList.some(o => o.w === dist.w)) {
        optionsList.push({ k: "", w: dist.w, m: dist.m });
      }
    } else {
      const fallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      if (!optionsList.some(o => o.w === fallback.w)) {
        optionsList.push({ k: "", w: fallback.w, m: fallback.m });
      }
    }
  }
  
  // Shuffle all 4 options
  const finalOptions = optionsList.sort(() => 0.5 - Math.random());
  
  // Assign keys A, B, C, D
  return finalOptions.map((opt, idx) => ({
    k: ["A", "B", "C", "D"][idx],
    w: opt.w,
    m: opt.m
  }));
}

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("notebook") || "Thanh Hà";

  // Mode: "flashcard" | "quiz"
  const [mode, setMode] = useState<"flashcard" | "quiz">("flashcard");
  
  // Stats
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Active word index
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  const mockWords = [
    { word: "爱", pinyin: "ài", meaning: "Yêu" },
    { word: "学习", pinyin: "xuéxí", meaning: "Học tập" },
    { word: "漂亮", pinyin: "piàoliang", meaning: "Xinh đẹp" },
  ];

  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotebookWords = async () => {
      setLoading(true);
      try {
        // 1. Get user personal notebooks
        const personalDecks = await notebookApi.getPersonalNotebooks();
        
        // Find matching notebook by title search param
        const matchedDeck = personalDecks.find(
          (deck) => deck.title.toLowerCase() === title.toLowerCase()
        ) || personalDecks[0];
        
        if (matchedDeck) {
          // 2. Fetch list of vocab items inside the notebook
          const response = await notebookApi.getListVocabByIdFlashcardDeck(matchedDeck.id);
          const rawItems = Array.isArray(response) ? response : [];
          
          if (rawItems.length > 0) {
            // Map raw database items to our study format
            const mappedWords = rawItems.map((item: any) => {
              const vocab = item.vocab_items_id;
              return {
                word: vocab?.name || "",
                pinyin: vocab?.pinyin || "",
                meaning: vocab?.note || vocab?.senses?.[0]?.meaning_vi || "Chưa có nghĩa",
              };
            }).filter(w => w.word !== "");
            
            if (mappedWords.length > 0) {
              // Build the final list with generated quiz options
              const finalWords = mappedWords.map((w) => ({
                ...w,
                options: generateQuizOptions(w, mappedWords),
              }));
              
              setWords(finalWords);
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.error("Failed to load dynamic words from database:", e);
      }
      
      // Fallback to static mockWords if loading fails or no words found
      const fallbackWords = mockWords.map((w) => ({
        ...w,
        options: generateQuizOptions(w, mockWords),
      }));
      setWords(fallbackWords);
      setLoading(false);
    };

    loadNotebookWords();
  }, [title]);

  const currentItem = words[currentIndex % Math.max(1, words.length)] || { word: "", pinyin: "", meaning: "", options: [] };

  const handleNext = (isMastered: boolean) => {
    if (isMastered) {
      setMasteredCount((c) => c + 1);
    } else {
      setReviewCount((c) => c + 1);
    }
    
    // Check if it is the last item
    const isLast = currentIndex >= words.length - 1;
    if (isLast && words.length > 0) {
      const finalKnown = isMastered ? masteredCount + 1 : masteredCount;
      const finalUnknown = isMastered ? reviewCount : reviewCount + 1;
      
      const searchParams = new URLSearchParams({
        known: String(finalKnown),
        unknown: String(finalUnknown),
        total: String(words.length),
        type: "personal",
      });
      router.replace(`/flashcard/results?${searchParams.toString()}`);
      return;
    }

    setIsFlipped(false);
    setQuizSelected(null);
    setCurrentIndex((i) => i + 1);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (words.length === 0) return;
      if (e.code === "Space" && mode === "flashcard") {
        e.preventDefault();
        setIsFlipped((f) => !f);
        speakChinese(currentItem.word);
      } else if ((e.code === "ArrowRight" || e.code === "Digit1") && mode === "flashcard") {
        handleNext(true);
      } else if ((e.code === "ArrowLeft" || e.code === "Digit2") && mode === "flashcard") {
        handleNext(false);
      } else if (e.code === "ArrowDown" && currentIndex > 0) {
        setIsFlipped(false);
        setQuizSelected(null);
        setCurrentIndex((i) => i - 1);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, currentItem, mode, words, masteredCount, reviewCount]);

  // Speak word when loaded
  useEffect(() => {
    if (currentItem?.word) {
      speakChinese(currentItem.word);
    }
  }, [currentIndex, currentItem]);

  const isSystemDeck = title.includes("HSK") || title.includes("TOCFL") || title === "Địa điểm" || title === "Thói quen";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
        <div className="p-6 md:p-8 space-y-6 max-w-3xl w-full mx-auto flex-1 flex flex-col justify-start pb-20">
          
          {/* Header Title block */}
          <div className="bg-[#f59e0b] text-gray-950 font-black py-4 px-6 rounded-2xl text-center shadow-xs text-sm uppercase tracking-wide">
            {title}
          </div>

          {/* Stats indicators and Mode Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-zinc-150 dark:border-zinc-800 pb-3">
            <div className="flex gap-3 justify-center md:justify-start">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-bold px-3 py-1.5 rounded-xl text-xs">
                Đã thuộc {masteredCount}
              </span>
              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-500 font-bold px-3 py-1.5 rounded-xl text-xs">
                Cần ôn {reviewCount}
              </span>
            </div>

            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner md:col-span-1">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0}%` }}
              />
            </div>

            <div className="flex gap-2 justify-center md:justify-end">
              <button
                onClick={() => {
                  setMode("flashcard");
                  setIsFlipped(false);
                  setQuizSelected(null);
                }}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  mode === "flashcard"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Flashcard
              </button>
              <button
                onClick={() => {
                  setMode("quiz");
                  setIsFlipped(false);
                  setQuizSelected(null);
                }}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                  mode === "quiz"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Đáp án
              </button>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-bold text-center select-none">
            Tiến trình: {currentIndex + 1} / {words.length}
          </div>

          {/* Card Box container */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 bg-white dark:bg-zinc-900 shadow-sm relative flex flex-col justify-between min-h-[340px] transition-all">
            
            {/* Plus icon for system decks */}
            {isSystemDeck && (
              <button
                onClick={() => alert(`Đã thêm từ "${currentItem.word}" vào sổ tay cá nhân!`)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-amber-500 font-bold text-xl cursor-pointer z-10 p-2"
              >
                +
              </button>
            )}

            {/* FLASHCARD MODE */}
            {mode === "flashcard" && (
              <div className="flex-1 flex flex-col justify-between items-center w-full text-center gap-6">
                <div className="flex-1 flex flex-col justify-center py-4">
                  <h2 className="text-6xl font-black text-zinc-900 dark:text-white select-all tracking-wider">
                    {currentItem.word}
                  </h2>
                  
                  {isFlipped && (
                    <div className="mt-6 space-y-2 border-t border-zinc-100 dark:border-zinc-850 pt-4">
                      <p className="text-sm font-semibold text-zinc-400 font-mono tracking-wide">{currentItem.pinyin}</p>
                      <p className="text-lg font-extrabold text-[#d97706] tracking-wide">{currentItem.meaning}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QUIZ MODE */}
            {mode === "quiz" && (
              <div className="flex-1 flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-black text-zinc-800 dark:text-zinc-200 text-sm tracking-wide">
                    Từ nào dưới đây có nghĩa là &quot;{currentItem.meaning.toLowerCase()}&quot;?
                  </h3>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentItem.options?.map((opt: any) => {
                    const isSelected = quizSelected === opt.k;
                    const isCorrectOption = opt.m === currentItem.meaning;
                    let btnStyle = "border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-300 hover:bg-amber-50/10";

                    if (isSelected) {
                      if (isCorrectOption) {
                        btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500";
                      } else {
                        btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500";
                      }
                    } else if (quizSelected && isCorrectOption) {
                      btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300";
                    }

                    return (
                      <button
                        key={opt.k}
                        type="button"
                        disabled={!!quizSelected}
                        onClick={() => {
                          if (!quizSelected) {
                            setQuizSelected(opt.k);
                            speakChinese(opt.w);
                            if (isCorrectOption) {
                              setTimeout(() => handleNext(true), 1500);
                            }
                          }
                        }}
                        className={`flex items-center gap-3.5 p-5 rounded-2xl border font-bold text-left transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer shadow-xs ${btnStyle}`}
                      >
                        <span className="font-black px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{opt.k}</span>
                        <span className="text-zinc-850 dark:text-zinc-150 font-extrabold">{opt.w}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Controls Nav Bar */}
            <FlashcardControls
              mode={mode}
              onNext={(status) => handleNext(status === "mastered")}
              onPrevious={() => {
                if (currentIndex > 0) {
                  setIsFlipped(false);
                  setQuizSelected(null);
                  setCurrentIndex((i) => i - 1);
                }
              }}
              onFlip={() => {
                setIsFlipped(!isFlipped);
                speakChinese(currentItem.word);
              }}
              onPronounce={() => speakChinese(currentItem.word)}
              currentIndex={currentIndex}
              isFirst={currentIndex === 0}
            />
          </div>

          {/* Add New Word Button */}
          {!isSystemDeck && (
            <button
              onClick={() => router.push(`/flashcard/add?notebook=${encodeURIComponent(title)}`)}
              className="w-full bg-[#f59e0b] hover:bg-amber-600 text-gray-950 font-black py-3.5 px-6 rounded-2xl text-center shadow-xs text-sm uppercase tracking-wide cursor-pointer transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Thêm từ mới vào sổ tay
            </button>
          )}

          {/* Back link */}
          <div className="flex justify-start w-full pt-4">
            <button
              onClick={() => router.push("/flashcard")}
              className="text-xs font-black text-zinc-400 hover:text-amber-600 dark:text-zinc-550 dark:hover:text-amber-500 cursor-pointer bg-transparent border-none flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Về sổ tay cá nhân
            </button>
          </div>

        </div>
      </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    }>
      <StudyContent />
    </Suspense>
  );
}
