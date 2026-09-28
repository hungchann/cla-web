"use client";

import React from "react";
import { SaveToNotebook } from "@/components/notebook/SaveToNotebook";
import type { VocabItem } from "../types";

interface FlashcardDeckPickerProps {
    readonly vocab: VocabItem;
}

/**
 * Nút "Lưu Flashcard" trong thẻ từ vựng khóa học.
 * Dùng chung SaveToNotebook (load đúng sổ tay cá nhân, cho đặt tên sổ tay mới).
 */
export function FlashcardDeckPicker({ vocab }: FlashcardDeckPickerProps) {
    return (
        <SaveToNotebook
            word={{
                word: vocab.word || "",
                pinyin: vocab.pinyin || "",
                meaning: vocab.meaning || "",
            }}
        />
    );
}
