import { useThemeColors } from "@/lib/theme";
import React from "react";
import { RubyText } from "./RubyText";

interface HighlightedTextProps {
  text: string;
  highlightedWords: {
    word: string;
    isCorrect: boolean;
    isMissing: boolean;
    isExtra: boolean;
    isSubstitution?: boolean;
  }[];
  showPinyin?: boolean;
  segmentedWords?: {
    word: string;
    pinyin?: string;
  }[];
}

export default function HighlightedText({
  text,
  highlightedWords,
  showPinyin = false,
  segmentedWords = [],
}: HighlightedTextProps) {
  const { colors } = useThemeColors();

  // Create a map for quick lookup
  const highlightedMap = new Map();
  highlightedWords.forEach((item) => {
    highlightedMap.set(item.word, item);
  });

  // Split text into characters and create display items
  const characters = text.split("");
  const displayItems = characters.map((char, index) => {
    const highlight = highlightedMap.get(char);
    return {
      char,
      index,
      isCorrect: highlight?.isCorrect || false,
      isMissing: highlight?.isMissing || false,
      isExtra: highlight?.isExtra || false,
      isSubstitution: highlight?.isSubstitution || false,
    };
  });

  return (
    <div className="flex-1 w-full">
      {showPinyin && segmentedWords.length > 0 ? (
        // Show segmented words with pinyin
        <div className="flex flex-row flex-wrap justify-start items-start gap-y-1">
          {segmentedWords.map((seg, idx) => {
            const highlight = highlightedMap.get(seg.word);
            let textColor = colors.text.primary;
            if (highlight?.isCorrect) textColor = colors.success;
            else if (highlight?.isMissing) textColor = colors.error;
            else if (highlight?.isExtra) textColor = colors.warning;

            return (
              <RubyText
                key={`${seg.word}-${idx}`}
                word={seg.word}
                pinyin={seg.pinyin}
                fontSize={22}
                pinyinSize={12}
                textColor={textColor}
                pinyinColor={textColor}
                bold={highlight?.isCorrect || highlight?.isSubstitution}
                className={highlight?.isSubstitution ? "italic" : ""}
                containerClassName="mx-1 my-0.5"
              />
            );
          })}
        </div>
      ) : (
        // Show character by character
        <div className="flex flex-row flex-wrap justify-start items-start gap-y-1">
          {displayItems.map((item, index) => {
            const charStyle: React.CSSProperties = {
              fontSize: "24px",
              lineHeight: "28px",
              margin: "0 2px",
              color: colors.text.primary,
            };

            if (item.isCorrect) {
              charStyle.color = colors.success;
              charStyle.fontWeight = "bold";
            } else if (item.isMissing) {
              charStyle.color = colors.error;
              charStyle.backgroundColor = colors.statusSurface.errorSubtle;
              charStyle.borderRadius = "4px";
              charStyle.padding = "0 4px";
            } else if (item.isExtra) {
              charStyle.color = colors.warning;
              charStyle.backgroundColor = colors.statusSurface.warningSubtle;
              charStyle.borderRadius = "4px";
              charStyle.padding = "0 4px";
            } else if (item.isSubstitution) {
              charStyle.color = colors.warning;
              charStyle.backgroundColor = colors.statusSurface.warningEmphasis;
              charStyle.borderRadius = "4px";
              charStyle.padding = "0 4px";
              charStyle.fontStyle = "italic";
              charStyle.fontWeight = "bold";
            }

            return (
              <span key={index} style={charStyle}>
                {item.char}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
