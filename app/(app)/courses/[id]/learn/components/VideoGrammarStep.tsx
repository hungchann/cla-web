"use client";

import React, { useRef } from "react";
import type { SubtitleItem } from "../types";

interface VideoGrammarStepProps {
    videoSource: string | null;
    videoLoading: boolean;
    subtitles: SubtitleItem[];
    currentTime: number;
    onTimeUpdate: (time: number) => void;
}

export function VideoGrammarStep({
    videoSource,
    videoLoading,
    subtitles,
    currentTime,
    onTimeUpdate,
}: VideoGrammarStepProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const activeGrammarSub = subtitles.find(
        (sub) => currentTime >= (sub.start || 0) && currentTime <= (sub.end || 9999)
    );

    return (
        <div className="max-w-2xl w-full mx-auto space-y-6">
            <div className="space-y-6">
                {/* Video Player */}
                <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-black group border border-gray-200">
                    {videoLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : videoSource ? (
                        <video
                            ref={videoRef}
                            src={videoSource}
                            controls
                            controlsList="nodownload"
                            className="h-full w-full object-contain"
                            onTimeUpdate={() => {
                                if (videoRef.current) {
                                    onTimeUpdate(videoRef.current.currentTime);
                                }
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white/70">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <p className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                                Chưa có video ngữ pháp cho bài học này
                            </p>
                        </div>
                    )}
                </div>

                {/* Subtitle / Realtime Grammar Explanation */}
                <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-2xs space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
                    <h4 className="font-extrabold text-amber-700 text-sm border-b border-amber-50 pb-2 dark:border-zinc-800 dark:text-amber-400">
                        Giải thích chi tiết (Đang phát theo video)
                    </h4>
                    <div className="space-y-3.5 text-xs text-gray-700 font-semibold leading-relaxed dark:text-zinc-300">
                        {activeGrammarSub ? (
                            <div>
                                {activeGrammarSub.rawText ? (
                                    <div className="bg-amber-50/60 text-amber-950 dark:bg-amber-950/20 dark:text-amber-200 p-4 rounded-xl border-l-4 border-amber-500 font-semibold leading-relaxed whitespace-pre-line text-sm">
                                        {activeGrammarSub.rawText}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-zinc-800 dark:text-white mb-2">
                                            Chữ Hán: {activeGrammarSub.chinese}{" "}
                                            {activeGrammarSub.pinyin && `(${activeGrammarSub.pinyin})`}
                                        </p>
                                        <p className="bg-amber-50/60 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200 p-3.5 rounded-xl border-l-4 border-amber-500 font-semibold leading-relaxed">
                                            {activeGrammarSub.vietnamese}
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <p className="text-zinc-400 italic">
                                Phát video để xem giải thích ngữ pháp tương ứng chạy theo thời gian thực.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
