import { device, useThemeColors } from "@/lib/theme";
import { SubtitleSegment } from "@/lib/types/video";
import { Ionicons } from "@expo/vector-icons";
import pinyinConverter from "chinese-to-pinyin";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RubyText } from "../common/RubyText";

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
      <View style={[styles.container, isActive && { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={() => onVocabularyPress(item, index)}
        >
          <View style={styles.wordsWrapper}>
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
                  containerStyle={{ marginRight: 8, marginBottom: 4 }}
                />
              ))
            ) : (
              <View style={styles.unsegmentedWrapper}>
                <RubyText
                  word={item.chinese}
                  pinyin={isOpenPinyin ? pinyinText : undefined}
                  fontSize={device.isLarge ? 28 : 18}
                  pinyinSize={device.isLarge ? 16 : 13}
                  textColor={textColor}
                  pinyinColor={textColor}
                  containerStyle={{ alignItems: "flex-start", marginRight: 8, marginBottom: 4 }}
                />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.vietnameseText,
              { color: textColor },
              device.isLarge && { fontSize: 20, lineHeight: 28 },
            ]}
          >
            {item.vietnamese}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onReplayPress(item, index)}
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
  },
);

SubtitleItem.displayName = "SubtitleItem";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    borderRadius: 16,
    overflow: "hidden",
    padding: 8,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 60,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    paddingRight: 40,
  },
  wordsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  segmentedToken: {
    marginRight: 8,
    marginBottom: 4,
    alignItems: "center",
    borderRadius: 10,
  },
  pinyinText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "left",
    marginBottom: 2,
  },
  chineseText: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: "left",
  },
  unsegmentedWrapper: {
    flexDirection: "column",
    marginRight: 8,
    marginBottom: 4,
    alignItems: "flex-start",
  },
  vietnameseText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "left",
    alignSelf: "stretch",
  },
  replayButton: {
    borderWidth: 1,
    width: 28,
    height: 28,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
  },
});
