"use client";

import { use, useEffect, useRef, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import { SubtitleItem } from "@/components/video/SubtitleItem";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import { translateWord } from "@/api/apiService";
import { segmentChineseText as apiSegmentChineseText } from "@/api/segment";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { BackButton } from "@/components/BackButton";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremium } from "@/lib/hooks/usePremium";
import { PageContainer } from "@/components/PageContainer";
import { PinyinToggle } from "@/components/PinyinToggle";

import { VideoPlayerSection } from "@/components/video/VideoPlayerSection";
import { VideoQuizSection } from "@/components/video/VideoQuizSection";
import { videoDataUsesYoutubePlayer, getYoutubeVideoIdFromVideoData } from "@/lib/utils/youtubeVideo";
import { BilingualShadowing } from "@/components/bilingual/BilingualShadowing";
import { BilingualExercise } from "@/components/bilingual/BilingualExercise";
import { speakChinese } from "@/lib/utils/speech";
import { useSubtitleSync } from "@/lib/hooks/useSubtitleSync";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";

// Mock video data chi tiết
const MOCK_VIDEO_DETAIL = {
  id: "v1",
  title: "看动漫学汉语：常用口语表达",
  title_trans: "Học tiếng Trung qua hoạt hình: Các cụm từ khẩu ngữ thông dụng",
  Video_Source: "Local",
  video_file: {
    filename_disk: "sample-video.mp4",
  },
  srt_file: {
    filename_disk: "sample-sub.srt",
  },
};

// Mock câu hỏi trắc nghiệm cho video v1
const MOCK_EXERCISES = [
  {
    id: 101,
    question: "Từ nào trong video có nghĩa là 'Học tập'?",
    time_start: "00:00:04,000",
    time_end: "00:00:08,000",
    options: [
      { id: 1, hanzi: "学习", pinyin: "Xuéxí", isCorrect: true },
      { id: 2, hanzi: "漂亮", pinyin: "Piàoliang", isCorrect: false },
      { id: 3, hanzi: "谢谢", pinyin: "Xièxie", isCorrect: false },
      { id: 4, hanzi: "苹果", pinyin: "Píngguǒ", isCorrect: false },
    ],
  },
  {
    id: 102,
    question: "Nghĩa của từ '胡同' (Hútòng) là gì?",
    time_start: "00:00:12,000",
    time_end: "00:00:16,000",
    options: [
      { id: 1, hanzi: "Ngõ hẻm", pinyin: "Ngõ hẻm ở Bắc Kinh", isCorrect: true },
      { id: 2, hanzi: "Nhà cổ", pinyin: "Nhà cổ Tứ hợp viện", isCorrect: false },
      { id: 3, hanzi: "Trà đạo", pinyin: "Văn hóa trà", isCorrect: false },
      { id: 4, hanzi: "Đường lớn", pinyin: "Đại lộ", isCorrect: false },
    ],
  },
];

// Mock phụ đề SRT chạy video
const MOCK_SRT = `1
00:00:01,000 --> 00:00:03,000
大家好！今天 we 来学习汉语口语。
Đại gia hảo! Kim thiên ngã môn lai học tập Hán ngữ khẩu ngữ.
Chào mọi người! Hôm nay chúng ta cùng học khẩu ngữ tiếng Trung.

2
00:00:04,000 --> 00:00:08,000
第一个词是“学习”。你每天学习吗？
Đệ nhất cá từ thị “học tập”. Nhĩ mỗi thiên học tập ma?
Từ đầu tiên là "học tập". Bạn có học tập mỗi ngày không?

3
00:00:09,000 --> 00:00:11,000
非常好，一定要坚持下去。
Phi thường hảo, nhất định yếu kiên trì hạ khứ.
Rất tốt, nhất định phải kiên trì nhé.

4
00:00:12,000 --> 00:00:16,000
接下来是北京的“胡同”，非常有特色。
Tiếp hạ lai thị Bắc kinh đích “hồ đồng”, phi thường hữu đặc sắc.
Tiếp theo là "hồ đồng" ở Bắc Kinh, vô cùng đặc sắc.`;

function parseMockSRT() {
  const blocks = MOCK_SRT.split(/\n\s*\n/);
  return blocks.map((block, idx) => {
    const lines = block.trim().split("\n");
    const timeLine = lines[1] || "";
    const [start, end] = timeLine.split("-->").map((t) => t.trim());
    return {
      id: idx + 1,
      index: idx,
      start: start || 0,
      end: end || 0,
      chinese: lines[2] || "",
      pinyin: "pinyin",
      vietnamese: lines[4] || "",
      segmentedWords: lines[2]
        ? lines[2].split("").map((c) => ({ word: c, pinyin: "" }))
        : [],
    };
  });
}

function VideoDetailContent({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { isPremium: _isPremium, isLoading: isPremiumLoading } = usePremium();
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const [isOpenPinyin, setIsOpenPinyin] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Custom states hỗ trợ trắc nghiệm video
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  // AI Translation & Segmentation states
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [enrichedSubtitles, setEnrichedSubtitles] = useState<any[]>([]);

  // Tab states học tập mới
  const [activeTab, setActiveTab] = useState<"video" | "shadowing" | "exercise">("video");
  const [rightPanelTab, setRightPanelTab] = useState<"subtitles" | "quiz">("subtitles");

  // States dành cho BilingualExercise trong tab Bài tập
  const [exerciseQuizSelected, setExerciseQuizSelected] = useState<string | null>(null);
  const [exerciseQuestionIndex, setExerciseQuestionIndex] = useState(0);
  const [exerciseTabType, setExerciseTabType] = useState<"select" | "quiz" | "trans_zh_vi" | "trans_vi_zh">("select");

  // YouTube logic states
  const youtubePlayerRef = useRef<any>(null);
  const [youtubeIsPlaying, setYoutubeIsPlaying] = useState(false);

  // Dynamically map options from backend data or mock data
  const getOptions = (ex: any) => {
    if (!ex) return [];

    const correctAns = String(
      ex.Correct_answer || 
      ex.correct_answer || 
      ex.Correct_Answer || 
      ex.correctAnswer || 
      ex.correct || 
      ex.answer || 
      ""
    ).trim().toUpperCase();

    const isOptionCorrect = (optionId: string, optionVal: string) => {
      if (!correctAns) return false;
      const cleanAns = correctAns.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
      if (!cleanAns) return false;
      
      const cleanId = optionId.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
      const cleanVal = optionVal.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
      
      return cleanAns === cleanId || 
             cleanAns === `ANSWER${cleanId}` || 
             cleanAns === cleanVal;
    };

    if (Array.isArray(ex.options)) {
      return ex.options.map((opt: any) => {
        const optionId = String(opt.id);
        const optionVal = String(opt.val || opt.hanzi || opt.text || "");
        
        const hasFlag = opt.isCorrect !== undefined || opt.is_correct !== undefined || opt.correct !== undefined;
        if (hasFlag) {
          const flag = opt.isCorrect ?? opt.is_correct ?? opt.correct;
          return {
            ...opt,
            id: optionId,
            hanzi: optionVal,
            isCorrect: !!flag,
          };
        }
        
        return {
          ...opt,
          id: optionId,
          hanzi: optionVal,
          isCorrect: isOptionCorrect(optionId, optionVal),
        };
      });
    }
    
    const opts = [];
    const ansA = ex.answer_A || ex.Answer_A || ex.answerA;
    const ansB = ex.answer_B || ex.Answer_B || ex.answerB;
    const ansC = ex.answer_C || ex.Answer_C || ex.answerC;
    const ansD = ex.answer_D || ex.Answer_D || ex.answerD;
    
    if (ansA) opts.push({ id: "A", hanzi: ansA, pinyin: "", isCorrect: isOptionCorrect("A", ansA) });
    if (ansB) opts.push({ id: "B", hanzi: ansB, pinyin: "", isCorrect: isOptionCorrect("B", ansB) });
    if (ansC) opts.push({ id: "C", hanzi: ansC, pinyin: "", isCorrect: isOptionCorrect("C", ansC) });
    if (ansD) opts.push({ id: "D", hanzi: ansD, pinyin: "", isCorrect: isOptionCorrect("D", ansD) });
    return opts;
  };

  // Fetch thông tin video từ API
  const { data: videoData, isLoading } = useQuery({
    queryKey: ["video-detail", id],
    queryFn: async () => {
      try {
        const res = await bilingualApi.getVideoSection();
        const found = res.find((v: any) => String(v.id) === id);
        return found || MOCK_VIDEO_DETAIL;
      } catch (err) {
        console.warn("API error, fallback to mock video detail", err);
        return MOCK_VIDEO_DETAIL;
      }
    },
  });

  const isYoutubeVideo = videoDataUsesYoutubePlayer(videoData || MOCK_VIDEO_DETAIL);
  const ytVideoId = isYoutubeVideo ? getYoutubeVideoIdFromVideoData(videoData || MOCK_VIDEO_DETAIL) : null;

  // Gọi hook logic video chính thức
  const hookData = useDetailedVideoLogic(videoData || MOCK_VIDEO_DETAIL, {
    videoRef,
    enableAutoSpeakSubtitle: false,
    youtubePlayerRef,
    setYoutubeIsPlaying,
  });

  const {
    activeQuestion,
    subtitles,
    handleOptionPress,
    handleContinueWatching,
    exerciseData,
    videoSource,
    handleVideoLoaded,
  } = hookData;

  // Phân tách từ Hán ngữ phụ đề tự động bằng API AI
  useEffect(() => {
    const enrich = async () => {
      const baseSubs = subtitles && subtitles.length > 0 ? subtitles : parseMockSRT();
      if (!baseSubs || baseSubs.length === 0) {
        setEnrichedSubtitles([]);
        return;
      }
      try {
        const texts = baseSubs.map((s) => s.chinese);
        const segments = await apiSegmentChineseText(texts);
        const enriched = baseSubs.map((s, idx) => {
          const apiWords = segments[idx] || [];
          return {
            ...s,
            segmentedWords: apiWords.map((w: any) => ({
              word: w.word,
              pinyin: w.pinyin,
            })),
          };
        });
        setEnrichedSubtitles(enriched);
      } catch (err) {
        if (isAIConsentRequiredError(err)) {
          console.log("AI consent not granted yet, using local video subtitle splits fallback.");
        } else {
          console.warn("API segment for video subtitles failed, falling back to local splits:", err);
        }
        const enriched = baseSubs.map((s) => ({
          ...s,
          segmentedWords: s.chinese ? s.chinese.split("").map((c) => ({ word: c, pinyin: "" })) : [],
        }));
        setEnrichedSubtitles(enriched);
      }
    };
    enrich();
  }, [subtitles]);

  const { activeIndex: activeSubtitleIndex, setActiveIndex, binarySearchSubtitle } = useSubtitleSync({
    subtitles: enrichedSubtitles,
    timeToSeconds,
    leadTimeSeconds: 0.1,
  });

  // Polling current time for YouTube player
  useEffect(() => {
    if (!isYoutubeVideo) return;
    const interval = setInterval(async () => {
      if (youtubePlayerRef.current?.getCurrentTime) {
        try {
          const t = await youtubePlayerRef.current.getCurrentTime();
          if (typeof t === "number" && !Number.isNaN(t)) {
            setCurrentTime(t);
          }
        } catch {
          // ignore
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isYoutubeVideo]);

  // Sync active subtitle index from current time
  useEffect(() => {
    if (currentTime > 0 && enrichedSubtitles.length > 0) {
      const idx = binarySearchSubtitle(currentTime);
      if (idx !== null && idx !== activeSubtitleIndex) {
        setActiveIndex(idx);
      }
    }
  }, [currentTime, enrichedSubtitles, binarySearchSubtitle, activeSubtitleIndex, setActiveIndex]);

  // Tự động Pause video khi có câu hỏi hoạt động (chỉ khi ngưởi dùng đang ở tab Trắc nghiệm)
  useEffect(() => {
    if (activeQuestion && rightPanelTab === "quiz") {
      if (isYoutubeVideo) {
        setYoutubeIsPlaying(false);
      } else {
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
        }
      }
      // Reset trạng thái chọn câu trả lởi
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsAnswerCorrect(null);
    }
  }, [activeQuestion, isYoutubeVideo, rightPanelTab]);

  // Teleprompter: Cuộn tự động phụ đề căn giữa viewport
  const subtitleItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (activeSubtitleIndex !== null && activeSubtitleIndex !== undefined && activeSubtitleIndex !== -1) {
      subtitleItemRefs.current[activeSubtitleIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeSubtitleIndex]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleWordPress = async (word: string) => {
    speakChinese(word);
    setSelectedWord(word);
    setWordInfo(null);
    setIsTranslating(true);
    try {
      const res = await translateWord(word);
      const translated = res?.[0];
      if (translated) {
        setWordInfo({
          word: translated.word || word,
          pinyin: translated.pinyin || "N/A",
          meanings: translated.meaning || translated.meanings || "Không tìm thấy nghĩa.",
          traditional: translated.traditional || "",
          simplified: translated.simplified || translated.word || word,
          classifiers: translated.classifiers || [],
        });
      } else {
        setWordInfo(null);
      }
    } catch (err) {
      console.warn("API translate failed for video word:", err);
      setWordInfo(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleReplayPress = (item: any) => {
    const seconds = timeToSeconds(String(item.start));
    if (isYoutubeVideo) {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(seconds);
        youtubePlayerRef.current.playVideo();
      }
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch((e) => console.log("Play interrupted", e));
      }
    }
  };

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || !activeQuestion) return;

    setIsAnswerChecked(true);

    // Gọi hook báo cáo kết quả và lấy status thực tế từ API server
    const result = await handleOptionPress(String(selectedAnswer));
    if (result) {
      setIsAnswerCorrect(result.status === "Đúng");
    }
  };

  const handleContinueVideo = () => {
    // Play tiếp video
    if (isYoutubeVideo) {
      setYoutubeIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.play().catch((e) => console.log("Play interrupted", e));
    }
    // Chuyển sang câu kế tiếp ở hook
    handleContinueWatching();
  };

  if (isLoading || isPremiumLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  const activeEx = (exerciseData && exerciseData.find((ex: any) => ex.id === activeQuestion?.id)) || MOCK_EXERCISES.find((ex) => ex.id === activeQuestion?.id);

  return (
    <PageContainer maxWidth="full" className="gap-6">
      <PremiumGate
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="xem video bài giảng đầy đủ"
      />
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 w-full">
        <BackButton href="/video" label="Danh sách video" />

        <div className="flex items-center gap-2">
          <PinyinToggle isOpen={isOpenPinyin} onChange={setIsOpenPinyin} />
        </div>
      </div>

      {/* Tabs bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 md:gap-8 font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none w-full">
        {[
          { id: "video", name: "Xem video bài học" },
          { id: "shadowing", name: "Shadowing" },
          { id: "exercise", name: "Bài tập tự luyện" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedWord(null);
              }}
              className={`pb-2 transition-all cursor-pointer bg-transparent border-none ${
                isActive
                  ? "border-b-2 border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50"
                  : "hover:text-zinc-600 dark:hover:text-zinc-350"
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Main Content Areas based on selected Tab */}
      <div className="w-full">
        {/* TAB 1: XEM VIDEO */}
        {activeTab === "video" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {/* Column Left: Video player section */}
            <VideoPlayerSection
              isYoutubeVideo={isYoutubeVideo}
              ytVideoId={ytVideoId}
              youtubeIsPlaying={youtubeIsPlaying}
              youtubePlayerRef={youtubePlayerRef}
              videoRef={videoRef}
              videoSource={videoSource}
              handleTimeUpdate={handleTimeUpdate}
              handleVideoLoaded={handleVideoLoaded}
              title={videoData?.title}
              titleTrans={videoData?.title_trans}
            />

            {/* Column Right: Subtitles list or Active Quiz Question with Tab Switching */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="flex flex-col h-[400px] lg:h-[480px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 justify-between overflow-hidden">
                
                {/* Sub-tab header inside the right column */}
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider text-zinc-400 select-none border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-2 shrink-0">
                  <button
                    onClick={() => setRightPanelTab("subtitles")}
                    className={`pb-1 transition-all cursor-pointer bg-transparent border-none ${
                      rightPanelTab === "subtitles"
                        ? "border-b-2 border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50 font-extrabold"
                        : "hover:text-zinc-600 dark:hover:text-zinc-350"
                    }`}
                  >
                    Phụ đề
                  </button>
                  <button
                    onClick={() => setRightPanelTab("quiz")}
                    className={`pb-1 transition-all cursor-pointer bg-transparent border-none flex items-center gap-1 ${
                      rightPanelTab === "quiz"
                        ? "border-b-2 border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50 font-extrabold"
                        : "hover:text-zinc-600 dark:hover:text-zinc-350"
                    }`}
                  >
                    Trắc nghiệm {activeQuestion && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                  </button>
                </div>

                {rightPanelTab === "quiz" ? (
                  <VideoQuizSection
                    activeQuestion={activeQuestion}
                    activeEx={activeEx}
                    selectedAnswer={selectedAnswer}
                    setSelectedAnswer={setSelectedAnswer}
                    isAnswerChecked={isAnswerChecked}
                    isAnswerCorrect={isAnswerCorrect}
                    handleAnswerSubmit={handleAnswerSubmit}
                    handleContinueVideo={handleContinueVideo}
                    getOptions={getOptions}
                  />
                ) : (
                  // Nội dung Tab Danh sách Phụ đề
                  <div className="flex-1 overflow-y-auto mt-1 pr-1 scrollbar-thin flex flex-col gap-2">
                    {enrichedSubtitles.map((sub, index) => (
                      <div
                        key={sub.id || `sub-${index}`}
                        ref={(el) => {
                          subtitleItemRefs.current[index] = el;
                        }}
                      >
                        <SubtitleItem
                          item={sub}
                          index={index}
                          activeIndex={activeSubtitleIndex}
                          isOpenPinyin={isOpenPinyin}
                          onWordPress={handleWordPress}
                          onReplayPress={handleReplayPress}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LUYỆN NÓI SHADOWING */}
        {activeTab === "shadowing" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
            <BilingualShadowing
              srtData={enrichedSubtitles}
              onSpeakWord={speakChinese}
            />
          </div>
        )}

        {/* TAB 4: BÀI TẬP TỰ LUYỆN */}
        {activeTab === "exercise" && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
            <BilingualExercise
              exerciseList={exerciseData || []}
              isLoading={false}
              srtData={enrichedSubtitles}
              quizSelected={exerciseQuizSelected}
              setQuizSelected={setExerciseQuizSelected}
              currentQuestionIndex={exerciseQuestionIndex}
              setCurrentQuestionIndex={setExerciseQuestionIndex}
              exerciseType={exerciseTabType}
              setExerciseType={setExerciseTabType}
            />
          </div>
        )}
      </div>

      {/* Dictionary Translation Modal */}
      {selectedWord && (
        <WordInfoModal
          isVisible={!!selectedWord}
          onClose={() => {
            setSelectedWord(null);
            setWordInfo(null);
          }}
          selectedWord={selectedWord}
          isLoading={isTranslating}
          wordInfo={wordInfo}
        />
      )}
    </PageContainer>
  );
}

export default function VideoDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    }>
      <VideoDetailContent params={params} />
    </Suspense>
  );
}
