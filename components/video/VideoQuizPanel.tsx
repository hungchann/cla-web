"use client";

import { useMemo } from "react";
import { speakChinese } from "@/lib/utils/speech";
import { Check, X, Timer, PartyPopper } from "lucide-react";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";

export interface ExerciseItem {
  id: number;
  question: string;
  time_start?: string;
  time_end?: string;
  sort_id?: number | string;
  [key: string]: any;
}

interface VideoQuizPanelProps {
  exerciseData?: ExerciseItem[] | null;
  activeQuestion?: ExerciseItem | null;
  activeEx?: ExerciseItem | null;
  answeredIds?: number[];
  answerResults?: any[];
  nextQuestionId?: number | null;
  hasCompletedAll?: boolean;
  totalExercises?: number;
  onViewResults?: () => void;
  onSeek?: (timeStr: string) => void;
  onSelectQuestion?: (item: ExerciseItem) => void;
}

function formatTimestamp(val: string | number | undefined | null): string {
  if (!val) return "00:00";
  const totalSeconds = timeToSeconds(String(val));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VideoQuizPanel({
  exerciseData = [],
  activeQuestion = null,
  activeEx = null,
  answeredIds = [],
  answerResults = [],
  nextQuestionId = null,
  hasCompletedAll = false,
  totalExercises = 0,
  onViewResults,
  onSeek,
  onSelectQuestion,
}: Readonly<VideoQuizPanelProps>) {
  const questions = useMemo(() => {
    if (!exerciseData || exerciseData.length === 0) return [];
    return [...exerciseData].sort((a, b) => {
      const ta = timeToSeconds(a.time_start || "");
      const tb = timeToSeconds(b.time_start || "");
      return ta - tb;
    });
  }, [exerciseData]);

  const effectiveTotal = totalExercises > 0 ? totalExercises : questions.length;
  const answeredCount = answeredIds.length;
  const progressPercent =
    effectiveTotal > 0 ? Math.round((answeredCount / effectiveTotal) * 100) : 0;

  const currentEx = activeEx || activeQuestion;

  const renderAnsweredSentence = (item: ExerciseItem, answeredResult: any) => {
    const raw = item.question || "";
    const chosenText =
      answeredResult.yourAnswerText ||
      item[`answer_${answeredResult.yourAnswer}`] ||
      item[`Answer_${answeredResult.yourAnswer}`] ||
      answeredResult.yourAnswer ||
      "";

    const isCorrect =
      answeredResult.status === "Đúng" || answeredResult.isCorrect === true;

    const parts = raw.split(/_{2,}|\([0-9]+\)_{2,}|_{2,}\([0-9]+\)/);
    if (parts.length <= 1) {
      return (
        <span>
          {raw}{" "}
          <span
            className={`font-black px-1.5 py-0.5 rounded ${
              isCorrect
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 line-through"
            }`}
          >
            {chosenText}
          </span>
        </span>
      );
    }

    return (
      <span>
        {parts[0]}
        <span
          className={`font-black px-1.5 py-0.5 rounded mx-1 ${
            isCorrect
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 line-through"
          }`}
        >
          {chosenText}
        </span>
        {parts.slice(1).join("")}
      </span>
    );
  };

  if (effectiveTotal === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
        <p className="text-sm font-semibold">
          Chưa có câu hỏi trắc nghiệm cho video này
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* ─── Progress Bar ─── */}
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
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {questions.map((item, index) => {
          const answered = answerResults.find(
            (r) => String(r.questionId) === String(item.id)
          );
          const isActive = currentEx && String(currentEx.id) === String(item.id);
          const isNext =
            !answered &&
            (String(item.id) === String(nextQuestionId) || isActive);
          const isCorrect =
            answered &&
            (answered.status === "Đúng" || answered.isCorrect === true);

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!answered && !isActive) {
                  if (onSelectQuestion) {
                    onSelectQuestion(item);
                  } else if (onSeek) {
                    onSeek(String(item.time_start || ""));
                  }
                }
              }}
              className={`p-3 rounded-xl border transition-all text-xs ${
                isActive
                  ? "bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20"
                  : isNext
                  ? "bg-zinc-50 dark:bg-zinc-800/60 border-amber-500/30 dark:border-amber-500/30"
                  : answered
                  ? "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800"
                  : "bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/50 dark:border-zinc-800/50 opacity-75"
              } ${
                !answered && !isActive
                  ? "cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Câu {index + 1}
                    </span>
                    {(item.time_start || item.time_end) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectQuestion) {
                            onSelectQuestion(item);
                          } else if (onSeek) {
                            onSeek(String(item.time_start || item.time_end || ""));
                          }
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer border-none"
                      >
                        <Timer className="w-3 h-3 inline mr-0.5 -mt-0.5" />{" "}
                        {formatTimestamp(item.time_start || item.time_end)}
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
                        <span className="inline-flex items-center gap-0.5">
                          {isCorrect ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {isCorrect ? " Đúng" : " Sai"}
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed text-xs">
                    {answered
                      ? renderAnsweredSentence(item, answered)
                      : item.question}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakChinese(
                      String(item.question || "").replace(
                        /_{2,}|\([0-9]+\)_{2,}|_{2,}\([0-9]+\)/g,
                        " "
                      )
                    );
                  }}
                  title="Phát âm câu hỏi"
                  className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-amber-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-amber-500 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer border-none"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
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
              <PartyPopper className="w-4 h-4 inline mr-1.5" /> Xem kết quả tổng
              quan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
