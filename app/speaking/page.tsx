"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { speakingApi } from "@/api/speaking";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAssetUrl } from "@/lib/utils/assets";

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
    <div className="flex-1 flex flex-col gap-6">
          {/* Active Title Banner */}
          <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent p-6 rounded-3xl border border-rose-200/20 shadow-2xs space-y-1.5 shrink-0">
            <h1 className="text-2xl font-extrabold text-rose-850 dark:text-rose-500">🎙️ AI Luyện Nói Phản Xạ</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
              Cải thiện khả năng phản xạ và phát âm tiếng Trung của bạn. Nói chuyện trực tiếp với giáo viên AI, nhận phân tích so sánh độ chính xác từng từ.
            </p>
          </div>

          {/* 1. TOPICS GRID VIEW */}
          {mode === "topics" && (
            <div className="space-y-6 flex-1">
              <h2 className="text-sm font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                Chọn chủ đề luyện nói
              </h2>
              {topicsLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-60 bg-zinc-150 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {topics?.map((topic: SpeakingTopic) => (
                    <article
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic)}
                      className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getAssetUrl(topic.image_cover?.filename_disk)}
                          alt={topic.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-2 left-2 text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-md shadow-sm">
                          {topic.level || "HSK"}
                        </span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-rose-600 transition-colors">
                            {topic.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                        <button className="w-full text-center text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 py-2 rounded-xl transition-all cursor-pointer">
                          Khám phá tình huống
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. SCENARIOS GRID VIEW */}
          {mode === "scenarios" && selectedTopic && (
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <button
                  onClick={() => setMode("topics")}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-650 flex items-center gap-1 cursor-pointer"
                >
                  &larr; Quay lại danh sách chủ đề
                </button>
                <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-full uppercase">
                  {selectedTopic.title}
                </span>
              </div>

              {categoriesLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[1, 2].map(n => (
                    <div key={n} className="h-44 bg-zinc-150 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {categories.map((category: SpeakingCategory) => (
                    <div
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-rose-300 dark:hover:border-rose-900 transition-all duration-200"
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
                        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-rose-600 transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                          {category.description}
                        </p>
                        <span className="inline-block text-[10px] text-rose-500 font-bold mt-1">
                          Bắt đầu hội thoại &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-3xl">📭</span>
                  <p className="mt-2 text-xs font-bold text-zinc-400">Không tìm thấy tình huống nào cho chủ đề này.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. CONVERSATIONAL PRACTICE VIEW */}
          {mode === "practice" && selectedCategory && (
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden h-[600px]">
              {/* Practice Top Header */}
              <div className="border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-rose-500 tracking-wider uppercase">Tình huống nói</span>
                  <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white line-clamp-1">
                    {selectedCategory.title}
                  </h2>
                </div>
                <button
                  onClick={() => setMode("scenarios")}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Thoát luyện tập
                </button>
              </div>

              {/* Chat Messages Log Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-950/10"
              >
                {practiceLoading && visibleMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
                    <p className="text-xs font-bold text-zinc-400">Đang chuẩn bị hội thoại...</p>
                  </div>
                ) : (
                  <>
                    {errorMessage && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 rounded-xl text-xs font-bold text-center">
                        ⚠️ {errorMessage}
                      </div>
                    )}

                    {visibleMessages.map((message) => {
                      const isSpeakerA = message.speaker?.toUpperCase() === "A";
                      const bubbleBg = isSpeakerA 
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" 
                        : "bg-rose-600 text-white shadow-xs";
                      
                      const wordHighlightStyle = (detail: any) => {
                        if (detail.isCorrect) return "text-emerald-500 dark:text-emerald-450 font-extrabold";
                        if (detail.isMissing) return "text-amber-500 dark:text-amber-400 line-through decoration-2 decoration-amber-500";
                        return "text-rose-500 font-extrabold"; // Extra / wrong
                      };

                      return (
                        <div
                          key={message.id}
                          className={`flex items-start gap-3 w-full max-w-[85%] ${
                            isSpeakerA ? "self-start mr-auto" : "self-end ml-auto flex-row-reverse"
                          }`}
                        >
                          {/* Speaker Avatar Icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                            isSpeakerA ? "bg-rose-100 text-rose-700" : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300"
                          }`}>
                            {message.speaker?.toUpperCase() === "A" ? "A" : "Tôi"}
                          </div>

                          {/* Message Bubble Container */}
                          <div className={`rounded-2xl p-4 space-y-2 flex-1 min-w-0 ${bubbleBg}`}>
                            {/* Chinese Text with audio play icon */}
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-base font-bold leading-normal tracking-wide whitespace-pre-wrap break-words">
                                {message.chinese_text}
                              </p>
                              <button
                                onClick={() => handleSpeak(message.chinese_text)}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                              >
                                🔊
                              </button>
                            </div>

                            {/* Pinyin */}
                            <p className={`text-xs italic ${isSpeakerA ? "text-zinc-550" : "text-rose-100"}`}>
                              {message.pinyin}
                            </p>

                            {/* Vietnamese Translation */}
                            <p className={`text-[13px] font-medium border-t pt-1.5 ${isSpeakerA ? "text-zinc-650 border-zinc-200/50" : "text-rose-50 border-rose-400/20"}`}>
                              {message.vietnamese_text}
                            </p>

                            {/* USER PRACTICE RECORD CONTROLS (Only visible for B's bubbles) */}
                            {message.speaker?.toUpperCase() === "B" && (
                              <div className="mt-4 pt-3 border-t border-rose-400/20 space-y-3">
                                {/* Toggle Recording Button */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <button
                                    onClick={() => handleToggleRecording(message.id)}
                                    className={`px-4 py-2 text-[11px] font-extrabold rounded-full transition-all active:scale-[0.98] cursor-pointer shadow-3xs flex items-center gap-1.5 ${
                                      activeRecordingId === message.id
                                        ? "bg-rose-100 text-rose-700 hover:bg-rose-200 animate-pulse"
                                        : "bg-white text-rose-600 hover:bg-rose-50"
                                    }`}
                                  >
                                    <span>🎙️</span>
                                    {activeRecordingId === message.id ? "Đang thu (Nhấn để dừng)" : "Nhấn để ghi âm nói"}
                                  </button>

                                  {message.recording?.state.isProcessing && activeRecordingId === message.id && (
                                    <span className="text-[10px] font-bold text-rose-100 flex items-center gap-1 animate-pulse">
                                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                      Đang phân tích phát âm...
                                    </span>
                                  )}
                                </div>

                                {/* Recording Error Feedback */}
                                {message.recording?.state.error && activeRecordingId === message.id && (
                                  <p className="text-[10px] text-rose-200 font-bold bg-black/10 px-3 py-1.5 rounded-lg leading-relaxed">
                                    ❌ Lỗi: {message.recording.state.error}
                                  </p>
                                )}

                                {/* AI Accuracy scoring */}
                                {message.recording?.result && (
                                  <div className="bg-black/10 p-3 rounded-xl space-y-2 text-[11px]">
                                    {message.recording.result.errorType === "empty" ? (
                                      <p className="text-rose-100 leading-relaxed font-bold">
                                        ⚠️ Không nhận dạng được âm thanh. Hãy thử nói lại to và rõ ràng hơn.
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
                    <button
                      onClick={handleContinue}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      Tiếp tục &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishPractice}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-650/10 transition-all cursor-pointer active:scale-95 animate-bounce"
                    >
                      Hoàn thành luyện nói
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. PERFORMANCE RESULTS OVERVIEW */}
          {mode === "result" && resultStats && selectedCategory && (
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 flex flex-col items-center max-w-xl mx-auto">
              
              {/* Circular success indicator */}
              <div className="bg-rose-500 text-white text-center w-full p-6 rounded-2xl space-y-1 shrink-0 select-none">
                <span className="text-3xl">🎉</span>
                <h2 className="text-lg font-black tracking-tight">Cực Kỳ Tuyệt Vời!</h2>
                <p className="text-xs text-rose-100">
                  Bạn đã hoàn thành luyện hội thoại &quot;{selectedCategory.title}&quot;
                </p>
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
                        <span className={`font-black text-sm ${
                          resultStats.averageAccuracy >= 80 ? "text-emerald-500" :
                          resultStats.averageAccuracy >= 60 ? "text-amber-500" : "text-rose-500"
                        }`}>
                          {resultStats.averageAccuracy}%
                        </span>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            resultStats.averageAccuracy >= 80 ? "bg-emerald-500" :
                            resultStats.averageAccuracy >= 60 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${resultStats.averageAccuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback detailed assessment */}
              <div className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl p-5 space-y-2 text-xs">
                <h4 className="font-bold text-zinc-900 dark:text-white">
                  {resultStats.averageAccuracy >= 90 ? "🥇 Bậc thầy phát âm!" :
                   resultStats.averageAccuracy >= 80 ? "👍 Rất Tốt!" :
                   resultStats.averageAccuracy >= 70 ? "💪 Khá Tốt!" : "🎯 Hãy Kiên Trì!"}
                </h4>
                <p className="text-zinc-500 leading-relaxed font-medium">
                  {resultStats.averageAccuracy >= 90 ? "Phát âm của bạn cực kỳ chuẩn xác và tự nhiên. Thể hiện tuyệt vời giọng đọc như người bản xứ!" :
                   resultStats.averageAccuracy >= 80 ? "Phát âm của bạn rất tốt, chỉ sai lệch một số từ nhỏ do nhấn thanh điệu chưa đều. Luyện tập thêm chút nữa là xuất sắc!" :
                   resultStats.averageAccuracy >= 70 ? "Bạn phát âm tương đối ổn định, hãy nghe kỹ các pinyin âm và thanh điệu để nói chuẩn xác hơn." :
                   "Bạn đã cố gắng hoàn thành cuộc đối thoại! Đừng nản lòng, học ngôn ngữ cần thời gian. Hãy nghe lại bài mẫu và nhại giọng nhiều lần nhé!"}
                </p>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-2 shrink-0 pt-4">
                <button
                  onClick={handleRestart}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Luyện lại hội thoại này
                </button>
                <button
                  onClick={() => setMode("scenarios")}
                  className="border border-rose-200 text-rose-600 hover:bg-rose-50/50 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  Chọn hội thoại khác
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-zinc-500 hover:text-zinc-700 font-bold text-xs py-2 cursor-pointer text-center"
                >
                  Trở về trang chủ Dashboard
                </button>
              </div>

            </div>
          )}

      {/* Premium gate modal fallback for web UI */}
      {premiumModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-center">
            <span className="text-5xl block select-none">👑</span>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-zinc-950 dark:text-zinc-50">
                Tính năng Premium VIP
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                Hệ thống chấm điểm AI nâng cao và phân tích so sánh chi tiết phát âm của từng từ chỉ dành cho tài khoản VIP.
              </p>
            </div>
            
            <ul className="text-left text-xs bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-2.5 font-bold text-zinc-650 dark:text-zinc-350">
              <li className="flex items-center gap-2">🟢 Chấm điểm AI và phân tích giọng nói chi tiết</li>
              <li className="flex items-center gap-2">🟢 Đọc mẫu & Shadowing so sánh độ chuẩn âm</li>
              <li className="flex items-center gap-2">🟢 Không giới hạn hội thoại và kịch bản giao tiếp</li>
            </ul>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => {
                  setPremiumModalVisible(false);
                  localStorage.setItem("cla_premium_active", "true");
                  alert("Đã kích hoạt giả lập Premium thành công!");
                  globalThis.location.reload();
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs py-3 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Mở khóa Premium
              </button>
              <button
                onClick={() => setPremiumModalVisible(false)}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
