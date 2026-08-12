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
  isPlaying: boolean;
  playerRef: React.MutableRefObject<any>;
}

export function YouTubePlayer({
  videoId,
  isPlaying,
  playerRef,
}: YouTubePlayerProps) {
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
      if (player) return; // Tránh khởi tạo trùng lặp
      player = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          showinfo: 0,
          mute: 0,
          cc_load_policy: 0, // ẩn phụ đề mặc định của YT
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            ytPlayerRef.current = event.target;
            
            // Expose các API mà hook useDetailedVideoLogic yêu cầu qua ref.
            playerRef.current = {
              getCurrentTime: () => {
                if (event.target && typeof event.target.getCurrentTime === "function") {
                  return Promise.resolve(event.target.getCurrentTime());
                }
                return Promise.resolve(0);
              },
              seekTo: (seconds: number) => {
                if (event.target && typeof event.target.seekTo === "function") {
                  event.target.seekTo(seconds, true);
                }
              },
              playVideo: () => {
                if (event.target && typeof event.target.playVideo === "function") {
                  event.target.playVideo();
                }
              },
              pauseVideo: () => {
                if (event.target && typeof event.target.pauseVideo === "function") {
                  event.target.pauseVideo();
                }
              },
            };

            // Đồng bộ trạng thái chơi/dừng ban đầu
            if (isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
        },
      });
    };

    const checkAndInit = () => {
      if (window.YT && window.YT.Player && typeof window.YT.Player === "function") {
        initPlayer();
        return true;
      }
      return false;
    };

    if (!checkAndInit()) {
      checkInterval = setInterval(() => {
        if (checkAndInit() && checkInterval) {
          clearInterval(checkInterval);
        }
      }, 100);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        if (checkAndInit() && checkInterval) {
          clearInterval(checkInterval);
        }
      };
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (player && typeof player.destroy === "function") {
        player.destroy();
      }
      playerRef.current = null;
    };
  }, [videoId]);

  // Đồng bộ hóa trạng thái play/pause từ prop isPlaying
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (player && typeof player.getPlayerState === "function") {
      const state = player.getPlayerState();
      // YT.PlayerState.PLAYING là 1, YT.PlayerState.PAUSED là 2
      if (isPlaying && state !== 1) {
        player.playVideo();
      } else if (!isPlaying && state === 1) {
        player.pauseVideo();
      }
    }
  }, [isPlaying]);

  return (
    <div className="w-full h-full bg-black relative">
      <div id={containerId} className="w-full h-full absolute inset-0" />
    </div>
  );
}
