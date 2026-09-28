import React from "react";
import { useThemeColors } from "@/lib/theme";
import { WordInfo } from "@/lib/types/vocabulary";
import { RubyText } from "../RubyText";
import { SaveToNotebook } from "@/components/notebook/SaveToNotebook";

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
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-solid rounded-full animate-spin border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: "transparent" }}></div>
        <span className="mt-2 text-[15px]" style={{ color: colors.text.primary }}>Đang tải...</span>
      </div>
    );
  }

  const meaningsStr = Array.isArray(wordInfo?.meanings)
    ? wordInfo!.meanings.join(", ")
    : wordInfo?.meanings || "";

  return (
    <div
      className="w-full rounded-2xl py-4 px-4.5 flex flex-col shadow-2xl max-w-sm mx-auto"
      style={{ backgroundColor: colors.background.secondary }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center mb-4">
        <RubyText
          word={selectedWord || ""}
          pinyin={wordInfo?.pinyin}
          fontSize={28}
          pinyinSize={14}
          bold
        />
      </div>

      {wordInfo ? (
        <div className="overflow-y-auto max-h-[200px] pr-1">
          <p className="text-base leading-relaxed mb-2" style={{ color: colors.text.primary }}>
            <span className="font-bold" style={{ color: colors.primary }}>Nghĩa: </span>
            {meaningsStr}
          </p>
          {wordInfo.traditional && (
            <p className="text-base leading-relaxed mb-2" style={{ color: colors.text.primary }}>
              <span className="font-bold" style={{ color: colors.primary }}>Phồn thể: </span>
              {wordInfo.traditional}
            </p>
          )}
          {wordInfo.simplified && (
            <p className="text-base leading-relaxed mb-2" style={{ color: colors.text.primary }}>
              <span className="font-bold" style={{ color: colors.primary }}>Giản thể: </span>
              {wordInfo.simplified}
            </p>
          )}
          {wordInfo.classifiers && wordInfo.classifiers.length > 0 && (
            <div className="mt-1 mb-2">
              <span className="font-bold block mb-1" style={{ color: colors.primary }}>Lượng từ:</span>
              <div className="flex flex-col gap-1 pl-2">
                {wordInfo.classifiers.map((c: any, idx: number) => (
                  <div className="flex items-start my-1" key={`${c.word}-${idx}`}>
                    <RubyText
                      word={c.word}
                      pinyin={c.pinyin}
                      fontSize={18}
                      pinyinSize={11}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[15px] text-center my-6" style={{ color: colors.text.secondary }}>
          Không tìm thấy thông tin từ này.
        </p>
      )}

      {wordInfo && (
        <div className="mt-4">
          <SaveToNotebook
            variant="inline"
            label="Lưu từ vào Flashcard"
            word={{
              word: wordInfo.word || selectedWord || "",
              pinyin: wordInfo.pinyin || "N/A",
              meaning: meaningsStr,
            }}
          />
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-3 self-center py-2 px-4 rounded-lg bg-transparent border-none cursor-pointer text-xs font-extrabold text-zinc-400 hover:text-zinc-500 transition-opacity"
      >
        Đóng
      </button>
    </div>
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

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300"
      style={{ backgroundColor: colors.overlay }}
      onClick={onClose}
    >
      <WordInfoModalContent
        isLoading={isLoading}
        wordInfo={wordInfo}
        colors={colors}
        selectedWord={selectedWord}
        onClose={onClose}
      />
    </div>
  );
};
