/* eslint-disable jsx-a11y/media-has-caption */
"use client";

import { YouTubePlayer } from "./YouTubePlayer";

interface VideoPlayerSectionProps {
  isYoutubeVideo: boolean;
  ytVideoId: string | null;
  youtubeIsPlaying: boolean;
  youtubePlayerRef: React.RefObject<any>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSource: string;
  handleTimeUpdate: () => void;
  handleVideoLoaded: () => void;
  title?: string;
  titleTrans?: string;
}

export function VideoPlayerSection({
  isYoutubeVideo,
  ytVideoId,
  youtubeIsPlaying,
  youtubePlayerRef,
  videoRef,
  videoSource,
  handleTimeUpdate,
  handleVideoLoaded,
  title,
  titleTrans,
}: Readonly<VideoPlayerSectionProps>) {
  return (
    <div className="lg:col-span-2 flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg border border-zinc-200 dark:border-zinc-800">
        {isYoutubeVideo && ytVideoId ? (
          <YouTubePlayer
            videoId={ytVideoId}
            isPlaying={youtubeIsPlaying}
            playerRef={youtubePlayerRef}
          />
        ) : (
          <video
            ref={videoRef}
            src={videoSource}
            controls
            className="h-full w-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onSeeked={handleTimeUpdate}
            onSeeking={handleTimeUpdate}
            onLoadedMetadata={handleVideoLoaded}
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
