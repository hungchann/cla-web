"use client";

import { use, useEffect, useRef, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import { SubtitleItem } from "@/components/video/SubtitleItem";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import { translateWord } from "@/api/apiService";
import { segmentChineseText as apiSegmentChineseText } from "@/api/segment";
import { BackButton } from "@/components/BackButton";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremium } from "@/lib/hooks/usePremium";
import { Lightbulb } from "lucide-react";

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
大家好！今天我们来学习汉语口语。
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

const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":");
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  const secParts = parts[2]?.replace(",", ".") || "0";
  const seconds = Number(secParts) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

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

  // Gọi hook logic video chính thức đã được migrate
  const hookData = useDetailedVideoLogic(videoData || MOCK_VIDEO_DETAIL, {
    videoRef,
    enableAutoSpeakSubtitle: false,
  });

  const {
    activeQuestion,
    subtitles,
    handleOptionPress,
    handleContinueWatching,
    exerciseData,
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
        console.warn("API segment for video subtitles failed, falling back to local splits:", err);
        const enriched = baseSubs.map((s) => ({
          ...s,
          segmentedWords: s.chinese ? s.chinese.split("").map((c) => ({ word: c, pinyin: "" })) : [],
        }));
        setEnrichedSubtitles(enriched);
      }
    };
    enrich();
  }, [subtitles]);

  // Đồng bộ phụ đề chạy chữ theo timeline
  const currentSubtitle = enrichedSubtitles.find((st) => {
    const s = timeToSeconds(String(st.start));
    const e = timeToSeconds(String(st.end));
    return currentTime >= s && currentTime <= e;
  });

  const activeSubtitleIndex = enrichedSubtitles.findIndex(
    (sub) => sub.chinese === currentSubtitle?.chinese
  );

  // Tự động Pause video khi có câu hỏi hoạt động
  useEffect(() => {
    if (activeQuestion) {
      const video = videoRef.current;
      if (video) {
        if (!video.paused) {
          video.pause();
        }
        // Reset trạng thái chọn câu trả lời
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
        setIsAnswerCorrect(null);
      }
    }
  }, [activeQuestion]);

  // Cuộn tự động phụ đề theo timeline video
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeSubtitleIndex !== -1 && subtitleContainerRef.current) {
      const activeEl = subtitleContainerRef.current.children[activeSubtitleIndex] as HTMLElement;
      if (activeEl) {
        subtitleContainerRef.current.scrollTo({
          top: activeEl.offsetTop - 120,
          behavior: "smooth",
        });
      }
    }
  }, [activeSubtitleIndex]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleWordPress = async (word: string) => {
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
    if (videoRef.current) {
      const seconds = timeToSeconds(String(item.start));
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch((e) => console.log("Play interrupted", e));
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !activeQuestion) return;

    // Tìm options tương ứng từ backend exercises (hoặc mock)
    const exercise = (exerciseData && exerciseData.find((ex: any) => ex.id === activeQuestion.id)) || MOCK_EXERCISES.find((ex) => ex.id === activeQuestion.id);
    const options = getOptions(exercise);
    const option = options.find((opt: any) => opt.id === selectedAnswer);

    setIsAnswerChecked(true);
    setIsAnswerCorrect(!!option?.isCorrect);

    // Gọi hook báo cáo kết quả
    handleOptionPress(String(selectedAnswer));
  };

  const handleContinueVideo = () => {
    // Play tiếp video
    if (videoRef.current) {
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
    <div className="flex-1 flex flex-col gap-6 py-6 max-w-6xl mx-auto w-full">
      <PremiumGate
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="xem video bài giảng đầy đủ"
      />
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <BackButton href="/video" label="Danh sách video" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">Hiển thị Pinyin:</span>
          <button
            onClick={() => setIsOpenPinyin(!isOpenPinyin)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOpenPinyin ? "bg-amber-600" : "bg-zinc-250 dark:bg-zinc-700"
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOpenPinyin ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Left: Video player and Exercises overlay */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg border border-zinc-200 dark:border-zinc-800">
            {/* HTML5 Local video player */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              controls
              className="h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Questions Popup/Overlay when video reaches question timestamp */}
            {activeQuestion && activeEx && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                    <Lightbulb className="w-5 h-5 inline mr-1.5 text-amber-500" /> Trắc Nghiệm Dừng Video
                  </span>

                  <div>
                    <p className="text-md font-bold text-zinc-900 dark:text-white">
                      {activeEx.question}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="flex flex-col gap-2">
                    {getOptions(activeEx).map((opt: any) => {
                      const isSelected = selectedAnswer === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => !isAnswerChecked && setSelectedAnswer(opt.id)}
                          disabled={isAnswerChecked}
                          className={`w-full py-2.5 px-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${isSelected
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                            }`}
                        >
                          <span>
                            {opt.hanzi} {opt.pinyin && `(${opt.pinyin})`}
                          </span>
                          {isAnswerChecked && opt.isCorrect && (
                            <span className="text-emerald-500 font-bold">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Result notification */}
                  {isAnswerChecked && (
                    <div className={`p-3 rounded-lg text-xs font-semibold ${isAnswerCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}>
                      {isAnswerCorrect ? "Chính xác! Bạn học rất tốt." : "Chưa đúng rồi! Ôn tập lại nhé."}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="mt-2 flex justify-end gap-3">
                    {!isAnswerChecked ? (
                      <button
                        onClick={handleAnswerSubmit}
                        disabled={selectedAnswer === null}
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold transition-all"
                      >
                        Nộp câu trả lời
                      </button>
                    ) : (
                      <button
                        onClick={handleContinueVideo}
                        className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 px-5 py-2.5 text-xs font-bold transition-all"
                      >
                        Tiếp tục xem video
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white">
              {videoData?.title || "Video Bài Giảng"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {videoData?.title_trans || "Học tiếng Trung qua bài giảng video song ngữ"}
            </p>
          </div>
        </div>

        {/* Column Right: Subtitles list */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex flex-col h-[400px] lg:h-[480px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Phụ đề chạy chữ
            </h2>

            <div
              ref={subtitleContainerRef}
              className="flex-1 overflow-y-auto mt-2 pr-1 scrollbar-thin flex flex-col gap-1"
            >
              {enrichedSubtitles.map((sub, index) => (
                <SubtitleItem
                  key={sub.id || `sub-${index}`}
                  item={sub}
                  index={index}
                  activeIndex={activeSubtitleIndex}
                  isOpenPinyin={isOpenPinyin}
                  onWordPress={handleWordPress}
                  onReplayPress={handleReplayPress}
                  onVocabularyPress={() => { }}
                />
              ))}
            </div>
          </div>
        </div>
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
    </div>
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
