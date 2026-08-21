"use client";

import React, { useState, useEffect } from "react";
import { Volume2, Play, RefreshCw, Target } from "lucide-react";
import { speakChinese } from "@/lib/utils/speech";
import { FlashcardDeckPicker } from "./FlashcardDeckPicker";
import type { VocabItem } from "../types";

interface UnifiedVocabCardProps {
    vocab: VocabItem;
    isTimedActive?: boolean;
}

export function UnifiedVocabCard({ vocab, isTimedActive }: UnifiedVocabCardProps) {
    const [recordState, setRecordState] = useState<"idle" | "recording" | "done">("idle");
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [playBackState, setPlayBackState] = useState(false);
    const [pronounceProcessing, setPronounceProcessing] = useState(false);
    const [pronounceError, setPronounceError] = useState<string | null>(null);
    const [pronounceResult, setPronounceResult] = useState<{ text: string; accuracy: number } | null>(null);

    // Reset pronunciation state when vocab item changes
    useEffect(() => {
        setRecordState("idle");
        setRecordSeconds(0);
        setPlayBackState(false);
        setPronounceProcessing(false);
        setPronounceError(null);
        setPronounceResult(null);
    }, [vocab.id, vocab.word]);

    // Timer during recording (max 3 seconds)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (recordState === "recording") {
            setRecordSeconds(0);
            timer = setInterval(() => {
                setRecordSeconds((prev) => {
                    if (prev >= 3) {
                        setRecordState("done");
                        clearInterval(timer);
                        return 3;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [recordState]);

    const startPronunciation = async () => {
        setPronounceResult(null);
        setPronounceError(null);
        setPlayBackState(false);
        try {
            const { audioRecordingService } = await import("@/services/audioRecordingService");
            await audioRecordingService.startRecording();
            setRecordState("recording");
        } catch (err) {
            setPronounceError(err instanceof Error ? err.message : "Không thể bắt đầu ghi âm.");
        }
    };

    const resetPronunciation = async () => {
        setPronounceResult(null);
        setPronounceError(null);
        setPlayBackState(false);
        try {
            const { audioRecordingService } = await import("@/services/audioRecordingService");
            await audioRecordingService.resetRecorder();
        } catch {
            // ignore reset error
        }
        setRecordState("idle");
    };

    // Analyze recording when state transitions to "done"
    useEffect(() => {
        if (recordState !== "done") return;
        let cancelled = false;
        setPronounceProcessing(true);
        (async () => {
            try {
                const { audioRecordingService } = await import("@/services/audioRecordingService");
                const result = await audioRecordingService.stopRecordingAndTranscribe();
                if (cancelled) return;
                if (result.errorType || !result.text || !result.text.trim()) {
                    setPronounceError(
                        result.errorType === "empty"
                            ? "Không nhận dạng được giọng nói, hãy thử nói to và rõ hơn."
                            : "Không thể phân tích giọng nói, hãy thử lại."
                    );
                    return;
                }
                const { compareTextsAdvanced } = await import("@/services/textComparisonService");
                const comparison = compareTextsAdvanced(vocab.word || "", result.text);
                if (cancelled) return;
                setPronounceResult({ text: result.text, accuracy: Math.round(comparison.accuracy) });
            } catch {
                if (cancelled) return;
                setPronounceError("Không thể ghi âm/phân tích, hãy thử lại.");
            } finally {
                if (!cancelled) setPronounceProcessing(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [recordState, vocab.word]);

    const senses = vocab.senses?.length
        ? vocab.senses
        : [{ id: "fallback", meaning: vocab.meaning || "Chưa có nghĩa", examples: [] }];

    return (
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-2xs space-y-6 relative dark:bg-zinc-900 dark:border-zinc-800">
            {/* Top Right: Save to Flashcard */}
            <div className="absolute top-4 right-4 z-10">
                <FlashcardDeckPicker vocab={vocab} />
            </div>

            {/* Header: Word + Pinyin + Audio Listen Button + GIF stroke preview */}
            <div className="flex flex-wrap items-center gap-4 pr-32">
                <button
                    type="button"
                    onClick={() => speakChinese(vocab.word || "")}
                    className="w-12 h-12 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90 transition-transform shrink-0 dark:bg-amber-950/40 dark:border-amber-900"
                    aria-label={`Nghe phát âm ${vocab.word}`}
                >
                    <Volume2 className="w-5 h-5" />
                </button>

                {vocab.gif_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={vocab.gif_url}
                        alt={`Minh họa nét viết chữ ${vocab.word}`}
                        className="w-14 h-14 rounded-xl border border-amber-200 bg-white object-contain p-1 shadow-xs shrink-0 dark:bg-zinc-800 dark:border-zinc-700"
                    />
                )}

                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-gray-900 tracking-wide dark:text-white">
                            {vocab.word}
                        </h3>
                        {isTimedActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-950/50 dark:text-amber-300">
                                Đang phát trong video
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-amber-600 font-bold">
                        {vocab.pinyin} {vocab.meaning ? `— ${vocab.meaning}` : ""}
                    </p>
                </div>
            </div>

            {/* Meaning & Examples Section */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="font-extrabold text-amber-700 text-xs uppercase tracking-wider dark:text-amber-400">
                    Nghĩa & Ví dụ câu:
                </h4>
                <ul className="space-y-3 text-xs text-gray-700 font-semibold leading-relaxed dark:text-zinc-300">
                    {senses.map((sense, idx) => (
                        <li key={String(sense.id ?? idx)} className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-gray-900 font-bold dark:text-white">
                                <span className="text-amber-600">{idx + 1}.</span>
                                <span>{sense.meaning}</span>
                                {sense.pos_label && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded dark:bg-zinc-800 dark:text-zinc-300 uppercase">
                                        {sense.pos_label}
                                    </span>
                                )}
                            </div>
                            {sense.examples?.map((ex, j) => (
                                <div
                                    key={j}
                                    className="bg-gray-50 dark:bg-zinc-800/60 px-3 py-2 rounded-xl font-mono flex items-center justify-between gap-2 border border-gray-100 dark:border-zinc-700/60"
                                >
                                    <div>
                                        <p className="text-zinc-800 dark:text-zinc-200 font-semibold">{ex.chinese}</p>
                                        {ex.pinyin && <p className="text-[11px] text-amber-600">{ex.pinyin}</p>}
                                        {ex.vietnamese && (
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                &rarr; {ex.vietnamese}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => speakChinese(ex.chinese)}
                                        className="text-amber-600 hover:text-amber-700 text-xs cursor-pointer select-none font-bold shrink-0 inline-flex items-center gap-1 bg-white dark:bg-zinc-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-600"
                                    >
                                        <Volume2 className="w-3.5 h-3.5" /> Nghe
                                    </button>
                                </div>
                            ))}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Pronunciation Recording Practice Section */}
            <div className="flex flex-col items-center justify-center py-5 bg-gray-50/60 dark:bg-zinc-800/40 rounded-xl gap-3 border border-dashed border-gray-200 dark:border-zinc-700">
                {recordState === "idle" && (
                    <>
                        <button
                            type="button"
                            onClick={startPronunciation}
                            className="w-14 h-14 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                            aria-label="Bắt đầu ghi âm phát âm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
                            </svg>
                        </button>
                        <span className="text-xs text-gray-400 font-bold dark:text-zinc-400">
                            Nhấn nút đỏ để luyện phát âm từ này
                        </span>
                        {pronounceError && (
                            <p className="text-[11px] text-rose-600 font-bold max-w-xs text-center">
                                {pronounceError}
                            </p>
                        )}
                    </>
                )}

                {recordState === "recording" && (
                    <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setRecordState("done")}
                            className="w-14 h-14 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 animate-pulse cursor-pointer"
                            aria-label="Dừng ghi âm"
                        >
                            <span className="w-5 h-5 bg-white rounded-xs" />
                        </button>
                        <p className="text-xs font-bold text-rose-600 tracking-wider animate-pulse">
                            ĐANG GHI ÂM: {recordSeconds}s / 3s
                        </p>
                    </div>
                )}

                {recordState === "done" && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setPlayBackState(true);
                                    speakChinese(vocab.word || "");
                                    setTimeout(() => setPlayBackState(false), 1200);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer inline-flex items-center"
                            >
                                {playBackState ? (
                                    <>
                                        <Volume2 className="w-4 h-4 mr-1.5" /> Đang phát...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-1.5" /> Nghe lại
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={resetPronunciation}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200 text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer inline-flex items-center"
                            >
                                <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Ghi lại
                            </button>
                        </div>
                        {pronounceProcessing ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 animate-pulse">
                                <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                Đang phân tích phát âm...
                            </div>
                        ) : pronounceError ? (
                            <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-rose-700 font-extrabold text-xs max-w-xs text-center dark:bg-rose-950/40 dark:border-rose-900">
                                {pronounceError}
                            </div>
                        ) : pronounceResult ? (
                            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-3 text-emerald-800 font-extrabold text-xs dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                                <Target className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <p>
                                        Điểm phát âm: {pronounceResult.accuracy}/100 (
                                        {pronounceResult.accuracy >= 85
                                            ? "Xuất sắc"
                                            : pronounceResult.accuracy >= 70
                                            ? "Khá tốt"
                                            : "Cần luyện thêm"}
                                        )
                                    </p>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                        Bạn nói: {pronounceResult.text}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-emerald-800 font-extrabold text-xs">
                                Đang xử lý...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
