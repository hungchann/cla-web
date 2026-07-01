import React from "react";
import { useThemeColors } from "@/lib/theme";
import { WordInfo } from "@/lib/types/vocabulary";
import { RubyText } from "../RubyText";

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
        {/* Simple spinner */}
        <div className="w-6 h-6 border-2 border-solid rounded-full animate-spin border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: "transparent" }}></div>
        <span className="mt-2 text-[15px]" style={{ color: colors.text.primary }}>Đang tải...</span>
      </div>
    );
  }

  return (
    <div 
      className="w-full rounded-2xl py-4 px-4.5 flex flex-col shadow-2xl max-w-sm mx-auto"
      style={{ backgroundColor: colors.background.secondary }}
      onClick={(e) => e.stopPropagation()}
    >
      <RubyText
        word={selectedWord || ""}
        pinyin={wordInfo?.pinyin}
        fontSize={28}
        pinyinSize={14}
        bold
        containerClassName="mb-4"
      />

      {wordInfo ? (
        <div className="overflow-y-auto max-h-[280px] pr-1">
          <p className="text-base leading-relaxed mb-2" style={{ color: colors.text.primary }}>
            <span className="font-bold" style={{ color: colors.primary }}>Nghĩa: </span>
            {Array.isArray(wordInfo.meanings) ? wordInfo.meanings.join(", ") : wordInfo.meanings}
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
                  <RubyText
                    key={`${c.word}-${idx}`}
                    word={c.word}
                    pinyin={c.pinyin}
                    fontSize={18}
                    pinyinSize={11}
                    containerClassName="items-start my-1"
                  />
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

      <button 
        onClick={onClose} 
        className="mt-4 self-center py-2 px-4 rounded-lg bg-transparent border-none cursor-pointer text-base font-bold transition-opacity hover:opacity-80 active:opacity-60"
        style={{ color: colors.primary }}
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
