import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useThemeColors } from "@/lib/theme";
import { WordInfo } from "@/lib/types/video";
import { RubyText } from "../common/RubyText";

interface WordInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedWord: string | null;
  wordInfo: WordInfo | null;
  isLoading: boolean;
}

interface WordInfoModalContentProps {
  isLoading: boolean;
  wordInfo: WordInfo | null;
  colors: any;
  selectedWord: string | null;
  onClose: () => void;
}

const WordInfoModalContent = ({
  isLoading,
  wordInfo,
  colors,
  selectedWord,
  onClose,
}: WordInfoModalContentProps) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
      <RubyText
        word={selectedWord || ""}
        pinyin={wordInfo?.pinyin}
        fontSize={28}
        pinyinSize={14}
        bold
        containerStyle={{ marginBottom: 16 }}
      />

      {wordInfo ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          {/* Pinyin row removed in favor of RubyText title */}
          <Text style={[styles.row, { color: colors.text.primary }]}>
            <Text style={[styles.label, { color: colors.primary }]}>Nghĩa: </Text>
            {wordInfo.meanings?.join(", ")}
          </Text>
          {wordInfo.traditional && (
            <Text style={[styles.row, { color: colors.text.primary }]}>
              <Text style={[styles.label, { color: colors.primary }]}>Phồn thể: </Text>
              {wordInfo.traditional}
            </Text>
          )}
          {wordInfo.simplified && (
            <Text style={[styles.row, { color: colors.text.primary }]}>
              <Text style={[styles.label, { color: colors.primary }]}>Giản thể: </Text>
              {wordInfo.simplified}
            </Text>
          )}
          {wordInfo.classifiers && wordInfo.classifiers.length > 0 && (
            <View style={styles.classifiersContainer}>
              <Text style={[styles.label, { color: colors.primary }]}>Lượng từ:</Text>
              {wordInfo.classifiers.map((c, idx) => (
                <RubyText
                  key={`${c.word}-${idx}`}
                  word={c.word}
                  pinyin={c.pinyin}
                  fontSize={18}
                  pinyinSize={11}
                  containerStyle={{ alignItems: "flex-start", marginVertical: 4 }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <Text style={[styles.errorText, { color: colors.text.secondary }]}>
          Không tìm thấy thông tin từ này.
        </Text>
      )}

      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={[styles.closeText, { color: colors.primary }]}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
};

export const WordInfoModal = ({
  isVisible,
  onClose,
  selectedWord,
  wordInfo,
  isLoading,
}: WordInfoModalProps) => {
  const { colors } = useThemeColors();

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View>
              <WordInfoModalContent
                isLoading={isLoading}
                wordInfo={wordInfo}
                colors={colors}
                selectedWord={selectedWord}
                onClose={onClose}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 15,
  },
  scroll: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingRight: 4,
  },
  row: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  label: {
    fontWeight: "700",
  },
  classifiersContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  classifierText: {
    fontSize: 15,
    lineHeight: 21,
    marginLeft: 12,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginVertical: 24,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
