import React from "react";
import { Volume2, User, Mic, MessageCircle } from "lucide-react";
import HighlightedText from "@/components/HighlightedText";

interface ConvMessage {
    id: string | number;
    speaker?: string;
    chinese_text: string;
    pinyin?: string;
    vietnamese_text?: string;
    recording?: {
        state: { isRecording: boolean; isProcessing: boolean };
        comparison?: { accuracy: number; highlightedText: any[] };
        result?: { text: string };
    };
}

interface ConversationStepProps {
    loading: boolean;
    visibleMessages: ConvMessage[];
    hasMoreMessages: boolean;
    activeRecordingId: string | number | null;
    onSpeak: (text: string) => void;
    onToggleRecording: (id: string | number) => void;
    onContinue: () => void;
    convEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ConversationStep({
    loading,
    visibleMessages,
    hasMoreMessages,
    activeRecordingId,
    onSpeak,
    onToggleRecording,
    onContinue,
    convEndRef,
}: ConversationStepProps) {
    return (
        <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto space-y-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-10 h-10 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
                    <p className="text-xs font-bold text-zinc-500">Đang tải kịch bản hội thoại AI...</p>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-6 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
                    {visibleMessages.map((msg) => {
                        const isSpeakerA = msg.speaker?.toUpperCase() === "A";
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 w-full ${isSpeakerA ? "justify-start" : "justify-end"}`}
                            >
                                {isSpeakerA && (
                                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-sm dark:bg-zinc-800">
                                        <User className="w-6 h-6 text-zinc-400" />
                                    </div>
                                )}

                                <div className="max-w-md flex flex-col gap-2">
                                    <div
                                        className={`rounded-2xl p-4 shadow-sm relative ${
                                            isSpeakerA
                                                ? "bg-white border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700"
                                                : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                        }`}
                                    >
                                        <p className="font-bold text-sm leading-relaxed">{msg.chinese_text}</p>
                                        {msg.pinyin && (
                                            <p
                                                className={`text-[11px] leading-relaxed ${
                                                    isSpeakerA ? "text-zinc-500" : "text-white/80 italic"
                                                }`}
                                            >
                                                {msg.pinyin}
                                            </p>
                                        )}
                                        {msg.vietnamese_text && (
                                            <p
                                                className={`text-xs leading-relaxed ${
                                                    isSpeakerA ? "text-zinc-400 font-medium" : "text-amber-100 font-semibold"
                                                }`}
                                            >
                                                {msg.vietnamese_text}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => onSpeak(msg.chinese_text)}
                                                className={`text-xs cursor-pointer inline-flex items-center gap-1 ${
                                                    isSpeakerA
                                                        ? "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                                        : "text-white/80 hover:text-white"
                                                }`}
                                            >
                                                <Volume2 className="w-3.5 h-3.5" /> Phát âm mẫu
                                            </button>
                                        </div>
                                    </div>

                                    {/* User's turn recording & speech comparison */}
                                    {!isSpeakerA && (
                                        <div className="flex flex-col gap-2 p-3 bg-white border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl shadow-2xs">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-[10px] font-bold text-zinc-400 select-none">
                                                    Luyện nói câu này:
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => onToggleRecording(msg.id)}
                                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                                                        activeRecordingId === msg.id && msg.recording?.state.isRecording
                                                            ? "bg-rose-500 text-white animate-pulse"
                                                            : msg.recording?.state.isProcessing
                                                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500 hover:bg-amber-200 cursor-pointer"
                                                    }`}
                                                    disabled={msg.recording?.state.isProcessing}
                                                >
                                                    {activeRecordingId === msg.id && msg.recording?.state.isRecording ? (
                                                        <>
                                                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                                                            Dừng nói
                                                        </>
                                                    ) : msg.recording?.state.isProcessing ? (
                                                        <>
                                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 border-t-amber-600 animate-spin" />
                                                            Đang xử lý giọng...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mic className="w-4 h-4 inline mr-1.5" /> Nhấp để nói
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {msg.recording?.comparison && (
                                                <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-zinc-500 select-none">
                                                            Phân tích giọng nói:
                                                        </span>
                                                        <span
                                                            className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                                                                msg.recording.comparison.accuracy >= 80
                                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500"
                                                                    : "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-500"
                                                            }`}
                                                        >
                                                            Độ chính xác: {Math.round(msg.recording.comparison.accuracy)}%
                                                        </span>
                                                    </div>

                                                    <div className="py-2 px-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                                        <HighlightedText
                                                            text={msg.chinese_text}
                                                            highlightedWords={msg.recording.comparison.highlightedText}
                                                            showPinyin={true}
                                                            segmentedWords={msg.chinese_text.split("").map((c) => ({
                                                                word: c,
                                                                pinyin: "",
                                                            }))}
                                                        />
                                                    </div>

                                                    {msg.recording.result?.text && (
                                                        <p className="text-[10px] text-zinc-400 italic">
                                                            AI nghe được: &quot;{msg.recording.result.text}&quot;
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {!isSpeakerA && (
                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-sm dark:bg-amber-950/50">
                                        <User className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={convEndRef} />
                </div>
            )}

            <div className="flex justify-between items-center w-full pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {hasMoreMessages && !loading && (
                    <button
                        type="button"
                        onClick={onContinue}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                    >
                        Xem câu thoại tiếp theo <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
