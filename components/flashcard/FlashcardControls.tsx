import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/common/ThemedComponents";
import { useThemeColors } from "@/lib/theme";

interface FlashcardControlsProps {
  onNext: (status: "mastered" | "uncertain" | "learning") => void;
  onPrevious: () => void;
  onFlip: () => void;
  currentIndex: number;
  isFirst: boolean;
}

export const FlashcardControls = React.memo<FlashcardControlsProps>(
  ({ onNext, onPrevious, onFlip, currentIndex, isFirst }) => {
    const { colors } = useThemeColors();

    return (
      <ThemedView
        style={[styles.container, { borderTopColor: colors.border.primary }]}
        backgroundColor="primary"
      >
        {/* Previous Card */}
        <TouchableOpacity
          style={[styles.button, isFirst && styles.disabledButton]}
          onPress={onPrevious}
          disabled={isFirst}
        >
          <Ionicons
            name="arrow-undo"
            size={40}
            color={isFirst ? colors.text.tertiary : colors.text.primary}
          />
        </TouchableOpacity>

        {/* Don't Know */}
        <TouchableOpacity style={styles.button} onPress={() => onNext("learning")}>
          <Ionicons name="close" size={40} color={colors.error} />
        </TouchableOpacity>

        {/* Flip Card / Uncertain */}
        <TouchableOpacity style={styles.button} onPress={onFlip}>
          <Ionicons name="help" size={40} color={colors.primary} />
        </TouchableOpacity>

        {/* Know It */}
        <TouchableOpacity style={styles.button} onPress={() => onNext("mastered")}>
          <Ionicons name="checkmark" size={40} color={colors.success} />
        </TouchableOpacity>
      </ThemedView>
    );
  },
);
FlashcardControls.displayName = "FlashcardControls";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  button: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.3,
  },
});
