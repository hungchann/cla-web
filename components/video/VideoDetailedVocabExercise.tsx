import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaHeaderSlot, SafeAreaScrollView, useSafeAreaInsets } from "@/components/common/SafeAreaInsets";
import { ThemedText, ThemedView } from "@/components/common/ThemedComponents";
import { useThemeColors, spacing, layout, typography } from "@/lib/theme";
import { RubyText } from "../common/RubyText";

export default function VideoDetailedVocabExercise() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const [selected, setSelected] = useState<number | null>(null);

  const options = [
    { id: 1, hanzi: "老的", pinyin: "Lǎo de" },
    { id: 2, hanzi: "丰富", pinyin: "Fēngfù" },
    { id: 3, hanzi: "苹果", pinyin: "Píngguǒ" },
    { id: 4, hanzi: "青春的", pinyin: "Qīngchūn de" },
  ];

  return (
    <ThemedView style={styles.container} backgroundColor="primary">
      <SafeAreaHeaderSlot>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Bài tập chi tiết</ThemedText>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaHeaderSlot>

      <SafeAreaScrollView
        contentInsetEdges={{ top: false, left: false, right: false }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ThemedView style={styles.topRow}>
          <ThemedText style={styles.sectionTitle}>Từ vựng video</ThemedText>
          <ThemedText style={styles.progress}>1/20</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.questionBlock, { backgroundColor: colors.background.tertiary }]}>
          <ThemedView style={styles.questionRow} backgroundColor="transparent">
            <ThemedText style={styles.questionNumber}>1.</ThemedText>
            <ThemedView style={styles.questionContent} backgroundColor="transparent">
              <ThemedText style={styles.questionText}>
                中国是一个拥有悠久历史和 (_____) 文化的国家。
              </ThemedText>
              <ThemedText style={styles.pinyinText}>
                Zhōngguó shì yīgè yǒngyǒu yōujiǔ lìshǐ hé (_____) wénhuà de guójiā.
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </SafeAreaScrollView>

      <ThemedView
        style={[
          styles.optionBackground,
          { backgroundColor: colors.background.tertiary, bottom: insets.bottom },
        ]}
      >
        {options.map((item) => {
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.optionButton,
                { backgroundColor: isSelected ? colors.primary : colors.background.secondary },
                isSelected && { borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={() => setSelected(item.id)}
            >
              <RubyText
                word={item.hanzi}
                pinyin={item.pinyin}
                textColor={isSelected ? colors.text.inverse : colors.text.primary}
                pinyinColor={isSelected ? colors.text.inverse : colors.text.secondary}
                bold
                fontSize={20}
                pinyinSize={12}
              />
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h3,
  },
  iconButton: {
    padding: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 250,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: "700",
  },
  progress: {
    ...typography.label,
    fontWeight: "600",
  },
  questionBlock: {
    padding: spacing.md,
    borderRadius: layout.borderRadius.md,
    marginBottom: spacing.xl,
  },
  questionRow: {
    flexDirection: "row",
  },
  questionNumber: {
    width: 25,
    ...typography.h3,
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    ...typography.body,
    fontSize: 18,
  },
  pinyinText: {
    ...typography.body,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
  optionBackground: {
    padding: spacing.lg,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    ...layout.shadow.lg,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  optionButton: {
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.md,
    marginBottom: spacing.sm,
    alignItems: "center",
    ...layout.shadow.sm,
  },
  optionHanzi: {
    ...typography.body,
    fontWeight: "700",
  },
  optionPinyin: {
    ...typography.caption,
    marginTop: 2,
  },
});
