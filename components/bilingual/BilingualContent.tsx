"use client";

import React from "react";
import { Volume2 } from "lucide-react";

interface BilingualContentProps {
  srtData: any[];
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  onSpeakParagraph: (chinese: string) => void;
}

export function BilingualContent({
  srtData,
  isOpenPinyin,
  onWordPress,
  onSpeakParagraph,
}: BilingualContentProps) {
  if (srtData.length === 0) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-xs font-semibold">
        Không có phụ đề / nội dung hiển thị.
      </div>
    );
  }

  return (
    <div className="border border-amber-500/35 dark:border-amber-500/20 rounded-2xl p-5 md:p-6 bg-white dark:bg-zinc-900 shadow-2xs relative flex flex-col gap-5">
      <div className="space-y-5 flex-1">
        {srtData.map((entry: any, index: number) => (
          <div
            key={entry.id || index}
            className={`pb-4 ${
              index < srtData.length - 1
                ? "border-b border-zinc-100 dark:border-zinc-800/80"
                : ""
            } space-y-2`}
          >
            {/* Clickable Chinese words */}
            <div className="flex flex-wrap items-end gap-x-1.5 gap-y-2 text-base md:text-lg font-black text-zinc-800 dark:text-zinc-100 tracking-wide leading-relaxed">
              {entry.segmentedWords?.map((wItem: any, wordIdx: number) => (
                <span
                  key={wordIdx}
                  onClick={() => onWordPress(wItem.word)}
                  className="cursor-pointer hover:text-amber-650 dark:hover:text-amber-500 transition-colors select-none"
                >
                  <ruby>
                    {wItem.word}
                    {isOpenPinyin && wItem.pinyin && (
                      <rt className="text-[10px] text-zinc-400 font-bold select-none">
                        {wItem.pinyin}
                      </rt>
                    )}
                  </ruby>
                </span>
              ))}

              {/* Quick TTS button for this paragraph */}
              <button
                onClick={() => onSpeakParagraph(entry.chinese)}
                className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-650 transition-colors cursor-pointer border-none bg-transparent"
                title="Nghe đoạn này"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            {/* Vietnamese translation */}
            <p className="text-xs md:text-sm font-semibold text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
              {entry.vietnamese}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
