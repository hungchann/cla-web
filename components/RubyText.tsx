import React from "react";
import { StyleSheet, View, TextStyle, StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { ThemedText } from "./ThemedComponents";
import { useThemeColors } from "@/lib/theme";

interface RubyTextProps {
  word: React.ReactNode;
  pinyin?: string;
  fontSize?: number;
  pinyinSize?: number;
  textColor?: string;
  pinyinColor?: string;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: ViewStyle;
  onPress?: () => void;
}

export const RubyText = ({
  word,
  pinyin,
  fontSize = 18,
  pinyinSize = 12,
  textColor,
  pinyinColor,
  bold = false,
  style,
  containerStyle,
  onPress,
}: RubyTextProps) => {
  const { colors } = useThemeColors();

  const content = (
    <View style={[styles.container, containerStyle]}>
      {pinyin ? (
        <ThemedText
          style={[
            styles.pinyin,
            {
              fontSize: pinyinSize,
              color: pinyinColor || colors.text.secondary,
              lineHeight: pinyinSize * 1.2,
            },
          ]}
          numberOfLines={1}
        >
          {pinyin}
        </ThemedText>
      ) : null}
      <ThemedText
        style={[
          {
            fontSize: fontSize,
            color: textColor || colors.text.primary,
            fontWeight: bold ? "700" : "500",
            lineHeight: fontSize * 1.3,
          },
          style,
        ]}
      >
        {word}
      </ThemedText>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  pinyin: {
    textAlign: "center",
    opacity: 0.8,
  },
});
