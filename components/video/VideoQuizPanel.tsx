"use client";

import { useMemo, useState } from "react";
import { speakChinese } from "@/lib/utils/speech";

export interface ExerciseItem {
  id: number;
  question: string;
  answer_A?: string;
  answer_B?: string;
  answer_C?: string;
  answer_D?: string;
  Correct_answer?: string;
  time_start?: string;
  time_end?: string;
  sort_id?: number | string;
  [key: string]: any;
}

interface VideoQuizPanelProps {
  exerciseData?: ExerciseItem[] | null;
  activeQuestion: ExerciseItem | null;
  activeEx?: ExerciseItem | null;
  answeredIds?: number[];
  answerResults?: any[];
  showResult?: boolean;
  nextQuestionId?: number | null;
  hasCompletedAll?: boolean;
  totalExercises?: number;
  getOptions?: (ex: any) => any[];
  onSubmit: (answer: string) => Promise<any>;
  onContinue: () => void;
  onViewResults?: () => void;
  onSeek?: (timeStr: string) => void;
}

export function VideoQuizPanel({
  exerciseData = [],
  activeQuestion,
  activeEx,
  answeredIds = [],
  answerResults = [],
  showResult = false,
  nextQuestionId = null,
  hasCompletedAll = false,
  totalExercises = 0,
  getOptions,
  onSubmit,
  onContinue,
  onViewResults,
  onSeek,
}: Readonly<VideoQuizPanelProps>) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useMemo(() => {
    if (Array.isArray(exerciseData) && exerciseData.length > 0) {
      return exerciseData;
    }
    return [];
  }, [exerciseData]);

  const effectiveTotal = questions.length || totalExercises;
  const answeredCount = answeredIds.length;
  const progressPercent = effectiveTotal > 0 ? Math.round((answeredCount / effectiveTotal) * 100) : 0;

  // Lấy các lựa chọn của câu hỏi active
  const currentEx = activeEx || activeQuestion;
  const currentOptions = useMemo(() => {
    if (!currentEx) return [];
    if (getOptions) {
      return getOptions(currentEx);
    }
    const opts = [];
    const ansA = currentEx.answer_A || currentEx.Answer_A || currentEx.answerA || currentEx.answer_a;
    const ansB = currentEx.answer_B || currentEx.Answer_B || currentEx.answerB || currentEx.answer_b;
    const ansC = currentEx.answer_C || currentEx.Answer_C || currentEx.answerC || currentEx.answer_c;
    const ansD = currentEx.answer_D || currentEx.Answer_D || currentEx.answerD || currentEx.answer_d;
    if (ansA) opts.push({ id: "A", hanzi: ansA, isCorrect: currentEx.Correct_answer === "A" });
    if (ansB) opts.push({ id: "B", hanzi: ansB, isCorrect: currentEx.Correct_answer === "B" });
    if (ansC) opts.push({ id: "C", hanzi: ansC, isCorrect: currentEx.Correct_answer === "C" });
    if (ansD) opts.push({ id: "D", hanzi: ansD, isCorrect: currentEx.Correct_answer === "D" });
    return opts;
  }, [currentEx, getOptions]);

  const handleSelectOption = async (optionKey: string) => {
    if (isSubmitting || showResult) return;
    setSelectedAnswer(optionKey);
    setIsSubmitting(true);
    try {
      await onSubmit(optionKey);
    } finally {
      setIsSubmitting(false);
      setSelectedAnswer(null);
    }
  };

  const renderAnsweredSentence = (item: ExerciseItem, result: any) => {
    if (!result) return item.question;
    const isCorrect = result.status === "Đúng" || result.isCorrect === true;
    const answerText = result.answerText || result.yourAnswer || "";

    if (item.question.includes("____")) {
      const parts = item.question.split("____");
      return (
        <span>
          {parts[0]}
          <span
            className={`font-black px-1.5 py-0.5 mx-1 rounded border text-xs inline-block ${
              isCorrect
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 line-through"
            }`}
          >
            {answerText}
          </span>
          {!isCorrect && result.correctAnswer && (
            <span className="font-black px-1.5 py-0.5 mx-1 rounded border text-xs inline-block bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              {item[`answer_${result.correctAnswer}`] || result.correctAnswer}
            </span>
          )}
          {parts[1]}
        </span>
      );
    }

    return (
      <span>
        {item.question}{" "}
        <span
          className={`font-bold text-xs ${
            isCorrect ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          ({answerText})
        </span>
      </span>
    );
  };

  // 1. Trường hợp video không có bất kỳ câu hỏi nào
  if (effectiveTotal === 0 && !currentEx) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Video này chưa có câu hỏi trắc nghiệm tương tác
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Bạn có thể chuyển sang tab Phụ đề để học từ vựng hoặc luyện Shadowing câu thoại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* ─── Header: Progress Bar ─── */}
      <div className="pb-3 mb-2 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-zinc-600 dark:text-zinc-400">
            Tiến độ bài tập ({answeredCount}/{effectiveTotal})
          </span>
          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-[11px]">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ─── Question List (Scrollable) ─── */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pb-24">
        {questions.map((item, index) => {
          const answered = answerResults.find((r) => String(r.questionId) === String(item.id));
          const isActive = currentEx && String(currentEx.id) === String(item.id);
          const isNext = !answered && (String(item.id) === String(nextQuestionId) || isActive);
          const isCorrect = answered && (answered.status === "Đúng" || answered.isCorrect === true);

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all text-xs ${
                isActive
                  ? "bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20"
                  : isNext
                  ? "bg-zinc-50 dark:bg-zinc-800/60 border-amber-500/30 dark:border-amber-500/30"
                  : answered
                  ? "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800"
                  : "bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/50 dark:border-zinc-800/50 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Câu {index + 1}
                    </span>
                    {item.time_end && (
                      <button
                        type="button"
                        onClick={() => onSeek?.(String(item.time_start || item.time_end || ""))}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer border-none"
                      >
                        ⏱ {item.time_start?.slice(3, 8) || item.time_end?.slice(3, 8)}
                      </button>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        Đang làm
                      </span>
                    )}
                    {answered && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          isCorrect
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isCorrect ? "✓ Đúng" : "✗ Sai"}
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed text-xs">
                    {answered ? renderAnsweredSentence(item, answered) : item.question}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => speakChinese(String(item.question || "").replace(/____/g, ""))}
                  title="Phát âm câu hỏi"
                  className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-amber-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-amber-500 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer border-none"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5 9.77H8l-4 4V7l4 4h3.5v2z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {/* Nút xem kết quả khi hoàn thành toàn bộ */}
        {hasCompletedAll && onViewResults && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onViewResults}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer border-none active:scale-[0.98]"
            >
              🎉 Xem kết quả tổng quan
            </button>
          </div>
        )}
      </div>

      {/* ─── Active Quiz Interactive Floating Panel (Khi video dừng tại mốc câu hỏi) ─── */}
      {currentEx && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-3.5 shadow-2xl rounded-t-2xl z-20 flex flex-col gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Chọn đáp án đúng điền vào chỗ trống
            </span>
            <button
              type="button"
              onClick={onContinue}
              className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer bg-transparent border-none"
            >
              Bỏ qua →
            </button>
          </div>

          <p className="text-xs font-black text-zinc-900 dark:text-zinc-50 leading-relaxed line-clamp-2">
            {currentEx.question}
          </p>

          {/* Grid các lựa chọn A, B, C, D */}
          <div className="grid grid-cols-2 gap-2">
            {currentOptions.map((opt: any) => {
              const activeResult = answerResults.find(
                (r) => String(r.questionId) === String(currentEx.id),
              );
              const isSelected = selectedAnswer === opt.id || activeResult?.yourAnswer === opt.id;

              let btnStyle =
                "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700";

              if (showResult && activeResult) {
                if (opt.id === activeResult.yourAnswer) {
                  if (activeResult.status === "Đúng" || activeResult.isCorrect === true) {
                    btnStyle =
                      "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30";
                  } else {
                    btnStyle =
                      "bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30";
                  }
                } else if (
                  (activeResult.status === "Sai" || activeResult.isCorrect === false) &&
                  opt.id === activeResult.correctAnswer
                ) {
                  btnStyle =
                    "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30";
                } else {
                  btnStyle = "opacity-40 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent";
                }
              } else if (isSelected) {
                btnStyle =
                  "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={showResult || isSubmitting}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer active:scale-95 disabled:cursor-default ${btnStyle}`}
                >
                  <span className="truncate">
                    <strong className="mr-1 text-zinc-400">{opt.id}.</strong> {opt.hanzi}
                  </span>
                  {showResult && activeResult && opt.id === activeResult.yourAnswer && (
                    <span className="text-xs font-black">
                      {activeResult.status === "Đúng" || activeResult.isCorrect === true ? "✓" : "✗"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback banner sau khi bấm chọn */}
          {showResult && (
            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ Đang tiếp tục video...
              </span>
              <button
                type="button"
                onClick={onContinue}
                className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer bg-transparent border-none"
              >
                Tiếp tục ngay →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
