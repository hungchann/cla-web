"use client";

import { use, useEffect, useRef, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import { translateWord } from "@/api/apiService";
import { BackButton } from "@/components/BackButton";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremiumGate } from "@/lib/hooks/usePremiumGate";
import { buildCheckoutUrl } from "@/api/plans";
import { PageContainer } from "@/components/PageContainer";

import { VideoPlayerSection } from "@/components/video/VideoPlayerSection";
import { VideoQuizPanel } from "@/components/video/VideoQuizPanel";
import { videoDataUsesYoutubePlayer, getYoutubeVideoIdFromVideoData } from "@/lib/utils/youtubeVideo";
import { speakChinese } from "@/lib/utils/speech";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";
import Link from "next/link";

const MOCK_VIDEO_DETAIL = {
  id: "v1",
  title: "看动漫学汉语：常用口语表达",
  title_trans: "Học tiếng Trung qua hoạt hình: Các cụm từ khẩu ngữ thông dụng",
  Video_Source: "Local",
  video_file: { filename_disk: "sample-video.mp4" },
  srt_file: { filename_disk: "sample-sub.srt" },
};

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

function QuizContent({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { loading: isPremiumLoading, premiumModalVisible, setPremiumModalVisible } = usePremiumGate({ showOnMount: true });

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const youtubePlayerRef = useRef<any>(null);

  const { data: videoData, isLoading } = useQuery({
    queryKey: ["video-detail", id],
    queryFn: async () => {
      try {
        const res = await bilingualApi.getVideoSection();
        const found = res.find((v: any) => String(v.id) === id);
        return found || MOCK_VIDEO_DETAIL;
      } catch {
        return MOCK_VIDEO_DETAIL;
      }
    },
  });

  const isYoutubeVideo = videoDataUsesYoutubePlayer(videoData || MOCK_VIDEO_DETAIL);
  const ytVideoId = isYoutubeVideo ? getYoutubeVideoIdFromVideoData(videoData || MOCK_VIDEO_DETAIL) : null;

  const hookData = useDetailedVideoLogic(videoData || MOCK_VIDEO_DETAIL, {
    videoRef,
    enableAutoSpeakSubtitle: false,
    youtubePlayerRef,
    fallbackExercises: MOCK_EXERCISES,
    flowMode: "quiz",
  });

  const {
    activeQuestion,
    handleOptionPress,
    handleContinueWatching,
    handleViewResults,
    resumePlayback,
    exerciseData,
    videoSource,
    answeredIds,
    answerResults,
    showResult,
    nextQuestionId,
    hasCompletedAll,
    handleVideoLoaded,
    onVideoTimeUpdate,
    selectQuestion,
  } = hookData;

  const getOptions = (ex: any) => {
    if (!ex) return [];
    const correctAns = String(
      ex.Correct_answer || ex.correct_answer || ex.Correct_Answer || ex.correctAnswer || ex.correct || ex.answer || ""
    ).trim().toUpperCase();

    const isOptionCorrect = (optionId: string, optionVal: string) => {
      if (!correctAns) return false;
      const cleanAns = correctAns.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
      if (!cleanAns) return false;
      const cleanId = optionId.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
      const cleanVal = optionVal.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
      return cleanAns === cleanId || cleanAns === `ANSWER${cleanId}` || cleanAns === cleanVal;
    };

    let rawOptions = ex.options;
    if (typeof rawOptions === "string") {
      try { rawOptions = JSON.parse(rawOptions); } catch { rawOptions = []; }
    }

    if (Array.isArray(rawOptions)) {
      return rawOptions.map((opt: any) => {
        const optionId = String(opt.id || opt.key || "");
        const optionVal = String(opt.val || opt.hanzi || opt.text || opt.value || "");
        const hasFlag = opt.isCorrect !== undefined || opt.is_correct !== undefined || opt.correct !== undefined;
        if (hasFlag) {
          const flag = opt.isCorrect ?? opt.is_correct ?? opt.correct;
          return { ...opt, id: optionId, hanzi: optionVal, isCorrect: !!flag };
        }
        return { ...opt, id: optionId, hanzi: optionVal, isCorrect: isOptionCorrect(optionId, optionVal) };
      }).filter((o: any) => o.id && o.hanzi);
    }

    const opts = [];
    const ansA = ex.answer_A || ex.Answer_A || ex.answerA || ex.answer_a || ex.option_A || ex.optionA;
    const ansB = ex.answer_B || ex.Answer_B || ex.answerB || ex.answer_b || ex.option_B || ex.optionB;
    const ansC = ex.answer_C || ex.Answer_C || ex.answerC || ex.answer_c || ex.option_C || ex.optionC;
    const ansD = ex.answer_D || ex.Answer_D || ex.answerD || ex.answer_d || ex.option_D || ex.optionD;
    if (ansA) opts.push({ id: "A", hanzi: ansA, pinyin: "", isCorrect: isOptionCorrect("A", ansA) });
    if (ansB) opts.push({ id: "B", hanzi: ansB, pinyin: "", isCorrect: isOptionCorrect("B", ansB) });
    if (ansC) opts.push({ id: "C", hanzi: ansC, pinyin: "", isCorrect: isOptionCorrect("C", ansC) });
    if (ansD) opts.push({ id: "D", hanzi: ansD, pinyin: "", isCorrect: isOptionCorrect("D", ansD) });
    return opts;
  };

  // Polling current time for YouTube player
  useEffect(() => {
    if (!isYoutubeVideo) return;
    const interval = setInterval(async () => {
      if (youtubePlayerRef.current?.getCurrentTime) {
        try {
          const t = await youtubePlayerRef.current.getCurrentTime();
          if (typeof t === "number" && !Number.isNaN(t)) {
            setCurrentTime(t);
            onVideoTimeUpdate?.(t);
          }
        } catch {
          // ignore
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isYoutubeVideo, onVideoTimeUpdate]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      onVideoTimeUpdate?.(t);
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
    } catch {
      setWordInfo(null);
    } finally {
      setIsTranslating(false);
    }
  };

  if (isLoading || isPremiumLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  const activeEx = activeQuestion;

  return (
    <PageContainer maxWidth="full" className="gap-6">
      <PremiumGate
        isOpen={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        feature="xem video bài giảng đầy đủ"
        upgradeUrl={buildCheckoutUrl(undefined, `video-${id}`)}
      />

      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 w-full">
        <BackButton href="/video" label="Danh sách video" />
        <Link
          href={`/video/${id}/subtitles`}
          className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
        >
          &larr; Chuyển sang phụ đề
        </Link>
      </div>

      {/* Main Content: Video + Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <VideoPlayerSection
          isYoutubeVideo={isYoutubeVideo}
          ytVideoId={ytVideoId}
          youtubePlayerRef={youtubePlayerRef}
          videoRef={videoRef}
          videoSource={videoSource}
          handleTimeUpdate={handleTimeUpdate}
          handleVideoLoaded={handleVideoLoaded}
          title={videoData?.title}
          titleTrans={videoData?.title_trans}
          activeQuestion={activeQuestion}
          showResult={showResult}
          answerResults={answerResults}
          getOptions={getOptions}
          onSubmitQuiz={handleOptionPress}
          onContinueQuiz={handleContinueWatching}
        />

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex flex-col h-[400px] lg:h-[480px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-2 shrink-0">
              Trắc nghiệm
            </h3>
            <VideoQuizPanel
              exerciseData={exerciseData}
              activeQuestion={activeQuestion}
              activeEx={activeEx}
              answeredIds={answeredIds}
              answerResults={answerResults}
              nextQuestionId={nextQuestionId}
              hasCompletedAll={hasCompletedAll}
              totalExercises={exerciseData?.length ?? 0}
              onViewResults={handleViewResults}
              onSelectQuestion={selectQuestion}
              onSeek={(timeStr: string) => {
                const s = timeToSeconds(timeStr);
                if (isYoutubeVideo && youtubePlayerRef.current?.seekTo) {
                  youtubePlayerRef.current.seekTo(s, true);
                  youtubePlayerRef.current.playVideo?.();
                } else if (videoRef.current) {
                  videoRef.current.currentTime = s;
                  videoRef.current.play().catch(() => {});
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Dictionary Translation Modal */}
      {selectedWord && (
        <WordInfoModal
          isVisible={!!selectedWord}
          onClose={() => { setSelectedWord(null); setWordInfo(null); }}
          selectedWord={selectedWord}
          isLoading={isTranslating}
          wordInfo={wordInfo}
        />
      )}
    </PageContainer>
  );
}

export default function QuizPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    }>
      <QuizContent params={params} />
    </Suspense>
  );
}
