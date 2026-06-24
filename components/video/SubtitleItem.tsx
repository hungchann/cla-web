import { device, useThemeColors } from "@/lib/theme";
import { SubtitleSegment } from "@/lib/types/video";
import pinyinConverter from "chinese-to-pinyin";
import React from "react";
import { RubyText } from "../RubyText";

interface SubtitleItemProps {
  item: SubtitleSegment;
  index: number;
  activeIndex: number | null;
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  onReplayPress: (item: SubtitleSegment, index: number) => void;
  onVocabularyPress: (item: SubtitleSegment, index: number) => void;
}

export const SubtitleItem = React.memo(
  ({
    item,
    index,
    activeIndex,
    isOpenPinyin,
    onWordPress,
    onReplayPress,
    onVocabularyPress,
  }: SubtitleItemProps) => {
    const { colors } = useThemeColors();
    const isActive = activeIndex === index;
    const textColor = isActive ? colors.text.inverse : colors.text.primary;

    const pinyinText = React.useMemo(() => {
      if (Array.isArray(item.segmentedWords)) return undefined;
      return pinyinConverter(item.chinese || "", { toneToNumber: false, removeTone: false });
    }, [item.chinese, item.segmentedWords]);

    return (
      <div 
        className="relative w-full flex flex-row items-center justify-between p-2 my-0.5 rounded-2xl overflow-hidden min-h-[60px] transition-colors duration-250 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: isActive ? colors.primary : "transparent",
        }}
        onClick={() => onVocabularyPress(item, index)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onVocabularyPress(item, index);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex-1 flex flex-col items-start pr-10">
          <div className="flex flex-row flex-wrap items-start">
            {Array.isArray(item.segmentedWords) ? (
              item.segmentedWords.map((w, i) => (
                <RubyText
                  key={`${w.word}-${i}`}
                  word={w.word}
                  pinyin={isOpenPinyin ? w.pinyin : undefined}
                  fontSize={18}
                  pinyinSize={13}
                  textColor={textColor}
                  pinyinColor={textColor}
                  onPress={() => onWordPress(w.word)}
                  containerClassName="mr-2 mb-1"
                />
              ))
            ) : (
              <div className="flex flex-col items-start mr-2 mb-1">
                <RubyText
                  word={item.chinese}
                  pinyin={isOpenPinyin ? pinyinText : undefined}
                  fontSize={device.isLarge ? 28 : 18}
                  pinyinSize={device.isLarge ? 16 : 13}
                  textColor={textColor}
                  pinyinColor={textColor}
                  containerClassName="items-start"
                />
              </div>
            )}
          </div>
          <p
            className="text-[15px] leading-snug text-left self-stretch"
            style={{ 
              color: textColor,
              fontSize: device.isLarge ? "20px" : "15px",
              lineHeight: device.isLarge ? "28px" : "22px"
            }}
          >
            {item.vietnamese}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent triggering onVocabularyPress
            onReplayPress(item, index);
          }}
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
