"use client";

import React from "react";

interface BilingualShadowingProps {
  shadowingEntry: any;
  shadowState: "idle" | "recording" | "done";
  shadowSeconds: number;
  setShadowState: (state: "idle" | "recording" | "done") => void;
  onSpeakWord: (text: string) => void;
}

export function BilingualShadowing({
  shadowingEntry,
  shadowState,
  shadowSeconds,
  setShadowState,
  onSpeakWord,
}: BilingualShadowingProps) {
  const defaultEntry = shadowingEntry || {
    chinese: "面对同辈压力，核心 is 建立自我坐标系。",
    vietnamese: "Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình.",
  };

  return (
    <div className="border border-amber-500/35 dark:border-amber-500/20 rounded-2xl p-6 bg-white dark:bg-zinc-900 shadow-2xs text-center space-y-6">
      <h3 className="text-lg font-black text-zinc-900 dark:text-white">Shadowing</h3>

      <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-4 max-w-md mx-auto">
        <div className="text-left">
          <p className="text-sm font-black text-amber-700 dark:text-amber-500 tracking-wide leading-relaxed">
            {defaultEntry.chinese}
          </p>
          <p className="text-xs font-bold text-zinc-450 dark:text-zinc-555 mt-1">
            {defaultEntry.vietnamese}
          </p>
        </div>
        <button
          onClick={() => onSpeakWord(defaultEntry.chinese)}
          className="w-9 h-9 border border-amber-250 dark:border-zinc-700 hover:bg-amber-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 cursor-pointer active:scale-90 bg-transparent shrink-0"
        >
          🔊
        </button>
      </div>

      {/* Microphone Recording Component */}
      <div className="flex flex-col items-center gap-3">
        {shadowState === "idle" && (
          <button
            onClick={() => setShadowState("recording")}
            className="w-16 h-16 bg-zinc-900 dark:bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer border-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
            </svg>
          </button>
        )}

        {shadowState === "recording" && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShadowState("done")}
              className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] animate-pulse cursor-pointer border-none"
            >
              <span className="w-4 h-4 bg-white rounded-xs" />
            </button>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-455 tracking-wider">
              ĐANG THU ÂM: {shadowSeconds}s / 3s
            </p>
          </div>
        )}

        {shadowState === "done" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  onSpeakWord(defaultEntry.chinese);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer border-none"
              >
                ▶ Nghe lại bài mẫu
              </button>
              <button
                onClick={() => setShadowState("idle")}
                className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer border-none"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
