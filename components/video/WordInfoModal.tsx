import React, { useState, useEffect } from "react";
import { useThemeColors } from "@/lib/theme";
import { WordInfo } from "@/lib/types/vocabulary";
import { RubyText } from "../RubyText";
import { notebookApi } from "@/api/notebook";
import { tokenUtils } from "@/lib/utils/tokenUtils";

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
  const [showDecksList, setShowDecksList] = useState(false);
  const [decks, setDecks] = useState<any[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Clear message and selector on word change
  useEffect(() => {
    setShowDecksList(false);
    setShowCreateInput(false);
    setMessage(null);
  }, [selectedWord]);

  if (isLoading) {
    return (
      <div className="py-6 flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-solid rounded-full animate-spin border-t-transparent" style={{ borderColor: colors.primary, borderTopColor: "transparent" }}></div>
        <span className="mt-2 text-[15px]" style={{ color: colors.text.primary }}>Đang tải...</span>
      </div>
    );
  }

  const handleSaveClick = async () => {
    const user = tokenUtils.getUserData();
    if (!user) {
      setMessage({ type: "error", text: "Vui lòng đăng nhập để lưu flashcard." });
      return;
    }

    setLoadingDecks(true);
    setShowDecksList(true);
    try {
      const personalDecks = await notebookApi.getPersonalNotebooks();
      setDecks(personalDecks || []);
    } catch (err) {
      console.error("Lỗi tải bộ flashcard:", err);
      setMessage({ type: "error", text: "Không thể tải danh sách bộ flashcard." });
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleSelectDeck = async (deckId: string, deckTitle: string) => {
    if (!wordInfo) return;
    setSaving(true);
    try {
      const meaningsStr = Array.isArray(wordInfo.meanings) 
        ? wordInfo.meanings.join(", ") 
        : wordInfo.meanings || "";
      await notebookApi.createVocabItemInPersonalDeck(
        deckId,
        wordInfo.word || selectedWord || "",
        wordInfo.pinyin || "N/A",
        meaningsStr
      );
      setMessage({ type: "success", text: `Đã lưu vào bộ "${deckTitle}"!` });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Lỗi lưu flashcard:", err);
      setMessage({ type: "error", text: "Lưu flashcard thất bại." });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim() || !wordInfo) return;
    setSaving(true);
    try {
      // 1. Tạo bộ flashcard mới
      const newDeck = await notebookApi.createNoteBooks(newDeckTitle.trim());
      const deckId = newDeck?.id;
      if (!deckId) {
        throw new Error("Không lấy được ID bộ từ vựng mới.");
      }
      
      // 2. Lưu từ vựng vào bộ mới tạo
      const meaningsStr = Array.isArray(wordInfo.meanings) 
        ? wordInfo.meanings.join(", ") 
        : wordInfo.meanings || "";
      await notebookApi.createVocabItemInPersonalDeck(
        deckId,
        wordInfo.word || selectedWord || "",
        wordInfo.pinyin || "N/A",
        meaningsStr
      );

      setMessage({ type: "success", text: `Đã tạo bộ "${newDeckTitle}" và lưu từ vựng!` });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Lỗi tạo và lưu flashcard:", err);
      setMessage({ type: "error", text: "Tạo bộ và lưu flashcard thất bại." });
    } finally {
      setSaving(false);
    }
  };

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

      {/* Message feedback */}
      {message && (
        <div className={`mb-3 p-2.5 rounded-lg text-xs font-bold text-center ${
          message.type === "success" 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        }`}>
          {message.text}
        </div>
      )}

      {!showDecksList ? (
        <>
          {wordInfo ? (
            <div className="overflow-y-auto max-h-[200px] pr-1">
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
            <button
              onClick={handleSaveClick}
              className="mt-4 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              ⭐ Lưu từ vào Flashcard
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Chọn bộ Flashcard:</h4>
          
          {loadingDecks ? (
            <div className="py-4 flex justify-center items-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"></span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
              {decks.length === 0 && !showCreateInput && (
                <p className="text-xs text-zinc-500 text-center py-2">Bạn chưa có bộ flashcard nào.</p>
              )}
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleSelectDeck(deck.id, deck.title)}
                  disabled={saving}
                  className="w-full text-left py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-800 font-semibold text-xs text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer bg-transparent"
                >
                  📁 {deck.title}
                </button>
              ))}
            </div>
          )}

          {showCreateInput ? (
            <form onSubmit={handleCreateAndSave} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                placeholder="Tên bộ từ mới..."
                disabled={saving}
                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs bg-transparent focus:border-amber-500 focus:outline-none dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={saving || !newDeckTitle.trim()}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer border-none"
              >
                {saving ? "..." : "Lưu"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateInput(false)}
                className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold cursor-pointer bg-transparent text-zinc-500"
              >
                Hủy
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="mt-1 text-center py-1.5 border border-dashed border-amber-500/40 rounded-lg text-amber-600 dark:text-amber-500 hover:bg-amber-500/5 text-xs font-bold transition-colors cursor-pointer bg-transparent"
            >
              ➕ Tạo bộ từ mới
            </button>
          )}

          <button
            onClick={() => setShowDecksList(false)}
            className="text-xs text-zinc-400 hover:text-zinc-500 font-bold self-center mt-2 cursor-pointer bg-transparent border-none"
          >
            &larr; Quay lại
          </button>
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
