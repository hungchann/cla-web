"use client";

import { use, useEffect, useRef, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import { translateWord } from "@/api/apiService";
import { segmentChineseText as apiSegmentChineseText } from "@/api/segment";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { BackButton } from "@/components/BackButton";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremiumGate } from "@/lib/hooks/usePremiumGate";
import { buildCheckoutUrl } from "@/api/plans";
import { PageContainer } from "@/components/PageContainer";
import { PinyinToggle } from "@/components/PinyinToggle";

import { VideoPlayerSection } from "@/components/video/VideoPlayerSection";
import { VideoTeleprompterPanel } from "@/components/video/VideoTeleprompterPanel";
import { videoDataUsesYoutubePlayer, getYoutubeVideoIdFromVideoData } from "@/lib/utils/youtubeVideo";
import { speakChinese } from "@/lib/utils/speech";
import { useSubtitleSync } from "@/lib/hooks/useSubtitleSync";
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
      segmentedWords: lines[2] ? lines[2].split("").map((c) => ({ word: c, pinyin: "" })) : [],
    };
  });
}

function SubtitlesContent({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { loading: isPremiumLoading, premiumModalVisible, setPremiumModalVisible } = usePremiumGate({ showOnMount: true });

  const [isOpenPinyin, setIsOpenPinyin] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [enrichedSubtitles, setEnrichedSubtitles] = useState<any[]>([]);

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
    flowMode: "subtitles",
  });

  const { subtitles, videoSource, handleVideoLoaded, onVideoTimeUpdate } = hookData;

  // Phân tách từ Hán ngữ phụ đề
  useEffect(() => {
    const enrich = async () => {
      const baseSubs = subtitles && subtitles.length > 0 ? subtitles : parseMockSRT();
      if (!baseSubs || baseSubs.length === 0) {
        setEnrichedSubtitles([]);
        return;
      }
      try {
        const texts = baseSubs.map((s: any) => s.chinese);
        const segments = await apiSegmentChineseText(texts);
        const enriched = baseSubs.map((s: any, idx: number) => {
          const apiWords = segments[idx] || [];
          return {
            ...s,
            segmentedWords: apiWords.map((w: any) => ({ word: w.word, pinyin: w.pinyin })),
          };
        });
        setEnrichedSubtitles(enriched);
      } catch (err) {
        if (isAIConsentRequiredError(err)) {
          console.log("AI consent not granted yet, using local video subtitle splits fallback.");
        } else {
          console.warn("API segment for video subtitles failed:", err);
        }
        const enriched = baseSubs.map((s: any) => ({
          ...s,
          segmentedWords: s.chinese ? s.chinese.split("").map((c: string) => ({ word: c, pinyin: "" })) : [],
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
            onVideoTimeUpdate?.(t);
          }
        } catch {
          // ignore
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isYoutubeVideo, onVideoTimeUpdate]);

  // Polling current time for local video — browsers throttle `timeupdate` to
  // ~4Hz, so a 100ms fallback keeps the teleprompter tracking smoothly.
  useEffect(() => {
    if (isYoutubeVideo) return;
    const interval = setInterval(() => {
      if (videoRef.current) {
        const t = videoRef.current.currentTime;
        if (typeof t === "number" && Number.isFinite(t)) {
          setCurrentTime((prev) => (Math.abs(prev - t) > 0.02 ? t : prev));
        }
      }
    }, 100);
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

  const handleReplayPress = (item: any) => {
    const seconds = timeToSeconds(String(item.start));
    if (isYoutubeVideo) {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(seconds);
        youtubePlayerRef.current.playVideo();
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  if (isLoading || isPremiumLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          <Link
            href={`/video/${id}/quiz`}
            className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
          >
            Chuyển sang trắc nghiệm &rarr;
          </Link>
          <PinyinToggle isOpen={isOpenPinyin} onChange={setIsOpenPinyin} />
        </div>
      </div>

      {/* Main Content: Video + Subtitles */}
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
        />

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex flex-col h-[400px] lg:h-[480px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-2 shrink-0">
              Phụ đề
            </h3>
            <VideoTeleprompterPanel
              items={enrichedSubtitles}
              activeIndex={activeSubtitleIndex}
              isOpenPinyin={isOpenPinyin}
              onWordPress={handleWordPress}
              onReplayPress={handleReplayPress}
              onSpeak={speakChinese}
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

export default function SubtitlesPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    }>
      <SubtitlesContent params={params} />
    </Suspense>
  );
}
