"use client";

import React, { useCallback, useState } from "react";
import { Star, Check, Folder, Plus } from "lucide-react";
import { notebookApi } from "@/api/notebook";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { usePremiumGate } from "@/lib/hooks/usePremiumGate";
import { PremiumGate } from "@/components/PremiumGate";
import { FREE_NOTEBOOK_LIMIT } from "@/lib/premium";

export interface NotebookDeck {
  id: string;
  title: string;
}

export interface SaveToNotebookWord {
  word: string;
  pinyin: string;
  meaning: string;
}

type Message = { type: "success" | "error"; text: string } | null;

/**
 * Logic dùng chung cho việc chọn/tạo sổ tay cá nhân: load list, tạo mới có
 * giới hạn Free, mở PremiumGate. Không chứa UI.
 */
export function useNotebookDecks() {
  const [decks, setDecks] = useState<NotebookDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const {
    isPremium,
    premiumModalVisible,
    setPremiumModalVisible,
    showPremiumModal,
  } = usePremiumGate();

  const loadDecks = useCallback(async (): Promise<NotebookDeck[]> => {
    setLoading(true);
    try {
      const list = await notebookApi.getPersonalNotebooks();
      const safe = Array.isArray(list) ? list : [];
      setDecks(safe);
      return safe;
    } catch (error) {
      console.error("Lỗi tải sổ tay:", error);
      setMessage({ type: "error", text: "Không tải được danh sách sổ tay." });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeck = useCallback(
    async (rawTitle: string): Promise<NotebookDeck | null> => {
      const title = rawTitle.trim();
      if (!title) return null;
      // Free user chỉ tạo được tối đa FREE_NOTEBOOK_LIMIT sổ tay (giống mobile).
      if (!isPremium && decks.length >= FREE_NOTEBOOK_LIMIT) {
        showPremiumModal();
        return null;
      }
      setCreating(true);
      try {
        const created = await notebookApi.createNoteBooks(title);
        if (!created?.id) throw new Error("Không lấy được ID sổ tay mới.");
        const deck: NotebookDeck = { id: String(created.id), title: created.title || title };
        await loadDecks();
        return deck;
      } catch (error) {
        console.error("Lỗi tạo sổ tay:", error);
        setMessage({ type: "error", text: "Tạo sổ tay thất bại." });
        return null;
      } finally {
        setCreating(false);
      }
    },
    [decks.length, isPremium, loadDecks, showPremiumModal],
  );

  return {
    decks,
    loading,
    creating,
    message,
    setMessage,
    loadDecks,
    createDeck,
    isPremium,
    premiumModalVisible,
    setPremiumModalVisible,
  };
}

interface SaveToNotebookProps {
  readonly word: SaveToNotebookWord;
  readonly variant?: "popover" | "inline";
  readonly label?: string;
  readonly savedLabel?: string;
  readonly buttonClassName?: string;
  readonly onSaved?: (deck: NotebookDeck) => void;
}

const DEFAULT_BUTTON_CLASS =
  "text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 bg-white border-gray-200 text-gray-600 hover:text-amber-500 hover:border-amber-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300";

/**
 * Lưu một từ vựng vào sổ tay cá nhân — component dùng chung cho mọi entry point.
 * Cho phép chọn sổ tay có sẵn hoặc đặt tên sổ tay mới (refresh + tự chọn sổ vừa tạo).
 */
export function SaveToNotebook({
  word,
  variant = "popover",
  label = "Lưu Flashcard",
  savedLabel = "Đã lưu Flashcard",
  buttonClassName = DEFAULT_BUTTON_CLASS,
  onSaved,
}: SaveToNotebookProps) {
  const notebook = useNotebookDecks();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    notebook.setMessage(null);
    if (!tokenUtils.getUserData()) {
      notebook.setMessage({ type: "error", text: "Vui lòng đăng nhập để lưu vào sổ tay." });
      setOpen(true);
      return;
    }
    setOpen(true);
    setShowCreate(false);
    await notebook.loadDecks();
  };

  const saveToDeck = async (deck: NotebookDeck) => {
    if (!tokenUtils.getUserData()) {
      notebook.setMessage({ type: "error", text: "Vui lòng đăng nhập để lưu vào sổ tay." });
      return;
    }
    setSaving(true);
    notebook.setMessage(null);
    try {
      await notebookApi.createVocabItemInPersonalDeck(
        deck.id,
        word.word,
        word.pinyin || "N/A",
        word.meaning,
      );
      setSaved(true);
      notebook.setMessage({ type: "success", text: `Đã lưu vào sổ tay "${deck.title}"!` });
      onSaved?.(deck);
      if (variant === "popover") {
        setTimeout(() => {
          setOpen(false);
          notebook.setMessage(null);
        }, 1200);
      }
    } catch (error) {
      console.error("Lỗi lưu vào sổ tay:", error);
      notebook.setMessage({ type: "error", text: "Lưu vào sổ tay thất bại." });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const deck = await notebook.createDeck(newTitle);
    if (!deck) return;
    setNewTitle("");
    setShowCreate(false);
    await saveToDeck(deck);
  };

  const panel = (
    <div
      className={
        variant === "popover"
          ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col gap-2 w-56 text-left z-20"
          : "flex flex-col gap-3 w-full"
      }
    >
      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        Chọn sổ tay:
      </h5>

      {notebook.loading ? (
        <div className="py-2 flex justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border border-amber-600 border-t-transparent" />
        </div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto max-h-32 pr-1 scrollbar-thin">
          {notebook.decks.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-1">
              Bạn chưa có sổ tay nào.
            </p>
          ) : (
            notebook.decks.map((deck) => (
              <button
                key={deck.id}
                type="button"
                onClick={() => saveToDeck(deck)}
                disabled={saving}
                className="w-full text-left py-1.5 px-2 hover:bg-amber-50 dark:hover:bg-zinc-800 text-[11px] font-semibold rounded text-zinc-700 dark:text-zinc-300 bg-transparent border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{deck.title}</span>
              </button>
            ))
          )}
        </div>
      )}

      {showCreate ? (
        <form onSubmit={handleCreate} className="flex gap-1.5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tên sổ tay mới..."
            disabled={notebook.creating}
            autoFocus
            className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-white focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={notebook.creating || !newTitle.trim()}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded cursor-pointer border-none disabled:opacity-50"
          >
            {notebook.creating ? "..." : "Lưu"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="text-center py-1.5 text-[10px] text-amber-600 font-bold border border-dashed border-amber-500/30 rounded bg-transparent cursor-pointer flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" /> Tạo sổ tay mới
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-center text-[10px] text-zinc-400 font-semibold mt-0.5 bg-transparent border-none cursor-pointer"
      >
        Hủy
      </button>
    </div>
  );

  return (
    <div className={variant === "popover" ? "relative" : "w-full"}>
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className={
            saved
              ? DEFAULT_BUTTON_CLASS +
                " !bg-amber-100 !border-amber-300 !text-amber-800 dark:!bg-amber-950/40 dark:!text-amber-300"
              : buttonClassName
          }
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" /> {savedLabel}
            </>
          ) : (
            <>
              <Star className="w-3.5 h-3.5" /> {label}
            </>
          )}
        </button>
      ) : (
        panel
      )}

      {notebook.message && (
        <div
          className={`mt-1.5 p-1.5 rounded-lg text-[10px] font-bold text-center ${
            notebook.message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {notebook.message.text}
        </div>
      )}

      <PremiumGate
        isOpen={notebook.premiumModalVisible}
        onClose={() => notebook.setPremiumModalVisible(false)}
        feature="tạo sổ tay từ vựng cá nhân không giới hạn"
        description={`Gói Free chỉ tạo được ${FREE_NOTEBOOK_LIMIT} sổ tay. Nâng cấp Premium để tạo không giới hạn và ôn tập không giới hạn.`}
      />
    </div>
  );
}

export default SaveToNotebook;
