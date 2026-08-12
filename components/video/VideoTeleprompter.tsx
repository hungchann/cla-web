"use client";

import { RubyText } from "../RubyText";
import { Play, Volume2 } from "lucide-react";
import { useThemeColors } from "@/lib/theme";
import { SegmentedWord, SubtitleSegment } from "@/lib/types/video";

interface VideoTeleprompterProps {
  items: SubtitleSegment[];
  activeIndex: number | null;
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  onReplayPress: (item: SubtitleSegment, index: number) => void;
  onSpeak: (text: string) => void;
}

export function VideoTeleprompter({
  items,
  activeIndex,
  isOpenPinyin,
  onWordPress,
  onReplayPress,
  onSpeak,
}: Readonly<VideoTeleprompterProps>) {
  const { colors } = useThemeColors();

  const displayIndex =
    activeIndex !== null && activeIndex !== undefined && activeIndex !== -1 && items[activeIndex]
      ? activeIndex
      : items.length > 0
        ? 0
        : -1;

  const current = displayIndex >= 0 ? items[displayIndex] : null;
  const total = items.length;

  if (!current) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
          Không có phụ đề để hiển thị.
        </p>
        <p className="text-[10px] text-zinc-400/70 mt-1">
          Phụ đề sẽ tự động hiển thị theo video.
        </p>
      </div>
    );
  }

  const words: SegmentedWord[] =
    Array.isArray(current.segmentedWords) && current.segmentedWords.length > 0
      ? current.segmentedWords
      : current.chinese
        ? Array.from(current.chinese).map((c) => ({ word: c, pinyin: "" }))
        : [];

  const handleReplay = () => {
    onReplayPress(current, displayIndex);
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0">
      {/* Teleprompter body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center py-6 px-2">
        {/* Chinese words */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 leading-relaxed max-w-full">
          {words.map((w: SegmentedWord, i: number) => (
            <RubyText
              key={`word-${i}-${w.word}`}
              word={w.word}
              pinyin={isOpenPinyin ? w.pinyin : undefined}
              fontSize={30}
              pinyinSize={16}
              bold
              textColor={colors.primary}
              pinyinColor={colors.text.secondary}
              onPress={() => onWordPress(w.word)}
              containerClassName="cursor-pointer"
            />
          ))}
        </div>

        {/* Vietnamese translation */}
        {current.vietnamese && (
          <p className="text-sm md:text-base font-semibold text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
            {current.vietnamese}
          </p>
        )}
      </div>

      {/* Progress + actions */}
      <div className="shrink-0 flex flex-col gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
            {displayIndex + 1} / {total}
          </span>
          <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: total > 0 ? `${((displayIndex + 1) / total) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 cursor-pointer active:scale-95 transition-all border-none"
            title="Phát lại đoạn này"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Phát lại
          </button>
          <button
            onClick={() => onSpeak(current.chinese || "")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 dark:text-amber-400 cursor-pointer active:scale-95 transition-all border border-amber-200/30"
            title="Nghe giọng đọc mẫu"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Nghe mẫu
          </button>
        </div>
      </div>
    </div>
  );
}
