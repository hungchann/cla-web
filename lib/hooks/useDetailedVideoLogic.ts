import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { bilingualApi } from "@/api/bilingual";
import { videoDataUsesYoutubePlayer } from "@/lib/utils/youtubeVideo";
import { parseSRTtoArray } from "@/services/subtitle";
import { speakChinese } from "@/lib/utils/speech";
import { playAnswerFeedback } from "@/services/audioFeedback";
import { useRouter } from "next/navigation";
import { logger } from "@/services/logger";

export interface SubtitleItem {
  id: string | number;
  start: string;
  end: string;
  chinese: string;
  vietnamese: string;
}

export interface ExerciseItem {
  id: number;
  question: string;
  time_start: string;
  time_end: string;
  sort_id?: number | string;
  [key: string]: any;
}

const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(":");
  const hours = Number.parseInt(parts[0]) || 0;
  const minutes = Number.parseInt(parts[1]) || 0;
  const secondsPart = parts[2] || "0";
  const secondsWithMs = secondsPart.replace(",", ".");
  const seconds = Number.parseFloat(secondsWithMs) || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

export const useDetailedVideoLogic = (
  videoData: any,
  opts?: {
    videoRef?: RefObject<HTMLVideoElement | null>;
    /** Auto TTS đọc phụ đề khi không có câu hỏi. */
    enableAutoSpeakSubtitle?: boolean;
    /** YouTube: ref tới `react-native-youtube-iframe` để lấy `currentTime` / pause. */
    youtubePlayerRef?: RefObject<any>;
    setYoutubeIsPlaying?: (playing: boolean) => void;
  },
) => {
  const router = useRouter();
  const [exerciseData, setExerciseData] = useState<ExerciseItem[] | null>(null);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ExerciseItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerResults, setAnswerResults] = useState<any[]>([]);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [nextQuestionId, setNextQuestionId] = useState<number | null>(null);
  const [hasCompletedAll, setHasCompletedAll] = useState(false);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleItem | null>(null);

  const isComponentMounted = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inFlightYoutubeClockRef = useRef(false);
  const currentSubtitleRef = useRef<SubtitleItem | null>(null);
  const lastSpokenSubtitleIdRef = useRef<string | number | null>(null);
  // Khi vừa trả lời xong (đang hiện kết quả/animation), không auto nhảy sang câu kế tiếp
  // để tránh trường hợp 2 câu hỏi nằm sát nhau gây "dính" state/UI.
  const isAnswerTransitionRef = useRef(false);

  // Virtual clock cho YouTube: tránh độ trễ async của getCurrentTime() trong detection.
  // anchor lưu { time: giây thực từ YT, ts: Date.now() lúc đó }.
  // Khi đang play: virtualTime = anchor.time + (Date.now() - anchor.ts) / 1000
  // Khi pause: virtualTime = anchor.time (đóng băng)
  const ytVirtualAnchorRef = useRef<{ time: number; ts: number } | null>(null);
  const ytIsPlayingInternalRef = useRef(false);
  // Thời gian video YouTube tại thời điểm pause (để remount player tiếp tục từ đây).
  const [ytSavedTime, setYtSavedTime] = useState(0);

  const isYoutubeVideo = videoDataUsesYoutubePlayer(videoData);

  const videoSource = useMemo(() => {
    if (!videoData?.video_file?.filename_disk) return "";
    return `https://marutek.space/assets/${videoData.video_file.filename_disk}`;
  }, [videoData?.video_file?.filename_disk]);

  const player = useMemo(() => {
    return {
      play: () => {
        if (opts?.videoRef?.current) {
          opts.videoRef.current.play().catch((err: unknown) => {
            logger.error("Error playing video:", err);
          });
        }
      },
      pause: () => {
        if (opts?.videoRef?.current) {
          opts.videoRef.current.pause();
        }
      },
      get currentTime() {
        return opts?.videoRef?.current ? opts.videoRef.current.currentTime : 0;
      },
      set currentTime(val: number) {
        if (opts?.videoRef?.current) {
          opts.videoRef.current.currentTime = val;
        }
      }
    };
  }, [opts?.videoRef]);

  const status = isVideoLoaded ? "readyToPlay" : "loading";

  useEffect(() => {
    const video = opts?.videoRef?.current;
    if (!video) return;

    const handleLoaded = () => {
      setIsVideoLoaded(true);
    };

    if (video.readyState >= 1) {
      setIsVideoLoaded(true);
    } else {
      video.addEventListener("loadedmetadata", handleLoaded);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
    };
  }, [opts?.videoRef]);

  useEffect(() => {
    if (isYoutubeVideo) return;
    if (status === "readyToPlay") {
      try {
        player.play();
      } catch (error) {
        logger.error("Error starting video:", error);
      }
    }
  }, [status, player, isYoutubeVideo]);

  useEffect(() => {
    let isCancelled = false;
    const loadSubtitles = async () => {
      if (!videoData?.srt_file?.filename_disk) {
        if (!isCancelled) {
          setSubtitles([]);
          currentSubtitleRef.current = null;
          setCurrentSubtitle(null);
        }
        return;
      }
      try {
        const response = await fetch(
          `https://marutek.space/assets/${videoData.srt_file.filename_disk}`,
        );
        const srtContent = await response.text();
        const parsed = await parseSRTtoArray(srtContent);
        const sorted = Array.isArray(parsed)
          ? [...parsed].sort((a: any, b: any) => timeToSeconds(a.start) - timeToSeconds(b.start))
          : [];
        if (!isCancelled) {
          setSubtitles(sorted as SubtitleItem[]);
          currentSubtitleRef.current = null;
          setCurrentSubtitle(null);
        }
      } catch (error) {
        logger.error("Error loading subtitles:", error);
        if (!isCancelled) {
          setSubtitles([]);
          currentSubtitleRef.current = null;
          setCurrentSubtitle(null);
        }
      }
    };
    loadSubtitles();
    return () => {
      isCancelled = true;
    };
  }, [videoData?.srt_file?.filename_disk]);

  useEffect(() => {
    const getExerciseById = async () => {
      try {
        const response = await bilingualApi.getExerciseById(videoData.id);
        const sortedExercises = Array.isArray(response.exercises)
          ? [...response.exercises].sort(
              (a: any, b: any) => timeToSeconds(a.time_end) - timeToSeconds(b.time_end),
            )
          : response.exercises;
        setExerciseData(sortedExercises);
      } catch (error: any) {
        if (error.message === "Unauthorized" || error.message === "Failed to fetch exercise") {
          router.replace("/sign-in");
        }
      }
    };
    if (videoData?.id) {
      getExerciseById();
    }
  }, [videoData?.id]);

  // Sử dụng Refs để tránh restart interval khi state thay đổi
  const exerciseDataRef = useRef<ExerciseItem[] | null>(null);
  const answeredIdsRef = useRef<number[]>([]);
  const activeQuestionRef = useRef<ExerciseItem | null>(null);
  const subtitlesRef = useRef<SubtitleItem[]>([]);

  useEffect(() => {
    exerciseDataRef.current = exerciseData;
  }, [exerciseData]);
  useEffect(() => {
    answeredIdsRef.current = answeredIds;
  }, [answeredIds]);
  useEffect(() => {
    activeQuestionRef.current = activeQuestion;
  }, [activeQuestion]);
  useEffect(() => {
    subtitlesRef.current = subtitles;
  }, [subtitles]);

  // ─── Shared helpers (dùng refs → an toàn khi gọi từ bất kỳ effect nào) ───

  const updateCurrentSubtitle = useCallback((currentTime: number) => {
    const subs = subtitlesRef.current;
    if (!Array.isArray(subs) || subs.length === 0) return;
    const next = subs.find((st) => {
      const s = timeToSeconds(st.start);
      const e = timeToSeconds(st.end);
      return currentTime >= s && currentTime <= e;
    });
    if (next) {
      if (currentSubtitleRef.current?.id !== next.id) {
        currentSubtitleRef.current = next;
        setCurrentSubtitle(next);
      }
    } else if (currentSubtitleRef.current) {
      currentSubtitleRef.current = null;
      setCurrentSubtitle(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pausePlayback = useCallback(() => {
    logger.debug("[pausePlayback] Called. isYoutube:", isYoutubeVideo);
    if (isYoutubeVideo) {
      const anchor = ytVirtualAnchorRef.current;
      let frozenTime = 0;
      if (anchor) {
        frozenTime = ytIsPlayingInternalRef.current
          ? anchor.time + (Date.now() - anchor.ts) / 1000
          : anchor.time;
        ytVirtualAnchorRef.current = { time: frozenTime, ts: Date.now() };
        logger.debug("[pausePlayback] Froze YT time to:", frozenTime);
      }
      ytIsPlayingInternalRef.current = false;
      setYtSavedTime(frozenTime);
      opts?.setYoutubeIsPlaying?.(false);
    } else if (typeof (player as any)?.pause === "function") {
      try { (player as any).pause(); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYoutubeVideo, player, opts?.setYoutubeIsPlaying]);

  const syncExerciseState = useCallback((currentTime: number) => {
    if (isAnswerTransitionRef.current) {
      logger.debug("[syncExerciseState] Skipped - isAnswerTransition");
      return;
    }
    const exercises = exerciseDataRef.current;
    if (!exercises) {
      logger.debug("[syncExerciseState] No exercises");
      return;
    }

    const firstUnanswered = exercises.find((q) => !answeredIdsRef.current.includes(q.id));
    setNextQuestionId(firstUnanswered?.id ?? null);

    const currentQuestion = exercises.find((q) => {
      if (answeredIdsRef.current.includes(q.id)) return false;
      const endTime = timeToSeconds(q.time_end);
      // Chỉ hiển thị câu hỏi SAU KHI câu đã phát xong (>= time_end),
      // với cửa sổ 3 giây để polling kịp bắt được điểm kết thúc.
      return currentTime >= endTime && currentTime <= endTime + 3;
    });

    if (currentQuestion) {
      logger.debug(
        `[syncExerciseState] Found Q: id=${currentQuestion.id}, t=${currentTime}s, range=[${timeToSeconds(currentQuestion.time_start)}-${timeToSeconds(currentQuestion.time_end)}]`,
      );
      if (activeQuestionRef.current) {
        logger.debug(`[syncExerciseState] Already has active question, skipping`);
      }
    }

    if (currentQuestion && !activeQuestionRef.current) {
      logger.debug(`[syncExerciseState] ACTIVATE Q${currentQuestion.id}, calling pausePlayback()`);
      activeQuestionRef.current = currentQuestion;
      setActiveQuestion(currentQuestion);
      pausePlayback();
    }
  }, [pausePlayback]);

  const handleTimeBoundaryPausing = useCallback((currentTime: number) => {
    const activeQ = activeQuestionRef.current;
    if (activeQ && currentTime >= timeToSeconds(activeQ.time_end)) {
      pausePlayback();
    }
    const subtitleEnded =
      currentSubtitleRef.current &&
      currentTime >= timeToSeconds(currentSubtitleRef.current.end);
    if (subtitleEnded && activeQ) {
      pausePlayback();
    }
  }, [pausePlayback]);

  // ─── Effect: Local video detection (300 ms polling via native player) ───
  useEffect(() => {
    if (isYoutubeVideo || hasCompletedAll) return;
    if (status !== "readyToPlay" || !player || !videoSource || videoSource === "") return;

    if (intervalRef.current) clearInterval(intervalRef.current as any);

    intervalRef.current = setInterval(() => {
      if (!isComponentMounted.current) return;
      try {
        const currentTime =
          typeof player.currentTime === "number" ? player.currentTime : Number.NaN;
        if (!Number.isFinite(currentTime)) return;
        updateCurrentSubtitle(currentTime);
        syncExerciseState(currentTime);
        handleTimeBoundaryPausing(currentTime);
      } catch (err) {
        logger.error("[useDetailedVideoLogic] Local polling error:", err);
      }
    }, 300) as any;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
    };
  }, [
    isYoutubeVideo,
    hasCompletedAll,
    status,
    player,
    videoSource,
    updateCurrentSubtitle,
    syncExerciseState,
    handleTimeBoundaryPausing,
  ]);

  // ─── Effect: YouTube detection via Virtual Clock ───
  // Không dùng getCurrentTime() cho mỗi tick (async, 100-200ms lag).
  // Thay bằng: virtual clock (Date.now() interpolation) cho detection 100ms,
  // và drift correction từ getCurrentTime() mỗi 2000ms (với timeout chống treo).
  useEffect(() => {
    if (!isYoutubeVideo || hasCompletedAll) return;

    if (intervalRef.current) clearInterval(intervalRef.current as any);
    // Reset inFlight để tránh bị block từ effect lần trước
    inFlightYoutubeClockRef.current = false;

    let driftMs = 0;

    // Khởi tạo virtual clock ngay lập tức (lần đầu)
    const api = opts?.youtubePlayerRef?.current;
    logger.debug("[YouTube effect] Initializing anchor. api:", !!api, "getCurrentTime?", api?.getCurrentTime ? "yes" : "no");

    if (api && typeof api.getCurrentTime === "function" && !inFlightYoutubeClockRef.current) {
      logger.debug("[YouTube effect] Calling api.getCurrentTime()...");
      inFlightYoutubeClockRef.current = true;
      const initTimeout = setTimeout(() => {
        logger.debug("[YouTube effect] getCurrentTime timeout");
        inFlightYoutubeClockRef.current = false;
      }, 1500);

      api.getCurrentTime()
        .then((t: number) => {
          logger.debug("[YouTube effect] getCurrentTime resolved with:", t);
          clearTimeout(initTimeout);
          if (typeof t === "number" && Number.isFinite(t)) {
            ytVirtualAnchorRef.current = { time: t, ts: Date.now() };
            ytIsPlayingInternalRef.current = true;
            logger.debug("[YouTube effect] Anchor initialized with time:", t);
          } else {
            logger.debug("[YouTube effect] Invalid time value:", t);
          }
        })
        .catch((e: any) => {
          logger.debug("[YouTube effect] getCurrentTime error:", e);
          clearTimeout(initTimeout);
        })
        .finally(() => { inFlightYoutubeClockRef.current = false; });
    } else {
      logger.debug("[YouTube effect] Cannot init anchor - conditions not met");
    }

    intervalRef.current = setInterval(() => {
      if (!isComponentMounted.current) return;

      const anchor = ytVirtualAnchorRef.current;

      // Nếu chưa có anchor, thử khởi tạo từ YouTube API
      if (!anchor) {
        if (inFlightYoutubeClockRef.current) {
          logger.debug("[YouTube polling] No anchor, init in-flight");
          return;
        }
        const playerApi = opts?.youtubePlayerRef?.current;
        if (!playerApi || typeof playerApi.getCurrentTime !== "function") {
          logger.debug("[YouTube polling] No anchor, API not ready yet");
          return;
        }
        logger.debug("[YouTube polling] No anchor, attempting init...");
        inFlightYoutubeClockRef.current = true;
        const initTimeout = setTimeout(() => {
          logger.debug("[YouTube polling] Init timeout");
          inFlightYoutubeClockRef.current = false;
        }, 1500);
        playerApi.getCurrentTime()
          .then((t: number) => {
            clearTimeout(initTimeout);
            if (typeof t === "number" && Number.isFinite(t)) {
              ytVirtualAnchorRef.current = { time: t, ts: Date.now() };
              ytIsPlayingInternalRef.current = true;
              logger.debug("[YouTube polling] Anchor initialized with time:", t);
            } else {
              logger.debug("[YouTube polling] Invalid init time:", t);
            }
          })
          .catch((e: any) => {
            logger.debug("[YouTube polling] Init error:", e);
            clearTimeout(initTimeout);
          })
          .finally(() => { inFlightYoutubeClockRef.current = false; });
        return;
      }

      const virtualTime = ytIsPlayingInternalRef.current
        ? anchor.time + (Date.now() - anchor.ts) / 1000
        : anchor.time;

      logger.debug(
        `[YouTube polling] virtualTime=${virtualTime.toFixed(2)}s, isPlaying=${ytIsPlayingInternalRef.current}, activeQ=${activeQuestionRef.current ? activeQuestionRef.current.id : "none"}`,
      );
      updateCurrentSubtitle(virtualTime);
      syncExerciseState(virtualTime);
      handleTimeBoundaryPausing(virtualTime);

      // 2. Drift correction mỗi 2000ms - chỉ khi đang play
      driftMs += 100;
      if (driftMs < 2000 || inFlightYoutubeClockRef.current) return;
      driftMs = 0;

      // Khi đang pause, KHÔNG cập nhật anchor từ YouTube thực (giữ virtual time đông cứng).
      // Không seekTo vì sẽ gây cycle playing/buffering/playing với YouTube WebView.
      if (!ytIsPlayingInternalRef.current) return;

      const playerApi = opts?.youtubePlayerRef?.current;
      if (!playerApi || typeof playerApi.getCurrentTime !== "function") return;

      inFlightYoutubeClockRef.current = true;
      // Timeout 1.5s để tránh trường hợp WebView không reply → bị treo mãi
      const timeoutId = setTimeout(() => {
        inFlightYoutubeClockRef.current = false;
      }, 1500);

      playerApi.getCurrentTime()
        .then((t: number) => {
          clearTimeout(timeoutId);
          if (typeof t === "number" && Number.isFinite(t)) {
            // Cập nhật anchor với thời gian thực từ YouTube
            ytVirtualAnchorRef.current = { time: t, ts: Date.now() };
          }
        })
        .catch(() => { clearTimeout(timeoutId); })
        .finally(() => { inFlightYoutubeClockRef.current = false; });
    }, 100) as any;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
      // Bắt buộc reset để interval mới không bị chặn bởi call đang bay
      inFlightYoutubeClockRef.current = false;
    };
  }, [
    isYoutubeVideo,
    hasCompletedAll,
    opts?.youtubePlayerRef,
    opts?.setYoutubeIsPlaying,
    updateCurrentSubtitle,
    syncExerciseState,
    handleTimeBoundaryPausing,
  ]);

  useEffect(() => {
    if (opts?.enableAutoSpeakSubtitle === false) return;
    if (!currentSubtitle?.id || !currentSubtitle?.chinese || activeQuestion) return;
    if (lastSpokenSubtitleIdRef.current === currentSubtitle.id) return;
    lastSpokenSubtitleIdRef.current = currentSubtitle.id;
    speakChinese(String(currentSubtitle.chinese));
  }, [currentSubtitle?.id, currentSubtitle?.chinese, activeQuestion, opts?.enableAutoSpeakSubtitle]);

  const handleOptionPress = async (key: string) => {
    if (!activeQuestion) return;
    const answerText = activeQuestion[`answer_${key}`];
    try {
      isAnswerTransitionRef.current = true;
      const answers = [
        {
          questionId: activeQuestion.id,
          answer: key,
          answerText,
          selectAnswer: key,
        },
      ];
      const response = await bilingualApi.submitExercise(answers);
      const result = Array.isArray(response) ? response[0] : response;

      setAnswerResults((prev) => [
        ...prev,
        {
          ...result,
          answerText,
          question: activeQuestion.question,
          sort_id: activeQuestion.sort_id,
        },
      ]);
      setShowResult(true);

      playAnswerFeedback(result.status === "Đúng");

      const nextAnsweredCount = answeredIds.length + 1;
      const totalCount = Array.isArray(exerciseData) ? exerciseData.length : 0;
      setAnsweredIds((prev) => [...prev, activeQuestion.id]);

      setTimeout(() => {
        // Kết thúc phase hiển thị kết quả câu vừa trả lời
        setShowResult(false);
        setActiveQuestion(null);
        activeQuestionRef.current = null; // clear ref ngay, không chờ useEffect

        // Nếu câu tiếp theo bắt đầu ngay tại thời điểm hiện tại → giữ pause và mở luôn câu đó
        try {
          const exercises = exerciseDataRef.current;
          if (Array.isArray(exercises) && exercises.length > 0) {
            const nextUnanswered = exercises.find((q) => !answeredIdsRef.current.includes(q.id));
            const getVirtualOrLocalTime = () => {
              if (isYoutubeVideo) {
                const anchor = ytVirtualAnchorRef.current;
                if (!anchor) return Number.NaN;
                return ytIsPlayingInternalRef.current
                  ? anchor.time + (Date.now() - anchor.ts) / 1000
                  : anchor.time;
              }
              const t = (player as any)?.currentTime;
              return typeof t === "number" ? t : Number.NaN;
            };
            const nowT = getVirtualOrLocalTime();
            if (nextUnanswered && Number.isFinite(nowT)) {
              const s = timeToSeconds(nextUnanswered.time_start);
              const e = timeToSeconds(nextUnanswered.time_end);
              if (nowT >= s && nowT <= e) {
                activeQuestionRef.current = nextUnanswered;
                setActiveQuestion(nextUnanswered);
                pausePlayback();
                isAnswerTransitionRef.current = false;
                return;
              }
            }
          }
        } catch {}

        isAnswerTransitionRef.current = false;
        if (totalCount > 0 && nextAnsweredCount === totalCount) {
          setHasCompletedAll(true);
          setShowCompletionOverlay(true);
        } else if (isYoutubeVideo && opts?.setYoutubeIsPlaying && isComponentMounted.current) {
          try {
            // Mở băng virtual clock để tiếp tục đếm thời gian
            ytIsPlayingInternalRef.current = true;
            if (ytVirtualAnchorRef.current) {
              ytVirtualAnchorRef.current = { ...ytVirtualAnchorRef.current, ts: Date.now() };
            }
            opts.setYoutubeIsPlaying(true);
          } catch (error) {
            logger.error("[useDetailedVideoLogic] Error resuming YouTube after answer:", error);
          }
        } else if (
          player &&
          videoSource &&
          videoSource !== "" &&
          typeof player.play === "function" &&
          isComponentMounted.current
        ) {
          try {
            player.play();
          } catch (error) {
            logger.error("[useDetailedVideoLogic] Error playing after answer:", error);
          }
        }
      }, 1500);
    } catch (error) {
      logger.error("[useDetailedVideoLogic] Error submitting exercise:", error);
      setShowResult(false);
      isAnswerTransitionRef.current = false;
    }
  };

  const handleContinueWatching = useCallback(() => {
    setShowCompletionOverlay(false);
    try {
      if (isYoutubeVideo) {
        ytIsPlayingInternalRef.current = true;
        if (ytVirtualAnchorRef.current) {
          ytVirtualAnchorRef.current = { ...ytVirtualAnchorRef.current, ts: Date.now() };
        }
        opts?.setYoutubeIsPlaying?.(true);
      } else if (player && typeof (player as any).play === "function") {
        (player as any).play();
      }
    } catch (error) {
      logger.error("[useDetailedVideoLogic] Error in handleContinueWatching:", error);
    }
  }, [player, isYoutubeVideo, opts?.setYoutubeIsPlaying]);

  const handleViewResults = useCallback(() => {
    try {
      const searchParams = new URLSearchParams({
        results: JSON.stringify(answerResults),
        video: JSON.stringify(videoData || {}),
      });
      router.push(`/video/results?${searchParams.toString()}`);
    } catch (error) {
      logger.error("[useDetailedVideoLogic] Error in handleViewResults:", error);
    }
  }, [answerResults, videoData, router]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
      inFlightYoutubeClockRef.current = false;
      isComponentMounted.current = false;
    };
  }, []);

  return {
    player,
    videoSource,
    isVideoLoaded,
    showCompletionOverlay,
    activeQuestion,
    exerciseData,
    subtitles,
    nextQuestionId,
    answeredIds,
    answerResults,
    showResult,
    hasCompletedAll,
    status,
    isComponentMounted,
    handleOptionPress,
    handleContinueWatching,
    handleViewResults,
    ytSavedTime,
  };
};
