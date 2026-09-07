"use client";

import React, { useState } from "react";
import { Volume2, FileText } from "lucide-react";
import DOMPurify from "dompurify";
import { speakChinese } from "@/lib/utils/speech";
import { GifStrip } from "./GifStrip";
import type { LessonTheory } from "@/lib/types/course";
import type { VocabItem } from "../types";

interface VocabTheoryStepProps {
    vocabItems: VocabItem[];
    vocabLoading: boolean;
    theory: LessonTheory | null;
    theoryLoading: boolean;
}

export function VocabTheoryStep({
    vocabItems,
    vocabLoading,
    theory,
    theoryLoading,
}: VocabTheoryStepProps) {
    const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

    return (
        <div className="w-full space-y-6">
            {/* Vocabulary Detailed Theory Cards */}
            {vocabLoading ? (
                <div className="max-w-4xl w-full mx-auto rounded-2xl border border-amber-100 bg-white p-12 shadow-2xs dark:bg-zinc-900">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
                </div>
            ) : vocabItems.length === 0 ? (
                <div className="max-w-4xl w-full mx-auto rounded-2xl border border-amber-100 bg-white p-12 text-center shadow-2xs dark:bg-zinc-900">
                    <p className="text-sm font-bold text-zinc-500">Chưa có từ vựng cho bài học này</p>
                </div>
            ) : (
                <div className="max-w-4xl w-full mx-auto space-y-5">
                    <div className="px-1">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white">Giải nghĩa từ vựng</h3>
                        <p className="text-xs font-semibold text-zinc-500">Danh sách {vocabItems.length} từ trong bài học</p>
                    </div>
                    {vocabItems.map((item, itemIndex) => {
                        const key = String(item.id ?? itemIndex);
                        const senses = item.senses?.length
                            ? item.senses
                            : [{ id: "fallback", meaning: item.meaning || "Chưa có nghĩa", examples: [] }];
                        const noteOpen = Boolean(openNotes[key]);

                        return (
                            <article
                                key={key}
                                className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                            {itemIndex + 1}
                                        </span>
                                        <GifStrip
                                            urls={item.gif_urls}
                                            fallbackUrl={item.gif_url}
                                            word={item.word || ""}
                                            itemClassName="size-12"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xl font-black tracking-wide text-zinc-900 dark:text-white">
                                                    {item.word}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => speakChinese(item.word || "")}
                                                    className="text-amber-600 hover:text-amber-700 cursor-pointer"
                                                    aria-label={`Nghe ${item.word}`}
                                                >
                                                    <Volume2 className="size-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm font-bold text-amber-600">
                                                {item.pinyin || "Chưa có pinyin"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-1.5">
                                        {Array.from(
                                            new Set(
                                                senses
                                                    .map((sense) => sense.pos_label)
                                                    .filter((pos): pos is string => Boolean(pos))
                                            )
                                        ).map((pos) => (
                                            <span
                                                key={pos}
                                                className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                            >
                                                {pos}
                                            </span>
                                        ))}
                                        {(item.note || item.gif_url) && (
                                            <button
                                                type="button"
                                                onClick={() => setOpenNotes((prev) => ({ ...prev, [key]: !prev[key] }))}
                                                className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-zinc-600 hover:border-amber-300 hover:text-amber-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                                            >
                                                {noteOpen ? "Ẩn cách viết hanzi" : "Hiện cách viết hanzi"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {noteOpen && (item.note || item.gif_url) && (
                                    <div className="mt-4 flex flex-col items-start gap-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm font-semibold leading-relaxed text-zinc-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-zinc-300 sm:flex-row sm:items-center">
                                        <GifStrip
                                            urls={item.gif_urls}
                                            fallbackUrl={item.gif_url}
                                            word={item.word || ""}
                                            itemClassName="size-24"
                                        />
                                        {item.note && <div className="flex-1 min-w-[200px]">{item.note}</div>}
                                    </div>
                                )}

                                <div className="mt-4 space-y-3">
                                    {senses.map((sense, senseIndex) => (
                                        <div key={String(sense.id ?? senseIndex)} className="space-y-2">
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                <span className="mr-2 text-amber-600">{senseIndex + 1}.</span>
                                                {sense.meaning}
                                            </p>
                                            {sense.examples?.length ? (
                                                sense.examples.map((example, exampleIndex) => (
                                                    <div
                                                        key={exampleIndex}
                                                        className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/40"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                                {example.chinese}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => speakChinese(example.chinese)}
                                                                className="shrink-0 text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Volume2 className="w-3.5 h-3.5" /> Nghe
                                                            </button>
                                                        </div>
                                                        {example.pinyin && (
                                                            <p className="mt-0.5 text-xs font-semibold text-amber-600">
                                                                {example.pinyin}
                                                            </p>
                                                        )}
                                                        {example.vietnamese && (
                                                            <p className="mt-0.5 text-xs font-medium text-zinc-500">
                                                                &rarr; {example.vietnamese}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs italic text-zinc-400">Chưa có ví dụ cho nghĩa này</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Extra Theory / Lesson Notes */}
            {theoryLoading ? (
                <div className="max-w-4xl w-full mx-auto rounded-2xl border border-amber-100 bg-white p-10 text-center shadow-2xs dark:bg-zinc-900">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
                </div>
            ) : theory && (theory.notes || theory.content || theory.image_url || theory.title) ? (
                <div className="max-w-4xl w-full mx-auto space-y-5">
                    <div className="px-1">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white">Ghi chú & giải thích</h3>
                        <p className="text-xs font-semibold text-zinc-500">Mẹo nhớ từ & lưu ý từ giáo viên</p>
                    </div>
                    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
                        {theory.title && (
                            <h4 className="mb-3 flex items-center gap-2 text-base font-black text-zinc-900 dark:text-white">
                                <FileText className="size-4 text-amber-500" />
                                {theory.title}
                            </h4>
                        )}
                        {theory.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={theory.image_url}
                                alt={theory.title || "Ảnh minh họa"}
                                className="mb-4 w-full max-h-80 rounded-xl border border-zinc-100 object-contain bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-800"
                            />
                        )}
                        {theory.notes ? (
                            <div className="whitespace-pre-line text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-300">
                                {theory.notes}
                            </div>
                        ) : theory.content ? (
                            <div
                                className="prose prose-sm max-w-none text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-300 dark:prose-invert"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        typeof window !== "undefined"
                                            ? DOMPurify.sanitize(theory.content.replace(/<!--[\s\S]*?-->/g, ""))
                                            : theory.content,
                                }}
                            />
                        ) : null}
                    </article>
                </div>
            ) : null}
        </div>
    );
}
