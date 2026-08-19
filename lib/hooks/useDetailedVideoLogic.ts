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

const timeToSeconds = (val: string | number | undefined | null): number => {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const str = String(val).trim();
  if (!str) return 0;

  if (/^\d+(\.\d+)?$/.test(str)) {
    return Number.parseFloat(str) || 0;
  }

  const clean = str.replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    const hours = Number.parseFloat(parts[0]) || 0;
    const minutes = Number.parseFloat(parts[1]) || 0;
    const seconds = Number.parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = Number.parseFloat(parts[0]) || 0;
    const seconds = Number.parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  const parsed = Number.parseFloat(clean);
  return Number.isNaN(parsed) ? 0 : parsed;
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
    /** Exercises dự phòng khi API không trả về (demo/mock). */
    fallbackExercises?: ExerciseItem[];
    /**
     * Luồng đang hoạt động:
     * - "subtitles": chỉ đồng bộ phụ đề (không chạy trắc nghiệm).
     * - "quiz": chỉ chạy trắc nghiệm (không đồng bộ phụ đề).
     * - "both": chạy cả hai (mặc định).
     */
    flowMode?: "subtitles" | "quiz" | "both";
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
  const currentSubtitleRef = useRef<SubtitleItem | null>(null);
  const lastSpokenSubtitleIdRef = useRef<string | number | null>(null);
  // Khi vừa trả lời xong (đang hiện kết quả/animation), không auto nhảy sang câu kế tiếp
  // để tránh trường hợp 2 câu hỏi nằm sát nhau gây "dính" state/UI.
  const isAnswerTransitionRef = useRef(false);

  // flowMode quyết định luồng nào đang chạy (phụ đề / trắc nghiệm / cả hai).
  // Dùng ref để polling interval không phải restart mỗi khi user đổi tab.
  const flowModeRef = useRef<"subtitles" | "quiz" | "both">("both");

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
            // Autoplay bị trình duyệt chặn (NotAllowedError) là hành vi bình thường,
            // người dùng cần bấm nút play trước. Không ghi nhận là lỗi.
            if (
              err instanceof DOMException &&
              (err.name === "NotAllowedError" || err.name === "AbortError")
            ) {
              logger.debug("Video autoplay blocked by browser, waiting for user interaction.");
              return;
            }
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
        const parsed = parseSRTtoArray(srtContent);
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
        logger.debug("[useDetailedVideoLogic] Fetching exercises for id:", videoData.id);
        const response = await bilingualApi.getExerciseById(videoData.id);
        logger.debug("[useDetailedVideoLogic] Exercise API raw response:", JSON.stringify(response));
        const sortedExercises = Array.isArray(response.exercises)
          ? [...response.exercises].sort(
              (a: any, b: any) => timeToSeconds(a.time_end) - timeToSeconds(b.time_end),
            )
          : response.exercises;
        logger.debug("[useDetailedVideoLogic] Sorted exercises:", JSON.stringify(sortedExercises));
        // Nếu API trả rỗng → dùng fallback exercises (ví dụ demo hoặc khi video chưa có bài tập trên DB)
        if (!Array.isArray(sortedExercises) || sortedExercises.length === 0) {
          if (Array.isArray(opts?.fallbackExercises) && opts.fallbackExercises.length > 0) {
            logger.debug("[useDetailedVideoLogic] Using fallback exercises.");
            setExerciseData(opts.fallbackExercises);
            return;
          }
          setExerciseData([]);
          return;
        }
        setExerciseData(sortedExercises);
      } catch (error: any) {
        logger.error("[useDetailedVideoLogic] Exercise fetch error:", error.message);
        if (Array.isArray(opts?.fallbackExercises) && opts.fallbackExercises.length > 0) {
          logger.debug("[useDetailedVideoLogic] Using fallback exercises after fetch error.");
          setExerciseData(opts.fallbackExercises);
        } else if (error.message === "Unauthorized" || error.message === "Failed to fetch exercise") {
          router.replace("/sign-in");
        } else {
          setExerciseData([]);
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
    if (flowModeRef.current === "quiz") return;
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
      if (opts?.youtubePlayerRef?.current?.pauseVideo) {
        opts.youtubePlayerRef.current.pauseVideo();
      }
      opts?.setYoutubeIsPlaying?.(false);
    } else if (opts?.videoRef?.current) {
      opts.videoRef.current.pause();
    } else if (typeof (player as any)?.pause === "function") {
      try { (player as any).pause(); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYoutubeVideo, player, opts?.youtubePlayerRef, opts?.videoRef, opts?.setYoutubeIsPlaying]);

  const syncExerciseState = useCallback((currentTime: number) => {
    if (currentTime <= 0.1) {
      return;
    }
    if (flowModeRef.current !== "quiz" && flowModeRef.current !== "both") {
      return;
    }
    if (isAnswerTransitionRef.current) {
      logger.debug("[syncExerciseState] Skipped - isAnswerTransition");
      return;
    }
    const exercises = exerciseDataRef.current;
    if (!exercises || exercises.length === 0) {
      logger.debug("[syncExerciseState] No exercises");
      return;
    }

    const firstUnanswered = exercises.find((q) => !answeredIdsRef.current.some((ansId) => String(ansId) === String(q.id)));
    setNextQuestionId(firstUnanswered?.id ?? null);

    const currentQuestion = exercises.find((q) => {
      if (answeredIdsRef.current.some((ansId) => String(ansId) === String(q.id))) return false;
      const endTime = timeToSeconds(q.time_end);
      const startTime = timeToSeconds(q.time_start);
      return currentTime >= endTime || (currentTime >= startTime && currentTime <= endTime + 2);
    });

    if (currentQuestion) {
      logger.debug(
        `[syncExerciseState] Found Q: id=${currentQuestion.id}, t=${currentTime}s, range=[${timeToSeconds(currentQuestion.time_start)}-${timeToSeconds(currentQuestion.time_end)}]`,
      );
    }

    if (currentQuestion && !activeQuestionRef.current) {
      logger.debug(`[syncExerciseState] ACTIVATE Q${currentQuestion.id}, calling pausePlayback()`);
      activeQuestionRef.current = currentQuestion;
      setActiveQuestion(currentQuestion);
      pausePlayback();
    }
  }, [pausePlayback]);

  const handleTimeBoundaryPausing = useCallback((_currentTime: number) => {
    const activeQ = activeQuestionRef.current;
    if (activeQ) {
      // Khi đang có câu hỏi chưa trả lời: Bắt buộc dừng video không cho phát lén
      pausePlayback();
    }
  }, [pausePlayback]);

  useEffect(() => {
    const mode = opts?.flowMode || "both";
    flowModeRef.current = mode;
    if (mode === "subtitles") {
      if (activeQuestionRef.current) {
        activeQuestionRef.current = null;
        setActiveQuestion(null);
      }
    } else if (mode === "quiz") {
      if (currentSubtitleRef.current) {
        currentSubtitleRef.current = null;
        setCurrentSubtitle(null);
      }
      const curT = opts?.videoRef?.current?.currentTime;
      if (typeof curT === "number" && curT > 0.1) {
        syncExerciseState(curT);
      }
    }
  }, [opts?.flowMode, opts?.videoRef, syncExerciseState]);

  const onVideoTimeUpdate = useCallback((currentTime?: number) => {
    if (!isComponentMounted.current) return;
    let t = typeof currentTime === "number" ? currentTime : Number.NaN;
    if (!Number.isFinite(t)) {
      t = opts?.videoRef?.current?.currentTime ?? (typeof player?.currentTime === "number" ? player.currentTime : Number.NaN);
    }
    if (!Number.isFinite(t) || t < 0) return;
    const flowMode = flowModeRef.current;
    if (flowMode === "subtitles" || flowMode === "both") {
      updateCurrentSubtitle(t);
    }
    if (flowMode === "quiz" || flowMode === "both") {
      syncExerciseState(t);
      handleTimeBoundaryPausing(t);
    }
  }, [opts?.videoRef, player, updateCurrentSubtitle, syncExerciseState, handleTimeBoundaryPausing]);

  // ─── Polling video timeline (mỗi 200ms cho cả local HTML5 video và YouTube iframe) ───
  useEffect(() => {
    if (hasCompletedAll) return;

    if (intervalRef.current) clearInterval(intervalRef.current as any);

    intervalRef.current = setInterval(async () => {
      if (!isComponentMounted.current) return;
      try {
        let currentTime = Number.NaN;
        if (isYoutubeVideo) {
          const api = opts?.youtubePlayerRef?.current;
          if (api && typeof api.getCurrentTime === "function") {
            const res = api.getCurrentTime();
            currentTime = typeof res?.then === "function" ? await res : res;
          }
        } else if (opts?.videoRef?.current) {
          currentTime = opts.videoRef.current.currentTime;
        } else if (typeof player?.currentTime === "number") {
          currentTime = player.currentTime;
        }

        if (!Number.isFinite(currentTime) || currentTime < 0) return;

        const flowMode = flowModeRef.current;
        if (flowMode === "subtitles" || flowMode === "both") {
          updateCurrentSubtitle(currentTime);
        }
        if (flowMode === "quiz" || flowMode === "both") {
          syncExerciseState(currentTime);
          handleTimeBoundaryPausing(currentTime);
        }
      } catch (err) {
        logger.error("[useDetailedVideoLogic] Polling error:", err);
      }
    }, 200) as any;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
        intervalRef.current = null;
      }
    };
  }, [
    isYoutubeVideo,
    hasCompletedAll,
    opts?.youtubePlayerRef,
    opts?.videoRef,
    player,
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

  const handleVideoLoaded = useCallback(() => {
    setIsVideoLoaded(true);
  }, []);

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
        setShowResult(false);
        setActiveQuestion(null);
        activeQuestionRef.current = null;
        isAnswerTransitionRef.current = false;

        if (totalCount > 0 && nextAnsweredCount === totalCount) {
          setHasCompletedAll(true);
          setShowCompletionOverlay(true);
        } else if (isComponentMounted.current) {
          resumePlayback();
        }
      }, 1500);

      return result;
    } catch (error) {
      logger.error("[useDetailedVideoLogic] Error submitting exercise, falling back to local verification:", error);
      
      // Local fallback calculation if API fails
      const correctAns = String(
        activeQuestion.Correct_answer || 
        activeQuestion.correct_answer || 
        activeQuestion.Correct_Answer || 
        activeQuestion.correctAnswer || 
        activeQuestion.correct || 
        activeQuestion.answer || 
        ""
      ).trim().toUpperCase();

      let isCorrect = false;
      const keyUpper = key.trim().toUpperCase();
      if (correctAns) {
        const cleanAns = correctAns.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
        const cleanKey = keyUpper.replace(/[^A-Z0-9\p{L}]/gu, "").toUpperCase();
        isCorrect = cleanAns === cleanKey || cleanAns === `ANSWER${cleanKey}`;
      } else if (Array.isArray(activeQuestion.options)) {
        const selectedOpt = activeQuestion.options.find((opt: any) => String(opt.id) === key);
        if (selectedOpt) {
          isCorrect = !!(selectedOpt.isCorrect ?? selectedOpt.is_correct ?? selectedOpt.correct);
        }
      }

      const fallbackResult = {
        status: isCorrect ? "Đúng" : "Sai",
        correctAnswer: correctAns,
        isCorrect: isCorrect,
      };

      setAnswerResults((prev) => [
        ...prev,
        {
          ...fallbackResult,
          answerText,
          question: activeQuestion.question,
          sort_id: activeQuestion.sort_id,
        },
      ]);
      setShowResult(true);
      playAnswerFeedback(isCorrect);

      const nextAnsweredCount = answeredIds.length + 1;
      const totalCount = Array.isArray(exerciseData) ? exerciseData.length : 0;
      setAnsweredIds((prev) => [...prev, activeQuestion.id]);

      setTimeout(() => {
        setShowResult(false);
        setActiveQuestion(null);
        activeQuestionRef.current = null;
        isAnswerTransitionRef.current = false;

        if (totalCount > 0 && nextAnsweredCount === totalCount) {
          setHasCompletedAll(true);
          setShowCompletionOverlay(true);
        } else if (isComponentMounted.current) {
          resumePlayback();
        }
      }, 1500);

      return fallbackResult;
    }
  };

  const resumePlayback = useCallback(() => {
    try {
      if (isYoutubeVideo) {
        if (opts?.youtubePlayerRef?.current?.playVideo) {
          opts.youtubePlayerRef.current.playVideo();
        }
        opts?.setYoutubeIsPlaying?.(true);
      } else if (opts?.videoRef?.current) {
        opts.videoRef.current.play().catch((e) => logger.debug("Play interrupted", e));
      } else if (player && typeof (player as any).play === "function") {
        (player as any).play();
      }
    } catch (error) {
      logger.error("[useDetailedVideoLogic] Error in resumePlayback:", error);
    }
  }, [isYoutubeVideo, player, opts?.youtubePlayerRef, opts?.videoRef, opts?.setYoutubeIsPlaying]);

  const handleContinueWatching = useCallback(() => {
    setShowCompletionOverlay(false);
    
    // Clear active question so we don't get stuck in a pause loop
    const activeQ = activeQuestionRef.current;
    if (activeQ) {
      if (!answeredIdsRef.current.includes(activeQ.id)) {
        setAnsweredIds((prev) => [...prev, activeQ.id]);
      }
      setActiveQuestion(null);
      activeQuestionRef.current = null;
    }
    isAnswerTransitionRef.current = false;
    resumePlayback();
  }, [resumePlayback]);

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
    currentSubtitle,
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
    ytSavedTime: 0,
    handleVideoLoaded,
    onVideoTimeUpdate,
  };
};
