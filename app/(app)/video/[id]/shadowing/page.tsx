"use client";

import { use, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";

import { bilingualApi } from "@/api/bilingual";
import { useDetailedVideoLogic } from "@/lib/hooks/useDetailedVideoLogic";
import { segmentChineseText as apiSegmentChineseText } from "@/api/segment";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { BackButton } from "@/components/BackButton";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremiumGate } from "@/lib/hooks/usePremiumGate";
import { buildCheckoutUrl } from "@/api/plans";
import { PageContainer } from "@/components/PageContainer";
import { PinyinToggle } from "@/components/PinyinToggle";
import { VideoPlayerSection } from "@/components/video/VideoPlayerSection";
import { BilingualShadowing } from "@/components/bilingual/BilingualShadowing";
import { videoDataUsesYoutubePlayer, getYoutubeVideoIdFromVideoData } from "@/lib/utils/youtubeVideo";
import { speakChinese } from "@/lib/utils/speech";
import type { SubtitleSegment } from "@/lib/types/video";

const MOCK_VIDEO_DETAIL = {
  id: "v1",
  title: "看动漫学汉语：常用口语表达",
  title_trans: "Học tiếng Trung qua hoạt hình: Các cụm từ khẩu ngữ thông dụng",
  Video_Source: "Local",
  video_file: { filename_disk: "sample-video.mp4" },
  srt_file: { filename_disk: "sample-sub.srt" },
};

function ShadowingContent({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubePlayerRef = useRef<any>(null);
  const {
    loading: isPremiumLoading,
    premiumModalVisible,
    setPremiumModalVisible,
  } = usePremiumGate({ showOnMount: true });

  const [isOpenPinyin, setIsOpenPinyin] = useState(true);
  const [enrichedSubtitles, setEnrichedSubtitles] = useState<SubtitleSegment[]>([]);

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

  const currentVideo = videoData || MOCK_VIDEO_DETAIL;
  const isYoutubeVideo = videoDataUsesYoutubePlayer(currentVideo);
  const ytVideoId = isYoutubeVideo ? getYoutubeVideoIdFromVideoData(currentVideo) : null;

  const hookData = useDetailedVideoLogic(currentVideo, {
    videoRef,
    enableAutoSpeakSubtitle: false,
    youtubePlayerRef,
    flowMode: "subtitles",
  });

  const { subtitles, videoSource, handleVideoLoaded } = hookData;

  // Phân tách từ Hán ngữ phụ đề để hiển thị pinyin/ruby.
  useEffect(() => {
    let cancelled = false;
    const enrich = async () => {
      const base = subtitles && subtitles.length > 0 ? subtitles : [];
      if (base.length === 0) {
        setEnrichedSubtitles([]);
        return;
      }
      try {
        const segments = await apiSegmentChineseText(base.map((s: any) => s.chinese));
        if (!cancelled) {
          setEnrichedSubtitles(
            base.map((s: any, idx) => ({
              index: idx,
              start: s.start,
              end: s.end,
              chinese: s.chinese,
              vietnamese: s.vietnamese,
              segmentedWords: (segments[idx] || []).map((w: any) => ({
                word: w.word,
                pinyin: w.pinyin,
              })),
            })),
          );
        }
      } catch (err) {
        if (!isAIConsentRequiredError(err)) {
          console.warn("API segment for video shadowing failed:", err);
        }
        if (!cancelled) {
          setEnrichedSubtitles(
            base.map((s: any, idx) => ({
              index: idx,
              start: s.start,
              end: s.end,
              chinese: s.chinese,
              vietnamese: s.vietnamese,
              segmentedWords: s.chinese
                ? s.chinese.split("").map((c: string) => ({ word: c, pinyin: "" }))
                : [],
            })),
          );
        }
      }
    };
    enrich();
    return () => {
      cancelled = true;
    };
  }, [subtitles]);

  // BilingualShadowing tự quản lý ghi âm/chấm điểm từng câu (giống tab Shadowing bài đọc).
  const srtData = useMemo(
    () =>
      enrichedSubtitles.map((s) => ({
        ...s,
        segmentedWords: s.segmentedWords?.map((w) => ({
          ...w,
          pinyin: isOpenPinyin ? w.pinyin : "",
        })),
      })),
    [enrichedSubtitles, isOpenPinyin],
  );

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
        feature="luyện Shadowing video"
        description="Tính năng Shadowing chỉ dành cho tài khoản Premium."
        upgradeUrl={buildCheckoutUrl(undefined, `video-${id}`)}
      />

      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 w-full">
        <BackButton href={`/video/${id}`} label="Chọn kiểu xem" />
        <PinyinToggle isOpen={isOpenPinyin} onChange={setIsOpenPinyin} />
      </div>

      {/* Main Content: Video + Shadowing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <VideoPlayerSection
          isYoutubeVideo={isYoutubeVideo}
          ytVideoId={ytVideoId}
          youtubePlayerRef={youtubePlayerRef}
          videoRef={videoRef}
          videoSource={videoSource}
          handleTimeUpdate={() => {}}
          handleVideoLoaded={handleVideoLoaded}
          title={videoData?.title}
          titleTrans={videoData?.title_trans}
        />

        <div className="lg:col-span-1">
          <BilingualShadowing srtData={srtData} onSpeakWord={speakChinese} />
        </div>
      </div>
    </PageContainer>
  );
}

export default function VideoShadowingPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
        </div>
      }
    >
      <ShadowingContent params={params} />
    </Suspense>
  );
}
