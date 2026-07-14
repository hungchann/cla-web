"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { speakChinese } from "@/lib/utils/speech";

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("notebook") || "Thanh Hà";

  // Mode: "flashcard" | "quiz"
  const [mode, setMode] = useState<"flashcard" | "quiz">("flashcard");
  
  // Stats
  const [masteredCount, setMasteredCount] = useState(80);
  const [reviewCount, setReviewCount] = useState(70);

  // Active word index
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  const mockWords = [
    { word: "爱", pinyin: "ài", meaning: "Yêu", options: [{ k: "A", w: "爱", m: "Yêu" }, { k: "B", w: "很", m: "Rất" }, { k: "C", w: "不", m: "Không" }, { k: "D", w: "一", m: "Một" }] },
    { word: "学习", pinyin: "xuéxí", meaning: "Học tập", options: [{ k: "A", w: "走", m: "Đi" }, { k: "B", w: "学习", m: "Học tập" }, { k: "C", w: "看", m: "Nhìn" }, { k: "D", w: "喝", m: "Uống" }] },
    { word: "漂亮", pinyin: "piàoliang", meaning: "Xinh đẹp", options: [{ k: "A", w: "高", m: "Cao" }, { k: "B", w: "矮", m: "Thấp" }, { k: "C", w: "漂亮", m: "Xinh đẹp" }, { k: "D", w: "胖", m: "Béo" }] },
  ];

  const currentItem = mockWords[currentIndex % mockWords.length];

  const handleNext = (isMastered: boolean) => {
    if (isMastered) {
      setMasteredCount((c) => c + 1);
    } else {
      setReviewCount((c) => c + 1);
    }
    setIsFlipped(false);
    setQuizSelected(null);
    setCurrentIndex((i) => i + 1);
  };



  const isSystemDeck = title.includes("HSK") || title.includes("TOCFL") || title === "Địa điểm" || title === "Thói quen";

  return (
    <div className="flex-1 flex flex-col gap-6">
        <div className="p-6 md:p-8 space-y-6 max-w-xl w-full mx-auto flex-1 flex flex-col justify-start pb-20">
          
          {/* Header Title block (orange bar) */}
          <div className="bg-[#f59e0b] text-gray-950 font-black py-3 px-6 rounded-xl text-center shadow-xs text-sm uppercase tracking-wide">
            {title}
          </div>

          {/* Stats indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-100/60 border border-amber-200 text-amber-900 font-bold py-2.5 px-4 rounded-xl text-center text-xs">
              Đã thuộc {masteredCount}
            </div>
            <div className="bg-amber-100/60 border border-amber-200 text-amber-900 font-bold py-2.5 px-4 rounded-xl text-center text-xs">
              Cần ôn {reviewCount}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-2">
            <button
              onClick={() => {
                setMode("flashcard");
                setIsFlipped(false);
                setQuizSelected(null);
              }}
              className={`pb-2 text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                mode === "flashcard" ? "text-gray-950 border-b-2 border-gray-950" : "text-gray-400 hover:text-gray-600"
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
              className={`pb-2 text-xs font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                mode === "quiz" ? "text-gray-950 border-b-2 border-gray-950" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Chọn đáp án
            </button>
          </div>

          {/* Card Box container */}
          <div className="border border-gray-150 rounded-2xl p-6 md:p-8 bg-white shadow-2xs relative flex flex-col justify-between min-h-[220px]">
            
            {/* Plus icon on top-right of card for system decks */}
            {isSystemDeck && (
              <button
                onClick={() => alert(`Đã thêm từ "${currentItem.word}" vào sổ tay cá nhân!`)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 font-bold text-xl cursor-pointer z-10"
              >
                +
              </button>
            )}

            {/* FLASHCARD MODE */}
            {mode === "flashcard" && (
              <div className="flex-1 flex flex-col justify-between items-center w-full text-center gap-6">
                <div>
                  <h2 className="text-4xl font-extrabold text-gray-900 select-all tracking-wider">
                    {currentItem.word}
                  </h2>
                  
                  {isFlipped && (
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-mono text-gray-400">{currentItem.pinyin}</p>
                      <p className="text-base font-extrabold text-[#d97706]">{currentItem.meaning}</p>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-4">
                  <button
                    onClick={() => {
                      setIsFlipped(!isFlipped);
                      speakChinese(currentItem.word);
                    }}
                    className="border border-gray-250 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-block"
                  >
                    Lật thẻ
                  </button>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button
                      onClick={() => handleNext(true)}
                      className="border border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      Đã thuộc
                    </button>
                    <button
                      onClick={() => handleNext(false)}
                      className="border border-[#d97706] text-[#d97706] hover:bg-amber-50/50 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      Cần ôn
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ MODE */}
            {mode === "quiz" && (
              <div className="flex-1 flex flex-col justify-between gap-6">
                {/* Header question inside card */}
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="font-extrabold text-gray-800 text-sm">
                    Từ nào là &quot;{currentItem.meaning.toLowerCase()}&quot;?
                  </h3>
                  <button
                    onClick={() => alert(`Đã thêm câu hỏi từ "${currentItem.word}" vào sổ tay cá nhân!`)}
                    className="text-gray-400 text-xl font-bold cursor-pointer hover:text-gray-600"
                  >
                    +
                  </button>
                </div>

                {/* Question options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentItem.options.map((opt) => {
                    const isSelected = quizSelected === opt.k;
                    const isCorrectOption = opt.m === currentItem.meaning;
                    let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";

                    if (isSelected) {
                      if (isCorrectOption) {
                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500";
                      } else {
                        btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                      }
                    } else if (quizSelected && isCorrectOption) {
                      btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                    }

                    return (
                      <button
                        key={opt.k}
                        onClick={() => {
                          if (!quizSelected) {
                            setQuizSelected(opt.k);
                            speakChinese(opt.w);
                            // Auto trigger next after a short delay if correct
                            if (isCorrectOption) {
                              setTimeout(() => handleNext(true), 1500);
                            }
                          }
                        }}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-xs cursor-pointer ${btnStyle}`}
                      >
                        <span className="font-black text-gray-500">{opt.k}. {opt.w}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Note below card for Quiz Mode */}
          {mode === "quiz" && (
            <p className="text-[10px] text-gray-400 font-bold text-center italic leading-relaxed">
              Note: phần trắc nghiệm sẽ tự động điền nghĩa và 4 đáp án
            </p>
          )}

          {/* Add New Word Button (only visible for personal decks) */}
          {!isSystemDeck && (
            <button
              onClick={() => router.push("/flashcard/add")}
              className="w-full bg-[#f59e0b] hover:bg-amber-600 text-gray-950 font-black py-3 px-6 rounded-xl text-center shadow-xs text-sm uppercase tracking-wide cursor-pointer transition-all active:scale-[0.99]"
            >
              Thêm từ mới
            </button>
          )}

          {/* Back link */}
          <div className="flex justify-start w-full pt-4">
            <button
              onClick={() => router.push("/flashcard")}
              className="text-xs font-black text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              &larr; Về sổ tay cá nhân
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
