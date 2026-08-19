"use client";

import { Check, X } from "lucide-react";

interface VideoQuizSectionProps {
  activeQuestion: any;
  activeEx: any;
  selectedAnswer: string | number | null;
  setSelectedAnswer: (ans: string | number | null) => void;
  isAnswerChecked: boolean;
  isAnswerCorrect: boolean | null;
  handleAnswerSubmit: () => void;
  handleContinueVideo: () => void;
  getOptions: (ex: any) => any[];
}

export function VideoQuizSection({
  activeQuestion,
  activeEx,
  selectedAnswer,
  setSelectedAnswer,
  isAnswerChecked,
  isAnswerCorrect,
  handleAnswerSubmit,
  handleContinueVideo,
  getOptions,
}: Readonly<VideoQuizSectionProps>) {
  if (!activeQuestion || !activeEx) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
          Hiện tại không có câu hỏi dừng video nào đang chờ.
        </p>
        <p className="text-[10px] text-zinc-400/70 mt-1">
          Khi video phát tới mốc câu hỏi, tab này sẽ tự động kích hoạt.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto mt-1">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-zinc-900 dark:text-white leading-relaxed">
            {activeEx.question}
          </p>
        </div>

        {/* Options list */}
        <div className="flex flex-col gap-2">
          {getOptions(activeEx).map((opt: any) => {
            const isSelected = selectedAnswer === opt.id;
            
            let btnStyle = "";
            if (isAnswerChecked) {
              if (opt.isCorrect) {
                btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/25";
              } else if (isSelected) {
                btnStyle = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/25";
              } else {
                btnStyle = "bg-zinc-50/50 border-zinc-150 text-zinc-400 dark:bg-zinc-900/20 dark:border-zinc-800 dark:text-zinc-600 opacity-60";
              }
            } else if (isSelected) {
              btnStyle = "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/20 dark:border-amber-500 dark:text-amber-400 ring-2 ring-amber-500/25";
            } else {
              btnStyle = "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-300 dark:hover:border-amber-500";
            }

            let checkIcon = null;
            if (isAnswerChecked) {
              if (opt.isCorrect) {
                checkIcon = <Check className="text-emerald-500 w-3.5 h-3.5 shrink-0" />;
              } else if (isSelected) {
                checkIcon = <X className="text-rose-500 w-3.5 h-3.5 shrink-0" />;
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => !isAnswerChecked && setSelectedAnswer(opt.id)}
                disabled={isAnswerChecked}
                className={`w-full py-2.5 px-4 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span>
                  {opt.id}. {opt.hanzi} {opt.pinyin && `(${opt.pinyin})`}
                </span>
                {checkIcon}
              </button>
            );
          })}
        </div>

        {/* Result notification */}
        {isAnswerChecked && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            isAnswerCorrect ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}>
            {isAnswerCorrect ? "Chính xác! Bạn học rất tốt." : "Chưa đúng rồi! Ôn tập lại nhé."}
          </div>
        )}
      </div>

      {/* Submit / Continue Buttons */}
      <div className="mt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-3 shrink-0">
        {!isAnswerChecked ? (
          <button
            onClick={handleAnswerSubmit}
            disabled={selectedAnswer === null}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed text-white py-2.5 text-xs font-extrabold transition-all cursor-pointer border-none shadow-sm active:scale-[0.98]"
          >
            Nộp câu trả lời
          </button>
        ) : (
          <button
            onClick={handleContinueVideo}
            className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-white py-2.5 text-xs font-extrabold transition-all cursor-pointer border-none shadow-sm active:scale-[0.98]"
          >
            Tiếp tục xem video
          </button>
        )}
      </div>
    </div>
  );
}
