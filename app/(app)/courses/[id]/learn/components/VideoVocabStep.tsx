import React, { useRef } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { UnifiedVocabCard } from "./UnifiedVocabCard";
import { srtTimeToSeconds, type VocabItem, type SubtitleItem } from "../types";

interface VideoVocabStepProps {
    videoSource: string | null;
    videoLoading: boolean;
    subtitles: SubtitleItem[];
    currentTime: number;
    onTimeUpdate: (time: number) => void;
    vocabItems: VocabItem[];
    vocabLoading: boolean;
    selectedVocabIdx: number;
    onSelectVocab: (idx: number) => void;
}

export function VideoVocabStep({
    videoSource,
    videoLoading,
    subtitles,
    currentTime,
    onTimeUpdate,
    vocabItems,
    vocabLoading,
    selectedVocabIdx,
    onSelectVocab,
}: VideoVocabStepProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // activeTimedVocab = từ vựng đang đến thời điểm hiện tại của video
    const activeTimedVocab = vocabItems.find((item) => {
        const start = srtTimeToSeconds(item.time_start);
        const end = srtTimeToSeconds(item.time_end);
        if (!start && !end) return false;
        return currentTime >= start && (!end || currentTime <= end);
    });

    const activeVocabSub = subtitles.find(
        (sub) => currentTime >= sub.start && currentTime <= (sub.end || 9999)
    );

    const jumpToVocabTime = (item: VocabItem) => {
        const t = srtTimeToSeconds(item.time_start);
        if (t && videoRef.current) {
            videoRef.current.currentTime = t;
            videoRef.current.play().catch(() => {});
        }
    };

    const currentVocab = activeTimedVocab || vocabItems[selectedVocabIdx] || null;

    return (
        <div className="max-w-2xl w-full mx-auto space-y-6">
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
                        preload="metadata"
                        className="h-full w-full object-contain"
                        onTimeUpdate={() => {
                            if (videoRef.current) {
                                onTimeUpdate(videoRef.current.currentTime);
                            }
                        }}
                    />
                ) : (
                    <>
                        <Image
                            src="/images/student_cafe.png"
                            alt="Lesson Video Stream"
                            fill
                            className="object-cover opacity-50"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white/70">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <p className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                                Chưa có video cho bài học này
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Subtitle Display */}
            {activeVocabSub && (
                <div className="bg-black/90 text-white rounded-2xl border border-zinc-800 p-4 shadow-2xs space-y-1">
                    {activeVocabSub.rawText ? (
                        <p className="text-sm font-semibold leading-relaxed text-zinc-100 whitespace-pre-line">
                            {activeVocabSub.rawText}
                        </p>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-amber-400">
                                {activeVocabSub.chinese}
                                {activeVocabSub.pinyin && (
                                    <span className="ml-2 text-xs font-semibold text-zinc-400">
                                        {activeVocabSub.pinyin}
                                    </span>
                                )}
                            </p>
                            {activeVocabSub.vietnamese && (
                                <p className="text-xs font-semibold text-zinc-300">
                                    &rarr; {activeVocabSub.vietnamese}
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Vocab Items / Timeline Pills & Unified Vocab Card */}
            {vocabLoading ? (
                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-2xs flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !currentVocab ? (
                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-2xs text-center">
                    <p className="text-sm font-bold text-zinc-500">
                        Chưa có từ vựng cho bài học này
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Word Timeline Pills */}
                    {vocabItems.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {vocabItems.map((item, i) => {
                                const isActive = activeTimedVocab && String(activeTimedVocab.id) === String(item.id);
                                const isSelected = i === selectedVocabIdx;
                                return (
                                    <button
                                        key={String(item.id)}
                                        type="button"
                                        onClick={() => {
                                            onSelectVocab(i);
                                            jumpToVocabTime(item);
                                        }}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                                            isSelected || isActive
                                                ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                                        }`}
                                    >
                                        {item.word}
                                        {isActive && <Play className="w-3 h-3 inline ml-1" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Single Unified Vocab & Pronunciation Card */}
                    <UnifiedVocabCard
                        vocab={currentVocab}
                        isTimedActive={Boolean(activeTimedVocab && String(activeTimedVocab.id) === String(currentVocab.id))}
                    />
                </div>
            )}
        </div>
    );
}
