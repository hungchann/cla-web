import { SubtitleEntry } from "@/lib/types/subtitle";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import { RubyText } from "../common/RubyText";

type SubtitleRowProps = {
  item: SubtitleEntry;
  index: number;
  activeIndex: number | null;
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  colors: any;
  onReplay: (item: any, index: number) => void;
  onLayout?: (index: number, y: number, height: number) => void;
  style?: ViewStyle;
};

export const SubtitleRow = memo(function SubtitleRow({
  item,
  index,
  activeIndex,
  isOpenPinyin,
  onWordPress,
  colors,
  onReplay,
  onLayout,
  style,
}: SubtitleRowProps) {
  const handleLayout = useCallback(
    (event: any) => {
      const { y, height } = event.nativeEvent.layout;
      onLayout?.(index, y, height);
    },
    [index, onLayout],
  );

  const isActive = activeIndex === index;
  const textColor = isActive ? colors.text.inverse : colors.text.primary;

  return (
    <View
      style={[styles.subtitleRowContainer, isActive && { backgroundColor: colors.primary }, style]}
      onLayout={handleLayout}
    >
      <View style={styles.textBlock}>
        <View style={styles.wordsWrapper}>
          {Array.isArray(item.segmentedWords) ? (
            item.segmentedWords.map((w: { word: string; pinyin: string }, i: number) => (
              <RubyText
                key={`word-${index}-${i}-${w.word}`}
                word={w.word}
                pinyin={isOpenPinyin ? w.pinyin : undefined}
                fontSize={20}
                pinyinSize={14}
                textColor={textColor}
                pinyinColor={textColor}
                onPress={() => onWordPress(w.word)}
                containerStyle={styles.rubySpacing}
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
              containerStyle={styles.rubyUnsegmented}
            />
          )}
        </View>
        <Text
          style={[
            styles.vietnameseText,
            {
              color: textColor,
              opacity: isActive ? 1 : 0.9,
            },
          ]}
        >
          {item.vietnamese}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onReplay(item, index)}
        style={[
          styles.replayButton,
          {
            borderColor: isActive ? colors.text.inverse : colors.primary,
            backgroundColor: isActive ? colors.primary : colors.background.primary,
          },
        ]}
      >
        <Ionicons name="play" size={14} color={isActive ? colors.text.inverse : colors.primary} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  subtitleRowContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    marginVertical: 2,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 60,
    position: "relative",
  },
  textBlock: {
    flex: 1,
    alignItems: "flex-start",
    paddingRight: 40,
  },
  wordsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  rubySpacing: {
    marginRight: 8,
    marginBottom: 4,
  },
  rubyUnsegmented: {
    alignItems: "flex-start",
    marginRight: 8,
    marginBottom: 4,
  },
  vietnameseText: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "left",
    alignSelf: "stretch",
  },
  replayButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
    borderWidth: 1,
    width: 28,
    height: 28,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
