"use client";

import { useEffect, useRef } from "react";

// Khai báo kiểu YT toàn cục cho TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying?: boolean;
  playerRef: React.RefObject<any>;
  onStateChange?: (state: number) => void;
}

export function YouTubePlayer({
  videoId,
  isPlaying,
  playerRef,
  onStateChange,
}: Readonly<YouTubePlayerProps>) {
  const containerId = `yt-player-${videoId}`;
  const ytPlayerRef = useRef<any>(null);

  useEffect(() => {
    // 1. Tải script YouTube Iframe API nếu chưa tồn tại
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    let player: any;
    let checkInterval: NodeJS.Timeout | null = null;

    const initPlayer = () => {
      if (player || ytPlayerRef.current) return;
      const targetElement = document.getElementById(containerId);
      if (!targetElement) return;

      player = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          autoplay: 0,
          controls: 1,
          rel: 0,
          showinfo: 0,
          mute: 0,
          cc_load_policy: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            ytPlayerRef.current = event.target;

            // Cung cấp các hàm điều khiển video trực tiếp, trả về giá trị đồng bộ
            (playerRef as any).current = {
              getCurrentTime: () => {
                try {
                  return event.target?.getCurrentTime?.() ?? 0;
                } catch {
                  return 0;
                }
              },
              seekTo: (seconds: number) => {
                try {
                  event.target?.seekTo?.(seconds, true);
                } catch {
                  // ignore
                }
              },
              playVideo: () => {
                try {
                  event.target?.playVideo?.();
                } catch {
                  // ignore
                }
              },
              pauseVideo: () => {
                try {
                  event.target?.pauseVideo?.();
                } catch {
                  // ignore
                }
              },
            };
          },
          onStateChange: (event: any) => {
            onStateChange?.(event.data);
          },
        },
      });
    };

    const checkAndInit = () => {
      if (window.YT?.Player && typeof window.YT.Player === "function") {
        initPlayer();
        return true;
      }
      return false;
    };

    if (!checkAndInit()) {
      checkInterval = setInterval(() => {
        if (checkAndInit() && checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }, 100);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        if (checkAndInit() && checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      };
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (player && typeof player.destroy === "function") {
        player.destroy();
      }
      ytPlayerRef.current = null;
      (playerRef as any).current = null;
    };
  }, [videoId, containerId, onStateChange, playerRef]);

  useEffect(() => {
    if (isPlaying === undefined || !ytPlayerRef.current) return;
    try {
      const state = ytPlayerRef.current.getPlayerState?.();
      if (isPlaying && state !== 1) {
        ytPlayerRef.current.playVideo?.();
      } else if (!isPlaying && state === 1) {
        ytPlayerRef.current.pauseVideo?.();
      }
    } catch {
      // ignore
    }
  }, [isPlaying]);

  return (
    <div className="w-full h-full bg-black relative">
      <div id={containerId} className="w-full h-full absolute inset-0" />
    </div>
  );
}
