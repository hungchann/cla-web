"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PremiumGate } from "@/components/PremiumGate";
import { useQuery } from "@tanstack/react-query";
import { speakingApi } from "@/api/speaking";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import { useRouter } from "next/navigation";
import { getAssetUrl } from "@/lib/utils/assets";
import { PageContainer } from "@/components/PageContainer";

// Shadcn UI Components
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lucide Icons
import {
    Mic,
    Volume2,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    Crown,
    Check,
    AlertCircle,
    Loader2,
    Inbox,
    Award,
    Sparkles,
    RefreshCw,
    Home,
    User,
    Flame,
    Target
} from "lucide-react";

interface SpeakingTopic {
    id: string;
    title: string;
    description: string;
    level: string;
    image_cover?: {
        filename_disk: string | null;
    } | null;
}

interface SpeakingCategory {
    id: string;
    title: string;
    description: string;
    level: string;
    image_cover?: {
        filename_disk: string | null;
    } | null;
}

export default function SpeakingPage() {
    const router = useRouter();

    // Mode: "topics" | "scenarios" | "practice" | "result"
    const [mode, setMode] = useState<"topics" | "scenarios" | "practice" | "result">("topics");

    const [selectedTopic, setSelectedTopic] = useState<SpeakingTopic | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<SpeakingCategory | null>(null);

    // Stats result state
    const [resultStats, setResultStats] = useState<{
        totalSpeakerB: number;
        completedSpeakerB: number;
        averageAccuracy: number;
        completedItems: number;
        totalItems: number;
    } | null>(null);

    // --- 1. Fetch Speaking Topics ---
    const { data: topics, isLoading: topicsLoading } = useQuery({
        queryKey: ["speaking-topics"],
        queryFn: speakingApi.getSpeakingModules,
    });

    // --- 2. Fetch Scenarios / Categories under Selected Topic ---
    const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
        queryKey: ["speaking-categories", selectedTopic?.id],
        queryFn: () => speakingApi.getSpeakingCategories(selectedTopic!.id),
        enabled: !!selectedTopic?.id,
    });

    // --- 3. Practice Details using standard hook ---
    const conversationId = selectedCategory?.id ?? null;
    const {
        items,
        loading: practiceLoading,
        errorMessage,
        visibleCount,
        visibleMessages,
        activeRecordingId,
        isPremium,
        premiumModalVisible,
        setPremiumModalVisible,
        handleSpeak,
        handleToggleRecording,
        computeSpeakerBStats,
        handleContinue,
    } = useConversationDetail(conversationId);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of conversation
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleCount, visibleMessages]);

    const handleTopicSelect = (topic: SpeakingTopic) => {
        setSelectedTopic(topic);
        setMode("scenarios");
    };

    const handleCategorySelect = (category: SpeakingCategory) => {
        setSelectedCategory(category);
        setMode("practice");
    };

    const handleFinishPractice = () => {
        const stats = computeSpeakerBStats();
        setResultStats({
            totalSpeakerB: stats.totalSpeakerB,
            completedSpeakerB: stats.completedSpeakerB,
            averageAccuracy: Math.round(stats.averageAccuracy),
            completedItems: visibleCount,
            totalItems: items.length,
        });
        setMode("result");
    };

    const handleRestart = () => {
        setMode("practice");
        // Reload topic detail by resetting selectedCategory briefly
        const cat = selectedCategory;
        setSelectedCategory(null);
        setTimeout(() => setSelectedCategory(cat), 50);
    };

    return (
        <PageContainer>
            <PremiumGate
                isOpen={!!premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                feature="tính năng AI luyện nói phản xạ"
            />
            <PageHeader
                title="AI Luyện Nói Phản Xạ"
                description="Cải thiện khả năng phản xạ và phát âm tiếng Trung của bạn. Nói chuyện trực tiếp với giáo viên AI, nhận phân tích so sánh độ chính xác từng từ."
                icon={<Mic className="w-7 h-7" />}
            />

            {/* 1. TOPICS GRID VIEW */}
            {mode === "topics" && (
                <div className="space-y-6 flex-1">
                    <h2 className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                        Chọn chủ đề luyện nói
                    </h2>
                    {topicsLoading ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                            {[1, 2, 3].map(n => (
                                <Skeleton key={n} className="h-60 rounded-2xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {topics?.map((topic: SpeakingTopic) => (
                                <Card
                                    key={topic.id}
                                    onClick={() => handleTopicSelect(topic)}
                                    className="group cursor-pointer overflow-hidden rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-amber-900 flex flex-col h-full"
                                >
                                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getAssetUrl(topic.image_cover?.filename_disk)}
                                            alt={topic.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <Badge className="absolute bottom-2 left-2 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 border-none px-3 py-0.5 text-[10px] uppercase tracking-wider shadow-sm">
                                            {topic.level || "HSK"}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                                        <div className="space-y-2">
                                            <CardTitle className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-base tracking-tight">
                                                {topic.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                                {topic.description}
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" className="w-full text-xs font-bold text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl cursor-pointer">
                                            Khám phá tình huống
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. SCENARIOS GRID VIEW */}
            {mode === "scenarios" && selectedTopic && (
                <div className="space-y-6 flex-1">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode("topics")}
                            className="text-xs font-bold text-zinc-400 hover:text-zinc-650 flex items-center gap-1 cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách chủ đề
                        </Button>
                        <Badge variant="outline" className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full uppercase border-amber-200">
                            {selectedTopic.title}
                        </Badge>
                    </div>

                    {categoriesLoading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {[1, 2].map(n => (
                                <Skeleton key={n} className="h-44 rounded-2xl" />
                            ))}
                        </div>
                    ) : categories && categories.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {categories.map((category: SpeakingCategory) => (
                                <Card
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category)}
                                    className="group cursor-pointer rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-amber-900 p-5 flex items-start gap-4"
                                >
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getAssetUrl(category.image_cover?.filename_disk)}
                                            alt={category.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-600 transition-colors">
                                            {category.title}
                                        </CardTitle>
                                        <CardDescription className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                                            {category.description}
                                        </CardDescription>
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-bold mt-1">
                                            Bắt đầu hội thoại <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                            <Inbox className="w-10 h-10 text-zinc-300" />
                            <p className="text-xs font-bold text-zinc-400">Không tìm thấy tình huống nào cho chủ đề này.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 3. CONVERSATIONAL PRACTICE VIEW */}
            {mode === "practice" && selectedCategory && (
                <Card className="flex-1 flex flex-col rounded-2xl shadow-sm overflow-hidden h-[600px] border border-amber-950/10 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900">
                    {/* Practice Top Header */}
                    <div className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-amber-500 tracking-wider uppercase">Tình huống nói</span>
                            <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white line-clamp-1">
                                {selectedCategory.title}
                            </CardTitle>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setMode("scenarios")}
                            className="rounded-xl text-xs font-bold cursor-pointer transition-all"
                        >
                            Thoát luyện tập
                        </Button>
                    </div>

                    {/* Chat Messages Log Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-950/10"
                    >
                        {practiceLoading && visibleMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                <p className="text-xs font-bold text-zinc-400">Đang chuẩn bị hội thoại...</p>
                            </div>
                        ) : (
                            <>
                                {errorMessage && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                {visibleMessages.map((message) => {
                                    const isSpeakerA = message.speaker?.toUpperCase() === "A";
                                    const bubbleBg = isSpeakerA
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                        : "bg-amber-600 text-white shadow-xs";

                                    const wordHighlightStyle = (detail: any) => {
                                        if (detail.isCorrect) return "text-emerald-500 dark:text-emerald-450 font-extrabold";
                                        if (detail.isMissing) return "text-amber-500 dark:text-amber-400 line-through decoration-2 decoration-amber-500";
                                        return "text-rose-500 font-extrabold"; // Extra / wrong
                                    };

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex items-start gap-3 w-full max-w-[85%] ${isSpeakerA ? "self-start mr-auto" : "self-end ml-auto flex-row-reverse"
                                                }`}
                                        >
                                            {/* Speaker Avatar Icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${isSpeakerA ? "bg-amber-100 text-amber-700" : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300"
                                                }`}>
                                                {isSpeakerA ? (
                                                    <span className="font-extrabold text-[11px]">A</span>
                                                ) : (
                                                    <User className="w-3.5 h-3.5" />
                                                )}
                                            </div>

                                            {/* Message Bubble Container */}
                                            <div className={`rounded-2xl p-4 space-y-2 flex-1 min-w-0 ${bubbleBg}`}>
                                                {/* Chinese Text with audio play icon */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-base font-bold leading-normal tracking-wide whitespace-pre-wrap break-words">
                                                        {message.chinese_text}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleSpeak(message.chinese_text)}
                                                        className="h-7 w-7 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 text-current"
                                                    >
                                                        <Volume2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Pinyin */}
                                                <p className={`text-xs italic ${isSpeakerA ? "text-zinc-550" : "text-amber-100"}`}>
                                                    {message.pinyin}
                                                </p>

                                                {/* Vietnamese Translation */}
                                                <p className={`text-[13px] font-medium border-t pt-1.5 ${isSpeakerA ? "text-zinc-650 border-zinc-200/50" : "text-amber-50 border-amber-400/20"}`}>
                                                    {message.vietnamese_text}
                                                </p>

                                                {/* USER PRACTICE RECORD CONTROLS (Only visible for B's bubbles) */}
                                                {message.speaker?.toUpperCase() === "B" && (
                                                    <div className="mt-4 pt-3 border-t border-amber-400/20 space-y-3">
                                                        {/* Toggle Recording Button */}
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {activeRecordingId === message.id ? (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleToggleRecording(message.id)}
                                                                    className="bg-amber-100 hover:bg-amber-250 text-amber-700 rounded-full font-extrabold text-[11px] animate-pulse flex items-center gap-1.5 shadow-3xs cursor-pointer"
                                                                >
                                                                    <Mic className="w-3.5 h-3.5" />
                                                                    <span>Đang thu (Nhấn để dừng)</span>
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleToggleRecording(message.id)}
                                                                    className="bg-white hover:bg-amber-50 text-amber-600 rounded-full font-extrabold text-[11px] flex items-center gap-1.5 shadow-3xs cursor-pointer border border-none"
                                                                >
                                                                    <Mic className="w-3.5 h-3.5" />
                                                                    <span>Nhấn để ghi âm nói</span>
                                                                </Button>
                                                            )}

                                                            {message.recording?.state.isProcessing && activeRecordingId === message.id && (
                                                                <span className="text-[10px] font-bold text-rose-100 flex items-center gap-1 animate-pulse">
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                    Đang phân tích phát âm...
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Recording Error Feedback */}
                                                        {message.recording?.state.error && activeRecordingId === message.id && (
                                                            <p className="text-[10px] text-rose-200 font-bold bg-black/10 px-3 py-1.5 rounded-lg leading-relaxed flex items-center gap-1.5">
                                                                <AlertCircle className="w-3.5 h-3.5 text-rose-200" />
                                                                <span>Lỗi: {message.recording.state.error}</span>
                                                            </p>
                                                        )}

                                                        {/* AI Accuracy scoring */}
                                                        {message.recording?.result && (
                                                            <div className="bg-black/10 p-3 rounded-xl space-y-2 text-[11px]">
                                                                {message.recording.result.errorType === "empty" ? (
                                                                    <p className="text-rose-100 leading-relaxed font-bold flex items-center gap-1.5">
                                                                        <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
                                                                        <span>Không nhận dạng được âm thanh. Hãy thử nói lại to và rõ ràng hơn.</span>
                                                                    </p>
                                                                ) : message.recording.comparison ? (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold">
                                                                            <span>Phân tích giọng nói</span>
                                                                            <span className="text-emerald-300 text-xs">
                                                                                Độ chính xác: {Math.round(message.recording.comparison.accuracy)}%
                                                                            </span>
                                                                        </div>

                                                                        <p className="text-rose-50 text-[10px]">
                                                                            Đúng: {message.recording.comparison.correctWords.length} |
                                                                            Thiếu: {message.recording.comparison.missingWords.length} |
                                                                            Thừa: {message.recording.comparison.extraWords.length}
                                                                        </p>

                                                                        {/* Highlighted text mapping */}
                                                                        <div className="flex flex-wrap gap-1.5 bg-white/10 p-2 rounded-lg mt-1.5">
                                                                            {message.recording.comparison.wordDetails?.map((detail: any, idx: number) => (
                                                                                <span key={idx} className={wordHighlightStyle(detail)}>
                                                                                    {detail.word || detail.expected}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <p className="text-zinc-300 italic">Bản dịch ghi âm của bạn:</p>
                                                                        <p className="font-bold text-white mt-0.5">{message.recording.result.text}</p>
                                                                        {!isPremium && (
                                                                            <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between flex-wrap gap-1 text-[10px]">
                                                                                <span className="text-rose-200">Chấm điểm phát âm chi tiết là tính năng Premium.</span>
                                                                                <button
                                                                                    onClick={() => setPremiumModalVisible(true)}
                                                                                    className="text-amber-300 font-extrabold underline cursor-pointer"
                                                                                >
                                                                                    Nâng cấp Premium
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Practice bottom control bar */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                        <span className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500">
                            Hội thoại: {visibleCount} / {items.length} câu
                        </span>

                        <div className="flex items-center gap-3">
                            {visibleCount < items.length ? (
                                <Button
                                    onClick={handleContinue}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <span>Tiếp tục</span> <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleFinishPractice}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer animate-bounce"
                                >
                                    Hoàn thành luyện nói
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* 4. PERFORMANCE RESULTS OVERVIEW */}
            {mode === "result" && resultStats && selectedCategory && (
                <Card className="flex-1 bg-white/90 dark:bg-zinc-900 border border-amber-950/10 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 flex flex-col items-center max-w-xl mx-auto">
                    {/* Circular success indicator banner */}
                    <div className="bg-rose-500 text-white text-center w-full p-6 rounded-2xl space-y-2 shrink-0 select-none">
                        <Award className="w-10 h-10 text-white mx-auto animate-bounce" />
                        <CardTitle className="text-lg font-black tracking-tight text-white">Cực Kỳ Tuyệt Vời!</CardTitle>
                        <CardDescription className="text-xs text-rose-100">
                            Bạn đã hoàn thành luyện hội thoại &quot;{selectedCategory.title}&quot;
                        </CardDescription>
                    </div>

                    {/* Stat figures */}
                    <div className="w-full space-y-4">
                        <h3 className="text-xs font-black uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">
                            Bảng kết quả
                        </h3>

                        <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 p-5 rounded-2xl space-y-3.5 text-xs font-semibold">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Tổng số câu luyện nói:</span>
                                <span className="font-bold text-zinc-950 dark:text-zinc-50">{resultStats.totalSpeakerB}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Số câu bạn đã ghi âm:</span>
                                <span className="font-bold text-rose-600">
                                    {resultStats.completedSpeakerB} / {resultStats.totalSpeakerB}
                                </span>
                            </div>

                            {resultStats.completedSpeakerB > 0 && (
                                <div className="space-y-2.5 pt-2.5 border-t border-zinc-200/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Độ chính xác trung bình:</span>
                                        <span className={`font-black text-sm ${resultStats.averageAccuracy >= 80 ? "text-emerald-500" :
                                                resultStats.averageAccuracy >= 60 ? "text-amber-500" : "text-rose-500"
                                            }`}>
                                            {resultStats.averageAccuracy}%
                                        </span>
                                    </div>

                                    {/* Visual progress bar */}
                                    <Progress value={resultStats.averageAccuracy} className="h-2" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback detailed assessment */}
                    <div className="w-full bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30 rounded-2xl p-5 space-y-2 text-xs">
                        <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            {resultStats.averageAccuracy >= 90 ? (
                                <>
                                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Bậc thầy phát âm!</span>
                                </>
                            ) : resultStats.averageAccuracy >= 80 ? (
                                <>
                                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Rất Tốt!</span>
                                </>
                            ) : resultStats.averageAccuracy >= 70 ? (
                                <>
                                    <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Khá Tốt!</span>
                                </>
                            ) : (
                                <>
                                    <Target className="w-4 h-4 text-rose-500 shrink-0" />
                                    <span>Hãy Kiên Trì!</span>
                                </>
                            )}
                        </h4>
                        <p className="text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium">
                            {resultStats.averageAccuracy >= 90 ? "Phát âm của bạn cực kỳ chuẩn xác và tự nhiên. Thể hiện tuyệt vời giọng đọc như người bản xứ!" :
                                resultStats.averageAccuracy >= 80 ? "Phát âm của bạn rất tốt, chỉ sai lệch một số từ nhỏ do nhấn thanh điệu chưa đều. Luyện tập thêm chút nữa là xuất sắc!" :
                                    resultStats.averageAccuracy >= 70 ? "Bạn phát âm tương đối ổn định, hãy nghe kỹ các pinyin âm và thanh điệu để nói chuẩn xác hơn." :
                                        "Bạn đã cố gắng hoàn thành cuộc đối thoại! Đừng nản lòng, học ngôn ngữ cần thời gian. Hãy nghe lại bài mẫu và nhại giọng nhiều lần nhé!"}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="w-full flex flex-col gap-2 shrink-0 pt-4">
                        <Button
                            onClick={handleRestart}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Luyện lại hội thoại này</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setMode("scenarios")}
                            className="w-full border border-rose-200 text-rose-600 hover:bg-rose-50/50 font-bold text-xs py-5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Chọn hội thoại khác</span>
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => router.push("/dashboard")}
                            className="w-full text-zinc-500 hover:text-zinc-700 font-bold text-xs py-2 cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                            <Home className="w-4 h-4" />
                            <span>Trở về trang chủ Dashboard</span>
                        </Button>
                    </div>
                </Card>
            )}

            {/* Premium gate modal fallback for web UI */}
            <Dialog open={premiumModalVisible} onOpenChange={setPremiumModalVisible}>
                <DialogContent className="max-w-md w-full p-6 text-center space-y-5 rounded-3xl">
                    <DialogHeader className="flex flex-col items-center gap-2">
                        <Crown className="w-12 h-12 text-amber-500 animate-bounce" />
                        <DialogTitle className="text-lg font-black text-zinc-950 dark:text-zinc-50">
                            Tính năng Premium VIP
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-550 dark:text-zinc-400 font-medium leading-relaxed">
                            Hệ thống chấm điểm AI nâng cao và phân tích so sánh chi tiết phát âm của từng từ chỉ dành cho tài khoản VIP.
                        </DialogDescription>
                    </DialogHeader>

                    <ul className="text-left text-xs bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-2.5 font-bold text-zinc-650 dark:text-zinc-350 list-none">
                        <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Chấm điểm AI và phân tích giọng nói chi tiết</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Đọc mẫu & Shadowing so sánh độ chuẩn âm</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Không giới hạn hội thoại và kịch bản giao tiếp</span>
                        </li>
                    </ul>

                    <div className="flex items-center gap-3 pt-3">
                        <Button
                            onClick={() => {
                                setPremiumModalVisible(false);
                                localStorage.setItem("cla_premium_active", "true");
                                alert("Đã kích hoạt giả lập Premium thành công!");
                                globalThis.location.reload();
                            }}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs py-5 rounded-xl cursor-pointer"
                        >
                            Mở khóa Premium
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setPremiumModalVisible(false)}
                            className="flex-1 text-zinc-700 font-bold text-xs py-5 rounded-xl cursor-pointer"
                        >
                            Để sau
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
