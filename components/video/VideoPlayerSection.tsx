/* eslint-disable jsx-a11y/media-has-caption */
"use client";

import { YouTubePlayer } from "./YouTubePlayer";
import { VideoQuizOverlay } from "./VideoQuizOverlay";

interface VideoPlayerSectionProps {
  isYoutubeVideo: boolean;
  ytVideoId: string | null;
  youtubePlayerRef: React.RefObject<any>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSource: string;
  handleTimeUpdate: () => void;
  handleVideoLoaded: () => void;
  title?: string;
  titleTrans?: string;
  activeQuestion?: any;
  showResult?: boolean;
  answerResults?: any[];
  getOptions?: (ex: any) => any[];
  onSubmitQuiz?: (key: string) => Promise<any>;
  onContinueQuiz?: () => void;
}

export function VideoPlayerSection({
  isYoutubeVideo,
  ytVideoId,
  youtubePlayerRef,
  videoRef,
  videoSource,
  handleTimeUpdate,
  handleVideoLoaded,
  title,
  titleTrans,
  activeQuestion,
  showResult = false,
  answerResults = [],
  getOptions,
  onSubmitQuiz,
  onContinueQuiz,
}: Readonly<VideoPlayerSectionProps>) {
  return (
    <div className="lg:col-span-2 flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg border border-zinc-200 dark:border-zinc-800">
        {isYoutubeVideo && ytVideoId ? (
          <YouTubePlayer
            videoId={ytVideoId}
            playerRef={youtubePlayerRef}
          />
        ) : videoSource ? (
          <video
            ref={videoRef}
            src={videoSource}
            controls
            controlsList="nodownload"
            className="h-full w-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onSeeked={handleTimeUpdate}
            onSeeking={handleTimeUpdate}
            onLoadedMetadata={handleVideoLoaded}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/40 text-sm text-zinc-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải video...</span>
            </div>
          </div>
        )}

        {/* Interactive Overlay when question triggers */}
        {activeQuestion && onSubmitQuiz && onContinueQuiz && (
          <VideoQuizOverlay
            activeQuestion={activeQuestion}
            showResult={showResult}
            answerResults={answerResults}
            getOptions={getOptions}
            onSubmit={onSubmitQuiz}
            onContinue={onContinueQuiz}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white">
          {title || "Video Bài Giảng"}
        </h1>
        <p className="text-sm text-zinc-550 dark:text-zinc-400 font-semibold">
          {titleTrans || "Học tiếng Trung qua bài giảng video song ngữ"}
        </p>
      </div>
    </div>
  );
}
