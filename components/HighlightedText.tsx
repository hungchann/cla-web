import { useThemeColors } from "@/lib/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
    <View style={styles.container}>
      {showPinyin && segmentedWords.length > 0 ? (
        // Show segmented words with pinyin
        <View style={styles.segmentedContainer}>
          {segmentedWords.map((seg, idx) => {
            const highlight = highlightedMap.get(seg.word);
            return (
              <RubyText
                key={`${seg.word}-${idx}`}
                word={seg.word}
                pinyin={seg.pinyin}
                fontSize={22}
                pinyinSize={12}
                textColor={
                  highlight?.isCorrect
                    ? colors.success
                    : highlight?.isMissing
                      ? colors.error
                      : highlight?.isExtra
                        ? colors.warning
                        : colors.text.primary
                }
                style={highlight?.isSubstitution ? { fontStyle: "italic" } : undefined}
                bold={highlight?.isCorrect || highlight?.isSubstitution}
                containerStyle={{ marginHorizontal: 4, marginVertical: 2 }}
              />
            );
          })}
        </View>
      ) : (
        // Show character by character
        <View style={styles.characterContainer}>
          {displayItems.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.character,
                { color: colors.text.primary },
                item.isCorrect && { color: colors.success, fontWeight: "bold" },
                item.isMissing && {
                  color: colors.error,
                  backgroundColor: colors.statusSurface.errorSubtle,
                  borderRadius: 4,
                  paddingHorizontal: 2,
                },
                item.isExtra && {
                  color: colors.warning,
                  backgroundColor: colors.statusSurface.warningSubtle,
                  borderRadius: 4,
                  paddingHorizontal: 2,
                },
                item.isSubstitution && {
                  color: colors.warning,
                  backgroundColor: colors.statusSurface.warningEmphasis,
                  borderRadius: 4,
                  paddingHorizontal: 2,
                  fontStyle: "italic",
                  fontWeight: "bold",
                },
              ]}
            >
              {item.char}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  segmentedWord: {
    alignItems: "center",
    marginHorizontal: 4,
    marginVertical: 2,
  },
  pinyinText: {
    fontSize: 12,
    lineHeight: 14,
  },
  hanziText: {
    fontSize: 22,
    lineHeight: 26,
  },
  characterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  character: {
    fontSize: 24,
    lineHeight: 28,
    marginHorizontal: 1,
  },
});
