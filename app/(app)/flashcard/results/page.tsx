"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function FlashcardResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const known = Number(searchParams.get("known")) || 0;
  const unknown = Number(searchParams.get("unknown")) || 0;
  const total = Number(searchParams.get("total")) || 0;
  
  const notebookId = searchParams.get("notebookId") || "";
  const topicId = searchParams.get("topicId") || "";
  const type = searchParams.get("type") || "";

  const percent = total > 0 ? Math.round((known / total) * 100) : 0;

  const handleRestart = () => {
    const params = new URLSearchParams({
      type,
      notebookId,
      topicId,
      restart: "true",
    });
    router.replace(`/flashcard?${params.toString()}`);
  };



  return (
    <div className="flex-1 flex flex-col gap-6">
        <div className="flex-1 flex flex-col gap-8 py-12 max-w-xl mx-auto w-full items-center text-center px-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Hoàn Thành Ôn Tập!</h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bạn đã hoàn thành toàn bộ lượt ôn tập từ vựng này.</p>
          </div>

          {/* Circle Progress Chart */}
          <div className="relative flex items-center justify-center h-52 w-52 bg-white dark:bg-zinc-900 rounded-full shadow-2xs border border-zinc-100 dark:border-zinc-800/80 p-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-zinc-100 dark:text-zinc-800"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={263.89}
                strokeDashoffset={263.89 - (263.89 * percent) / 100}
                className="text-amber-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            {/* Percentage Label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-zinc-900 dark:text-white">{percent}%</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Độ chính xác</span>
            </div>
          </div>

          {/* Stats Breakdown */}
          <div className="w-full grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs hover:shadow-sm transition-all duration-300">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Thuộc (Mastered)</p>
              <p className="text-3xl font-black text-emerald-500 mt-1.5">{known} từ</p>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs hover:shadow-sm transition-all duration-300">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cần ôn (Review)</p>
              <p className="text-3xl font-black text-rose-500 mt-1.5">{unknown} từ</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleRestart}
              className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 text-sm font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer active:scale-[0.99]"
            >
              Học lại deck này
            </button>

            <Link
              href="/flashcard"
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 py-3 px-6 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-850 dark:text-zinc-300 transition-all text-center flex items-center justify-center cursor-pointer"
            >
              Quay lại Flashcard
            </Link>
          </div>
      </div>
    </div>
  );
}

export default function FlashcardResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    }>
      <FlashcardResultsContent />
    </Suspense>
  );
}
