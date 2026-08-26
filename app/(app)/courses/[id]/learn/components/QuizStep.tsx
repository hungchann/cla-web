"use client";

import React, { useState } from "react";
import { Volume2, PartyPopper, XCircle } from "lucide-react";
import { speakChinese } from "@/lib/utils/speech";
import { playAnswerFeedback } from "@/services/audioFeedback";
import type { QuizExercise } from "../types";

interface QuizStepProps {
    readonly exercises: QuizExercise[];
    readonly loading: boolean;
    readonly currentIndex: number;
    readonly onIndexChange: (idx: number) => void;
    /** Gọi khi người dùng trả lời câu cuối cùng (dùng để đếm bài hoàn thành cho free quota). */
    readonly onComplete?: () => void;
}

export function QuizStep({
    exercises,
    loading,
    currentIndex,
    onIndexChange,
    onComplete,
}: QuizStepProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const currentQuiz = exercises[currentIndex] || null;

    const handleSelect = (option: string) => {
        if (selectedAnswer) return;
        setSelectedAnswer(option);
        playAnswerFeedback(Boolean(currentQuiz && option === currentQuiz.Correct_answer));
        if (currentIndex >= exercises.length - 1) {
            onComplete?.();
        }
    };

    const handleReset = () => {
        setSelectedAnswer(null);
    };

    const handleNext = () => {
        handleReset();
        if (currentIndex < exercises.length - 1) {
            onIndexChange(currentIndex + 1);
        }
    };

    const getSelectedLabel = (selected: string | null) => {
        if (!selected || !currentQuiz) return "";
        const key = `answer_${selected}` as keyof typeof currentQuiz;
        return currentQuiz[key] || "";
    };

    if (loading) {
        return (
            <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl border border-amber-100 p-12 shadow-xs flex items-center justify-center dark:bg-zinc-900 dark:border-zinc-800">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!currentQuiz) {
        return (
            <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl border border-amber-100 p-12 shadow-xs text-center text-zinc-500 font-bold text-sm dark:bg-zinc-900 dark:border-zinc-800">
                {exercises.length === 0 ? "Chưa có câu hỏi trắc nghiệm" : "Đang tải..."}
            </div>
        );
    }

    return (
        <div className="max-w-2xl w-full mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-amber-50 pb-4 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm dark:bg-amber-950/50 dark:text-amber-300">
                            Q{currentIndex + 1}
                        </span>
                        <h3 className="font-extrabold text-gray-900 text-sm md:text-base dark:text-white">
                            {currentQuiz.question || "Câu hỏi"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentQuiz.audio_url && (
                            <audio src={currentQuiz.audio_url} controls preload="none" className="h-9 max-w-44" />
                        )}
                        <button
                            type="button"
                            onClick={() => speakChinese(currentQuiz.question || "")}
                            className="w-10 h-10 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90 transition-transform dark:bg-zinc-800 dark:border-zinc-700"
                            title="Nghe câu hỏi"
                        >
                            <Volume2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                        const answerKey = `answer_${key}` as keyof typeof currentQuiz;
                        const val = currentQuiz[answerKey] || "";
                        const correctKey = currentQuiz.Correct_answer;
                        const isSelected = selectedAnswer === key;
                        let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200";

                        if (isSelected) {
                            if (key === correctKey) {
                                btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300";
                            } else {
                                btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500 dark:bg-rose-950/40 dark:text-rose-300";
                            }
                        } else if (selectedAnswer && key === correctKey) {
                            btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                        }

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSelect(key)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer ${btnStyle}`}
                            >
                                <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0 select-none text-gray-600 font-black dark:bg-zinc-700 dark:text-zinc-300">
                                    {key}
                                </span>
                                <span>{val}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedAnswer && (
                    <div
                        className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${
                            selectedAnswer === currentQuiz.Correct_answer
                                ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200"
                                : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200"
                        }`}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            {selectedAnswer === currentQuiz.Correct_answer ? (
                                <span className="flex items-center gap-1.5">
                                    <PartyPopper className="w-4 h-4 text-emerald-500" /> Chính xác!
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-500" /> Sai rồi! Thử lại xem nhé.
                                </span>
                            )}
                        </div>
                        {currentQuiz.Explanation && (
                            <p>
                                <strong>Giải thích:</strong> {currentQuiz.Explanation}
                            </p>
                        )}
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                            Đáp án đúng:{" "}
                            <strong className="text-emerald-700 dark:text-emerald-400">
                                {currentQuiz.Correct_answer}. {currentQuiz[`answer_${currentQuiz.Correct_answer}` as keyof typeof currentQuiz]}
                            </strong>{" "}
                            | Đáp án của bạn:{" "}
                            <strong className={selectedAnswer === currentQuiz.Correct_answer ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
                                {selectedAnswer}. {getSelectedLabel(selectedAnswer)}
                            </strong>
                        </p>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold cursor-pointer dark:text-zinc-400 dark:hover:text-amber-400"
                        >
                            Thử lại câu này
                        </button>
                    </div>
                )}

                <div className="flex justify-between pt-4 border-t border-gray-50 dark:border-zinc-800 select-none">
                    {exercises.length > 1 && (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={currentIndex >= exercises.length - 1}
                            className="text-xs font-black text-gray-500 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 dark:text-zinc-400 dark:hover:text-amber-400"
                        >
                            Câu tiếp →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
