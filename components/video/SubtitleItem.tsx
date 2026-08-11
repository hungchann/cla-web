import React from "react";
import { RubyText } from "../RubyText";
import { SubtitleSegment } from "@/lib/types/video";
import { useThemeColors } from "@/lib/theme";
import { Play } from "lucide-react";

interface SubtitleItemProps {
  item: SubtitleSegment;
  index: number;
  activeIndex: number | null;
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  onReplayPress: (item: SubtitleSegment, index: number) => void;
}

export const SubtitleItem = React.memo(
  ({
    item,
    index,
    activeIndex,
    isOpenPinyin,
    onWordPress,
    onReplayPress,
  }: SubtitleItemProps) => {
    const { colors } = useThemeColors();
    const isActive = activeIndex === index;

    return (
      <div
        onClick={() => onReplayPress(item, index)}
        className={`w-full p-3 my-1 rounded-xl transition-all duration-200 cursor-pointer border-l-4 ${
          isActive
            ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-3xs"
            : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border-zinc-100 dark:border-zinc-800/60"
        }`}
      >
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Chinese + Pinyin */}
            <div className="flex flex-row flex-wrap items-end gap-x-1.5 gap-y-2 leading-relaxed">
              {Array.isArray(item.segmentedWords) && item.segmentedWords.length > 0 ? (
                item.segmentedWords.map((w, i: number) => (
                  <RubyText
                    key={`word-${index}-${i}-${w.word}`}
                    word={w.word}
                    pinyin={isOpenPinyin ? w.pinyin : undefined}
                    fontSize={18}
                    pinyinSize={12}
                    bold={isActive}
                    textColor={isActive ? colors.primary : colors.text.primary}
                    pinyinColor={isActive ? colors.primary : colors.text.secondary}
                    onPress={() => onWordPress(w.word)}
                  />
                ))
              ) : (
                <RubyText
                  word={item.chinese}
                  pinyin={isOpenPinyin ? item.pinyin : undefined}
                  fontSize={18}
                  pinyinSize={12}
                  bold={isActive}
                  textColor={isActive ? colors.primary : colors.text.primary}
                  pinyinColor={isActive ? colors.primary : colors.text.secondary}
                />
              )}
            </div>

            {/* Vietnamese Translation */}
            {item.vietnamese && (
              <p
                className={`text-xs md:text-sm font-medium leading-relaxed ${
                  isActive
                    ? "text-amber-900 dark:text-amber-200 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.vietnamese}
              </p>
            )}
          </div>

          {/* Replay Button in flow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReplayPress(item, index);
            }}
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer mt-0.5 ${
              isActive
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-500 hover:bg-amber-100 hover:text-amber-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
            title="Phát lại đoạn này"
          >
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          </button>
        </div>
      </div>
    );
  },
);

SubtitleItem.displayName = "SubtitleItem";
