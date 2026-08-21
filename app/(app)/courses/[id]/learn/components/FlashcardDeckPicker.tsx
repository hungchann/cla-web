"use client";

import React, { useState } from "react";
import { Star, Check, Folder, Plus } from "lucide-react";
import { notebookApi } from "@/api/notebook";
import type { VocabItem } from "../types";

interface DeckItem {
    id: number | string;
    title: string;
}

interface FlashcardDeckPickerProps {
    readonly vocab: VocabItem;
}

export function FlashcardDeckPicker({ vocab }: FlashcardDeckPickerProps) {
    const [showDecksList, setShowDecksList] = useState(false);
    const [decks, setDecks] = useState<DeckItem[]>([]);
    const [loadingDecks, setLoadingDecks] = useState(false);
    const [savingVocab, setSavingVocab] = useState(false);
    const [isSavedToFlashcard, setIsSavedToFlashcard] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState("");
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleOpenDecks = async () => {
        if (showDecksList) {
            setShowDecksList(false);
            return;
        }
        setShowDecksList(true);
        setLoadingDecks(true);
        try {
            const list = await notebookApi.getNoteBooks();
            setDecks(list || []);
        } catch {
            setSaveMessage({ type: "error", text: "Không tải được danh sách bộ từ." });
        } finally {
            setLoadingDecks(false);
        }
    };

    const handleSelectDeck = async (deckId: number | string, deckTitle: string) => {
        setSavingVocab(true);
        try {
            await notebookApi.createVocabItemInPersonalDeck(
                String(deckId),
                vocab.word,
                vocab.pinyin,
                vocab.meaning
            );
            setSaveMessage({ type: "success", text: `Đã lưu vào bộ "${deckTitle}"!` });
            setIsSavedToFlashcard(true);
            setTimeout(() => {
                setShowDecksList(false);
                setSaveMessage(null);
            }, 1500);
        } catch {
            setSaveMessage({ type: "error", text: "Lỗi lưu từ vào bộ." });
        } finally {
            setSavingVocab(false);
        }
    };

    const handleCreateAndSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newDeckTitle.trim()) return;
        setSavingVocab(true);
        try {
            const newDeck = await notebookApi.createNoteBooks(newDeckTitle.trim());
            const deckId = newDeck?.id;
            if (!deckId) throw new Error("Không lấy được ID bộ từ mới.");
            await notebookApi.createVocabItemInPersonalDeck(
                String(deckId),
                vocab.word,
                vocab.pinyin,
                vocab.meaning
            );
            setSaveMessage({ type: "success", text: `Đã tạo bộ "${newDeckTitle}" và lưu từ!` });
            setIsSavedToFlashcard(true);
            setNewDeckTitle("");
            setTimeout(() => {
                setShowDecksList(false);
                setSaveMessage(null);
            }, 1500);
        } catch {
            setSaveMessage({ type: "error", text: "Thất bại." });
        } finally {
            setSavingVocab(false);
        }
    };

    return (
        <div className="relative">
            {!showDecksList ? (
                <button
                    type="button"
                    onClick={handleOpenDecks}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${
                        isSavedToFlashcard
                            ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-white border-gray-200 text-gray-600 hover:text-amber-500 hover:border-amber-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                    }`}
                >
                    {isSavedToFlashcard ? (
                        <>
                            <Check className="w-3.5 h-3.5" /> Đã lưu Flashcard
                        </>
                    ) : (
                        <>
                            <Star className="w-3.5 h-3.5" /> Lưu Flashcard
                        </>
                    )}
                </button>
            ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col gap-2 w-48 text-left z-20">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Chọn bộ Flashcard:
                    </h5>
                    {loadingDecks ? (
                        <div className="py-2 flex justify-center">
                            <span className="h-4 w-4 animate-spin rounded-full border border-amber-600 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-28 pr-1 scrollbar-thin">
                            {decks.length === 0 && !showCreateInput && (
                                <p className="text-[10px] text-zinc-400 text-center py-1">Chưa có bộ từ.</p>
                            )}
                            {decks.map((deck) => (
                                <button
                                    key={String(deck.id)}
                                    type="button"
                                    onClick={() => handleSelectDeck(deck.id, deck.title)}
                                    disabled={savingVocab}
                                    className="w-full text-left py-1 px-2 hover:bg-amber-50 dark:hover:bg-zinc-800 text-[11px] font-semibold rounded text-zinc-700 dark:text-zinc-300 bg-transparent border-none cursor-pointer flex items-center gap-1"
                                >
                                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span className="truncate">{deck.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {showCreateInput ? (
                        <form onSubmit={handleCreateAndSave} className="flex gap-1">
                            <input
                                type="text"
                                value={newDeckTitle}
                                onChange={(e) => setNewDeckTitle(e.target.value)}
                                placeholder="Tên bộ..."
                                className="w-full px-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-white"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={savingVocab || !newDeckTitle.trim()}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded cursor-pointer border-none"
                            >
                                OK
                            </button>
                        </form>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowCreateInput(true)}
                            className="text-center py-1 text-[10px] text-amber-600 font-bold border border-dashed border-amber-500/30 rounded bg-transparent cursor-pointer flex items-center justify-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Tạo bộ mới
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowDecksList(false)}
                        className="text-center text-[10px] text-zinc-400 font-semibold mt-1 bg-transparent border-none cursor-pointer"
                    >
                        Hủy
                    </button>
                </div>
            )}

            {saveMessage && (
                <div
                    className={`mt-1 p-1.5 rounded-lg text-[10px] font-bold text-center ${
                        saveMessage.type === "success"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                >
                    {saveMessage.text}
                </div>
            )}
        </div>
    );
}
