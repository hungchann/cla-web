"use client";

import React, { useState } from "react";
import { Volume2, RefreshCw, Target, PartyPopper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { speakChinese } from "@/lib/utils/speech";

interface DictationSentence {
    id: string | number;
    audio_url?: string;
    answer_text: string;
}

interface DictationStepProps {
    sentences: DictationSentence[];
    loading: boolean;
}

export function DictationStep({ sentences, loading }: DictationStepProps) {
    const [results, setResults] = useState<
        Record<string, { input: string; checked: boolean; score: number }>
    >({});

    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[\s\t\n\r]/g, "")
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>。，！？；：、（）《》【】]/g, "");
    };

    const setInputFor = (id: string | number, value: string) => {
        const key = String(id);
        setResults((p) => ({
            ...p,
            [key]: { ...(p[key] || { checked: false, score: 0 }), input: value },
        }));
    };

    const handleCheckSentence = (s: DictationSentence) => {
        const key = String(s.id);
        const userNorm = normalizeText(results[key]?.input || "");
        const expectedNorm = normalizeText(s.answer_text || "");

        if (!userNorm || !expectedNorm) {
            setResults((p) => ({
                ...p,
                [key]: { ...(p[key] || { input: "" }), checked: true, score: 0 },
            }));
            return;
        }

        if (userNorm === expectedNorm) {
            setResults((p) => ({
                ...p,
                [key]: { ...(p[key] || { input: "" }), checked: true, score: 100 },
            }));
            return;
        }

        // Calculate simple character match ratio
        let matches = 0;
        const expectedChars = expectedNorm.split("");
        const userChars = userNorm.split("");
        expectedChars.forEach((ch) => {
            const idx = userChars.indexOf(ch);
            if (idx !== -1) {
                matches++;
                userChars.splice(idx, 1);
            }
        });
        const score = Math.round((matches / Math.max(expectedChars.length, userNorm.length)) * 100);

        setResults((p) => ({
            ...p,
            [key]: { ...(p[key] || { input: "" }), checked: true, score },
        }));
    };

    if (loading) {
        return (
            <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl border border-amber-100 p-16 shadow-xs flex items-center justify-center dark:bg-zinc-900 dark:border-zinc-800">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl w-full mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-amber-50 pb-3 dark:border-zinc-800">
                    <h3 className="font-black text-amber-800 text-base flex items-center gap-2 dark:text-amber-400">
                        <Volume2 className="w-5 h-5 text-amber-500" /> Đề bài Nghe chép chính tả
                    </h3>
                </div>

                {sentences.length > 0 ? (
                    <div className="space-y-8">
                        {sentences.map((s, i) => {
                            const key = String(s.id);
                            const result = results[key];
                            return (
                                <div
                                    key={key}
                                    className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/30 p-5 dark:bg-zinc-800/40 dark:border-zinc-700"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-black text-xs shrink-0 dark:bg-amber-950/50 dark:text-amber-300">
                                            {i + 1}
                                        </span>
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                            Nghe và chép lại câu {i + 1}:
                                        </p>
                                    </div>

                                    {s.audio_url ? (
                                        <audio
                                            src={s.audio_url}
                                            controls
                                            preload="metadata"
                                            className="w-full h-11 rounded-lg shadow-2xs"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => speakChinese(s.answer_text)}
                                                className="w-11 h-11 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all cursor-pointer shrink-0"
                                            >
                                                <Volume2 className="w-5 h-5" />
                                            </button>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                                Phát âm thanh
                                            </span>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={result?.input || ""}
                                            onChange={(e) => setInputFor(s.id, e.target.value)}
                                            placeholder="Nhập câu tiếng Trung bạn nghe được..."
                                            disabled={result?.checked}
                                            className="w-full bg-white border-2 border-amber-200 focus:border-amber-500 focus-visible:ring-0 rounded-xl px-4 py-3 text-sm text-gray-900 font-bold placeholder-gray-400 transition-all font-mono shadow-2xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleCheckSentence(s)}
                                            disabled={result?.checked || !(result?.input || "").trim()}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 shrink-0"
                                        >
                                            Chấm điểm
                                        </Button>
                                        {result?.checked && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setResults((p) => ({
                                                        ...p,
                                                        [key]: {
                                                            ...(p[key] || { input: "" }),
                                                            checked: false,
                                                            score: 0,
                                                        },
                                                    }))
                                                }
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-5 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Làm lại
                                            </button>
                                        )}
                                    </div>

                                    {result?.checked && (
                                        <div
                                            className={`p-4 rounded-xl border shadow-2xs space-y-2 ${
                                                result.score >= 80
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
                                                    : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Target
                                                    className={`w-5 h-5 ${
                                                        result.score >= 80 ? "text-emerald-500" : "text-rose-500"
                                                    }`}
                                                />
                                                <h5 className="font-extrabold text-sm">
                                                    Kết quả: {result.score}%{" "}
                                                    {result.score === 100 ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <PartyPopper className="w-4 h-4" /> Hoàn hảo!
                                                        </span>
                                                    ) : result.score >= 80 ? (
                                                        "Chính xác!"
                                                    ) : (
                                                        "Cần luyện thêm"
                                                    )}
                                                </h5>
                                            </div>
                                            <p className="text-xs font-semibold">
                                                Đáp án chuẩn:{" "}
                                                <strong className="font-black underline font-mono">
                                                    &quot;{s.answer_text}&quot;
                                                </strong>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-sm font-bold text-zinc-500">
                            Chưa có bài nghe chép chính tả cho bài học này.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
