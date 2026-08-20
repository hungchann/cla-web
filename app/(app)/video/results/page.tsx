"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, RotateCcw, ArrowLeft, Award, BookOpen, Clock } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";

function formatTimestamp(val: string | number | undefined | null): string {
  if (!val) return "00:00";
  const s = timeToSeconds(String(val));
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function VideoResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const resultsParam = searchParams.get("results");
  const videoParam = searchParams.get("video");

  const results: any[] = useMemo(() => {
    if (!resultsParam) return [];
    try {
      return JSON.parse(resultsParam);
    } catch {
      return [];
    }
  }, [resultsParam]);

  const videoData: any = useMemo(() => {
    if (!videoParam) return null;
    try {
      return JSON.parse(videoParam);
    } catch {
      return null;
    }
  }, [videoParam]);

  const total = results.length;
  const correctCount = results.filter(
    (r) => r.status === "Đúng" || r.isCorrect === true
  ).length;
  const incorrectCount = total - correctCount;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const handleRestart = () => {
    if (videoData?.id) {
      router.replace(`/video/${videoData.id}`);
    } else {
      router.replace("/video");
    }
  };

  return (
    <PageContainer maxWidth="default" className="gap-8 py-6">
      {/* Back button */}
      <div className="w-full flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Link
          href={videoData?.id ? `/video/${videoData.id}` : "/video"}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại video bài học
        </Link>
        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Kết quả trắc nghiệm
        </span>
      </div>

      {/* Header Banner */}
      <div className="w-full flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
          <Award className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          {percent >= 80 ? "Xuất sắc! Hoàn thành xuất sắc!" : percent >= 50 ? "Làm tốt lắm! Đã hoàn thành bài học." : "Cần cố gắng thêm!"}
        </h1>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 max-w-lg">
          {videoData?.title ? `Bài giảng: "${videoData.title}"` : "Bạn đã hoàn thành các câu hỏi trắc nghiệm tương tác trong video."}
        </p>
      </div>

      {/* Score Overview Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Accuracy Circle / Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-amber-600 dark:text-amber-400">{percent}%</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">
            Độ chính xác
          </span>
        </div>

        {/* Correct Answers */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{correctCount}</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Câu trả lời đúng
          </span>
        </div>

        {/* Incorrect Answers */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-rose-600 dark:text-rose-400">{incorrectCount}</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Câu trả lời sai
          </span>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="w-full flex flex-col gap-4">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Chi tiết từng câu hỏi ({results.length} câu)
        </h2>

        {results.length === 0 ? (
          <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center text-zinc-400 text-sm font-semibold">
            Chưa có dữ liệu bài làm trắc nghiệm.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((item, idx) => {
              const isCorrect = item.status === "Đúng" || item.isCorrect === true;
              return (
                <div
                  key={item.questionId || idx}
                  className={`p-4 rounded-2xl border transition-all text-xs flex flex-col gap-2.5 ${
                    isCorrect
                      ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20"
                      : "bg-rose-500/5 border-rose-500/30 dark:bg-rose-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-zinc-400 dark:text-zinc-500 uppercase">
                        Câu {idx + 1}
                      </span>
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isCorrect
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {isCorrect ? "Đúng" : "Sai"}
                      </span>
                    </div>

                    {item.time_start && (
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTimestamp(item.time_start)}
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {item.question || `Câu hỏi #${item.questionId}`}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-200/40 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      Đáp án của bạn:{" "}
                      <strong
                        className={`font-black ${
                          isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {item.yourAnswer || item.answer || item.answerText || "—"} {item.answerText && item.yourAnswer !== item.answerText ? `(${item.answerText})` : ""}
                      </strong>
                    </span>

                    {!isCorrect && item.correctAnswer && (
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        Đáp án đúng:{" "}
                        <strong className="font-black text-emerald-600 dark:text-emerald-400">
                          {item.correctAnswer}
                        </strong>
                      </span>
                    )}

                    {item.explanation && item.explanation !== "Không có giải thích" && (
                      <p className="w-full text-xs italic text-zinc-500 dark:text-zinc-400 pt-1">
                        Giải thích: {item.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleRestart}
          className="flex-1 py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm transition-all shadow-md shadow-amber-600/10 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] border-none"
        >
          <RotateCcw className="w-4 h-4" /> Xem và làm lại bài này
        </button>

        <Link
          href="/video"
          className="flex-1 py-3 px-6 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-extrabold text-sm dark:border-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-all text-center flex items-center justify-center"
        >
          Danh sách video khác
        </Link>
      </div>
    </PageContainer>
  );
}

export default function VideoResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        </div>
      }
    >
      <VideoResultsContent />
    </Suspense>
  );
}
