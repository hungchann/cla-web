"use client";

import { useMemo, useState } from "react";
import { speakChinese } from "@/lib/utils/speech";
import { Check, X, Volume2, ArrowRight, XCircle, Send } from "lucide-react";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";

interface VideoQuizOverlayProps {
  activeQuestion: any;
  showResult: boolean;
  answerResults: any[];
  getOptions?: (ex: any) => any[];
  onSubmit: (key: string) => Promise<any>;
  onContinue: () => void;
}

function formatTime(val: string | number | undefined | null): string {
  if (!val) return "00:00";
  const s = timeToSeconds(String(val));
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function VideoQuizOverlay({
  activeQuestion,
  showResult,
  answerResults,
  getOptions,
  onSubmit,
  onContinue,
}: Readonly<VideoQuizOverlayProps>) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = useMemo(() => {
    if (!activeQuestion) return [];
    if (getOptions) {
      return getOptions(activeQuestion);
    }
    const opts = [];
    const ansA = activeQuestion.answer_A || activeQuestion.Answer_A || activeQuestion.option_A;
    const ansB = activeQuestion.answer_B || activeQuestion.Answer_B || activeQuestion.option_B;
    const ansC = activeQuestion.answer_C || activeQuestion.Answer_C || activeQuestion.option_C;
    const ansD = activeQuestion.answer_D || activeQuestion.Answer_D || activeQuestion.option_D;

    if (ansA) opts.push({ id: "A", hanzi: ansA });
    if (ansB) opts.push({ id: "B", hanzi: ansB });
    if (ansC) opts.push({ id: "C", hanzi: ansC });
    if (ansD) opts.push({ id: "D", hanzi: ansD });
    return opts;
  }, [activeQuestion, getOptions]);

  if (!activeQuestion) return null;

  const activeResult = answerResults.find(
    (r) => String(r.questionId) === String(activeQuestion.id)
  );

  const handleSelectOption = (optId: string) => {
    if (showResult || isSubmitting) return;
    setSelectedKey(optId);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedKey || isSubmitting || showResult) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedKey);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCorrect =
    activeResult &&
    (activeResult.status === "Đúng" || activeResult.isCorrect === true);

  return (
    <div className="absolute inset-0 z-30 bg-zinc-950/85 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
      {/* Top bar: Question indicator & skip */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400">
            Trắc nghiệm dừng video ({formatTime(activeQuestion.time_start)})
          </span>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none"
        >
          <XCircle className="w-4 h-4" /> Bỏ qua
        </button>
      </div>

      {/* Main question box */}
      <div className="my-auto flex flex-col items-center text-center gap-4 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-center gap-3">
          <p className="text-lg sm:text-2xl font-black text-zinc-50 leading-relaxed">
            {activeQuestion.question}
          </p>
          <button
            type="button"
            onClick={() =>
              speakChinese(
                String(activeQuestion.question || "").replace(
                  /_{2,}|\([0-9]+\)_{2,}|_{2,}\([0-9]+\)/g,
                  " "
                )
              )
            }
            title="Nghe phát âm câu hỏi"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-amber-500 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer border-none"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
          {options.map((opt: any) => {
            const isSelected =
              selectedKey === opt.id || activeResult?.yourAnswer === opt.id;

            let btnStyle =
              "bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-amber-400/50";

            if (showResult && activeResult) {
              if (opt.id === activeResult.yourAnswer) {
                if (isCorrect) {
                  btnStyle =
                    "bg-emerald-600/90 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-900/40";
                } else {
                  btnStyle =
                    "bg-rose-600/90 text-white border-rose-400 ring-2 ring-rose-400/50 shadow-lg shadow-rose-900/40";
                }
              } else if (!isCorrect && opt.id === activeResult.correctAnswer) {
                btnStyle =
                  "bg-emerald-600/90 text-white border-emerald-400 ring-2 ring-emerald-400/50 animate-pulse";
              } else {
                btnStyle =
                  "opacity-30 bg-white/5 border-transparent text-zinc-400";
              }
            } else if (isSelected) {
              btnStyle =
                "bg-amber-500 text-zinc-950 border-amber-400 ring-2 ring-amber-400 font-extrabold shadow-md shadow-amber-500/30";
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={showResult || isSubmitting}
                onClick={() => handleSelectOption(opt.id)}
                className={`py-3.5 px-4 rounded-xl border text-sm sm:text-base font-black transition-all flex items-center justify-between cursor-pointer active:scale-98 disabled:cursor-default ${btnStyle}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected && !showResult
                        ? "bg-zinc-950 text-amber-400"
                        : "bg-black/20"
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="truncate">{opt.hanzi || opt.val}</span>
                </div>

                {showResult && activeResult && opt.id === activeResult.yourAnswer && (
                  <span className="shrink-0 ml-2">
                    {isCorrect ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <X className="w-5 h-5 text-white" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar feedback & confirmation */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
        {showResult && activeResult ? (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-emerald-400 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Chính xác! Rất tốt!
              </span>
            ) : (
              <span className="text-rose-400 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <X className="w-4 h-4" /> Chưa chính xác. Đáp án đúng là{" "}
                {activeResult.correctAnswer}.
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-400 font-semibold">
            {selectedKey
              ? `Đã chọn (${selectedKey}). Bấm Xác nhận để nộp bài.`
              : "Chọn 1 đáp án bên trên để xác nhận"}
          </span>
        )}

        <div className="flex items-center gap-2">
          {showResult ? (
            <button
              type="button"
              onClick={onContinue}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-md shadow-amber-500/20 active:scale-95"
            >
              Tiếp tục xem video <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!selectedKey || isSubmitting}
              onClick={handleConfirmSubmit}
              className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 border-none shadow-md active:scale-95 ${
                selectedKey && !isSubmitting
                  ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 cursor-pointer shadow-amber-500/25"
                  : "bg-white/10 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />{" "}
              {isSubmitting ? "Đang kiểm tra..." : "Xác nhận đáp án"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
