import React from "react";
import { RubyText } from "../RubyText";
import { SubtitleSegment } from "@/lib/types/video";
import { useThemeColors } from "@/lib/theme";

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
    const textColor = isActive ? colors.text.inverse : colors.text.primary;

    return (
      <div
        className="relative w-full flex flex-row items-center justify-between p-2.5 my-1 rounded-2xl overflow-hidden min-h-[60px] transition-colors duration-200"
        style={{
          backgroundColor: isActive ? colors.primary : "transparent",
        }}
      >
        <div className="flex-1 flex flex-col items-start pr-10">
          <div className="flex flex-row flex-wrap items-start">
            {Array.isArray(item.segmentedWords) ? (
              item.segmentedWords.map((w, i: number) => (
                <RubyText
                  key={`word-${index}-${i}-${w.word}`}
                  word={w.word}
                  pinyin={isOpenPinyin ? w.pinyin : undefined}
                  fontSize={20}
                  pinyinSize={14}
                  textColor={textColor}
                  pinyinColor={textColor}
                  onPress={() => onWordPress(w.word)}
                  containerClassName="mr-2 mb-1"
                />
              ))
            ) : (
              <RubyText
                word={item.chinese}
                pinyin={isOpenPinyin ? item.pinyin : undefined}
                fontSize={20}
                pinyinSize={14}
                textColor={textColor}
                pinyinColor={textColor}
                containerClassName="mr-2 mb-1"
              />
            )}
          </div>
          <p
            className="mt-1 text-[15px] leading-snug text-left self-stretch transition-opacity duration-250"
            style={{
              color: textColor,
              opacity: isActive ? 1 : 0.9,
            }}
          >
            {item.vietnamese}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onReplayPress(item, index)}
          className="absolute right-2.5 top-2.5 z-10 w-7 h-7 rounded-full border border-solid flex items-center justify-center cursor-pointer transition-colors"
          style={{
            borderColor: isActive ? colors.text.inverse : colors.primary,
            backgroundColor: isActive ? colors.primary : colors.background.primary,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3.5 h-3.5"
            style={{ color: isActive ? colors.text.inverse : colors.primary }}
          >
            <path
              fillRule="evenodd"
              d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  },
);

SubtitleItem.displayName = "SubtitleItem";

