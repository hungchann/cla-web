import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, PanResponder } from "react-native";
import { useTheme, useThemeColors } from "@/lib/theme";

interface FlashcardCardProps {
  isFlipped: boolean;
  onFlip: () => void;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
}

export const FlashcardCard = React.memo<FlashcardCardProps>(
  ({ isFlipped, onFlip, frontContent, backContent }) => {
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const isFlippedRef = useRef(isFlipped);

    useEffect(() => {
      isFlippedRef.current = isFlipped;
      Animated.timing(flipAnimation, {
        toValue: isFlipped ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [isFlipped, flipAnimation]);

    const frontInterpolate = flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    const backInterpolate = flipAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["180deg", "360deg"],
    });

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 20,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 50) {
            // Swipe Right - Flip to back
            if (!isFlippedRef.current) onFlip();
          } else if (gesture.dx < -50) {
            // Swipe Left - Flip to front
            if (isFlippedRef.current) onFlip();
          }
        },
      }),
    ).current;

    const { colors } = useThemeColors();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    return (
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Front Side */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.background.secondary : colors.secondary,
              borderColor: isDark ? colors.primary : "transparent",
              borderWidth: isDark ? 1.5 : 0,
              transform: [{ rotateY: frontInterpolate }, { perspective: 1000 }],
              zIndex: isFlipped ? 0 : 1,
            },
          ]}
        >
          <TouchableOpacity style={styles.touchable} onPress={onFlip} activeOpacity={1}>
            {frontContent}
          </TouchableOpacity>
        </Animated.View>

        {/* Back Side */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.background.card : colors.background.tertiary,
              borderColor: isDark ? colors.border.secondary : "transparent",
              shadowColor: colors.shadow,
              borderWidth: isDark ? 1 : 0,
              transform: [{ rotateY: backInterpolate }, { perspective: 1000 }],
              zIndex: isFlipped ? 1 : 0,
            },
          ]}
        >
          <TouchableOpacity style={styles.touchable} onPress={onFlip} activeOpacity={1}>
            {backContent}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  },
);
FlashcardCard.displayName = "FlashcardCard";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    position: "absolute",
    backfaceVisibility: "hidden",
    elevation: 8,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  touchable: {
    flex: 1,
    borderRadius: 24,
  },
});
