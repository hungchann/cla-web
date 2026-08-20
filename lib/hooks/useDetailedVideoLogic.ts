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
  time_start?: string;
  time_end?: string;
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
    enableAutoSpeakSubtitle?: boolean;
    youtubePlayerRef?: RefObject<any>;
    setYoutubeIsPlaying?: (playing: boolean) => void;
    fallbackExercises?: ExerciseItem[];
    flowMode?: "subtitles" | "quiz" | "both";
  },
) => {
  const router = useRouter();

  // ─── States ───
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

  const isYoutubeVideo = videoDataUsesYoutubePlayer(videoData);

  // ─── Stable Refs (không bao giờ stale, không cần trong deps) ───
  const isMounted = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs mirror state — để polling không phải dùng stale closure
  const exerciseDataRef = useRef<ExerciseItem[] | null>(null);
  const answeredIdsRef = useRef<number[]>([]);
  const activeQuestionRef = useRef<ExerciseItem | null>(null);
  const subtitlesRef = useRef<SubtitleItem[]>([]);
  const currentSubtitleRef = useRef<SubtitleItem | null>(null);
  const lastSpokenSubtitleIdRef = useRef<string | number | null>(null);
  const isAnswerTransitionRef = useRef(false);
  const hasCompletedAllRef = useRef(false);

  // Opts refs — avoid stale closures for opts that change on parent re-render
  const videoRefRef = useRef(opts?.videoRef);
  const youtubePlayerRefRef = useRef(opts?.youtubePlayerRef);
  const setYoutubeIsPlayingRef = useRef(opts?.setYoutubeIsPlaying);
  const isYoutubeVideoRef = useRef(isYoutubeVideo);
  const flowModeRef = useRef<"subtitles" | "quiz" | "both">(opts?.flowMode || "both");
  const enableAutoSpeakRef = useRef(opts?.enableAutoSpeakSubtitle);

  // ─── Keep opts refs in sync ───
  useEffect(() => { videoRefRef.current = opts?.videoRef; }, [opts?.videoRef]);
  useEffect(() => { youtubePlayerRefRef.current = opts?.youtubePlayerRef; }, [opts?.youtubePlayerRef]);
  useEffect(() => { setYoutubeIsPlayingRef.current = opts?.setYoutubeIsPlaying; }, [opts?.setYoutubeIsPlaying]);
  useEffect(() => { isYoutubeVideoRef.current = isYoutubeVideo; }, [isYoutubeVideo]);
  useEffect(() => { flowModeRef.current = opts?.flowMode || "both"; }, [opts?.flowMode]);
  useEffect(() => { enableAutoSpeakRef.current = opts?.enableAutoSpeakSubtitle; }, [opts?.enableAutoSpeakSubtitle]);

  // ─── Keep state refs in sync ───
  useEffect(() => { exerciseDataRef.current = exerciseData; }, [exerciseData]);
  useEffect(() => { answeredIdsRef.current = answeredIds; }, [answeredIds]);
  useEffect(() => { activeQuestionRef.current = activeQuestion; }, [activeQuestion]);
  useEffect(() => { subtitlesRef.current = subtitles; }, [subtitles]);
  useEffect(() => { hasCompletedAllRef.current = hasCompletedAll; }, [hasCompletedAll]);

  // ─── Derived ───
  const status = isVideoLoaded ? "readyToPlay" : "loading";

  const videoSource = useMemo(() => {
    if (!videoData?.video_file?.filename_disk) return "";
    return `https://marutek.space/assets/${videoData.video_file.filename_disk}`;
  }, [videoData?.video_file?.filename_disk]);

  // ─── Stable playback helpers (no deps, always read from refs) ───
  const pausePlayback = useCallback(() => {
    console.log("[DEBUG pausePlayback] Called, isYoutubeVideo:", isYoutubeVideoRef.current);
    if (isYoutubeVideoRef.current) {
      youtubePlayerRefRef.current?.current?.pauseVideo?.();
      setYoutubeIsPlayingRef.current?.(false);
    } else {
      videoRefRef.current?.current?.pause();
    }
  }, []);

  const resumePlayback = useCallback(() => {
    console.log("[DEBUG resumePlayback] Called, isYoutubeVideo:", isYoutubeVideoRef.current);
    try {
      if (isYoutubeVideoRef.current) {
        youtubePlayerRefRef.current?.current?.playVideo?.();
        setYoutubeIsPlayingRef.current?.(true);
      } else {
        videoRefRef.current?.current?.play().catch((e: unknown) => {
          logger.debug("[resumePlayback] play() interrupted:", e);
        });
      }
    } catch (err) {
      logger.error("[resumePlayback] Error:", err);
    }
  }, []);

  // ─── Core polling tick (all stable refs, never stale) ───
  const pollTick = useCallback(async (timeOverride?: number) => {
    if (!isMounted.current) return;
    if (hasCompletedAllRef.current) return;

    // 1. Get current time — use override if provided (from onVideoTimeUpdate),
    //    otherwise fetch from player
    let t: number = Number.NaN;
    if (typeof timeOverride === "number" && Number.isFinite(timeOverride)) {
      t = timeOverride;
    } else if (isYoutubeVideoRef.current) {
      const api = youtubePlayerRefRef.current?.current;
      if (api?.getCurrentTime) {
        const res = api.getCurrentTime();
        t = typeof res?.then === "function" ? await res : res;
      }
    } else {
      t = videoRefRef.current?.current?.currentTime ?? Number.NaN;
    }
    if (!Number.isFinite(t) || t < 0) return;

    // DEBUG: Log current time
    console.log(`[DEBUG pollTick] t=${t}s, exercises=${exerciseDataRef.current?.length ?? 0}, activeQ=${activeQuestionRef.current?.id ?? "none"}`);

    // 2. Subtitle sync
    const flowMode = flowModeRef.current;
    if (flowMode !== "quiz") {
      const subs = subtitlesRef.current;
      if (subs.length > 0) {
        const next = subs.find((st) => {
          const s = timeToSeconds(st.start);
          const e = timeToSeconds(st.end);
          return t >= s && t <= e;
        });
        if (next) {
          if (currentSubtitleRef.current?.id !== next.id) {
            currentSubtitleRef.current = next;
            setCurrentSubtitle(next);
            // Auto-speak
            if (
              enableAutoSpeakRef.current !== false &&
              next.chinese &&
              lastSpokenSubtitleIdRef.current !== next.id &&
              !activeQuestionRef.current
            ) {
              lastSpokenSubtitleIdRef.current = next.id;
              speakChinese(String(next.chinese));
            }
          }
        } else if (currentSubtitleRef.current) {
          currentSubtitleRef.current = null;
          setCurrentSubtitle(null);
        }
      }
    }

    // 3. Quiz activation (ALWAYS runs regardless of flowMode)
    if (t <= 0.1) return;
    if (isAnswerTransitionRef.current) return;

    const exercises = exerciseDataRef.current;
    if (!exercises || exercises.length === 0) return;

    const answered = answeredIdsRef.current;

    // Find first unanswered question whose time_start has been reached
    const firstUnanswered = exercises.find(
      (q) => !answered.some((id) => String(id) === String(q.id))
    );
    setNextQuestionId(firstUnanswered?.id ?? null);

    // If there's already an active question, just keep pausing
    if (activeQuestionRef.current) {
      pausePlayback();
      return;
    }

    // Find a new question to activate: startSec <= currentTime <= maxWindow
    const toActivate = exercises.find((q) => {
      if (answered.some((id) => String(id) === String(q.id))) return false;
      const startSec = timeToSeconds(q.time_start);
      const endSec = timeToSeconds(q.time_end);
      const maxWindow = endSec > startSec ? endSec + 6 : startSec + 8;
      return t >= startSec && t <= maxWindow;
    });

    if (toActivate) {
      console.log(`[useDetailedVideoLogic] ACTIVATING Q${toActivate.id} at t=${t}s`);
      activeQuestionRef.current = toActivate;
      setActiveQuestion(toActivate);
      pausePlayback();
    }
  }, [pausePlayback]);

  // ─── Single persistent polling interval ───
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      pollTick().catch((err) => logger.error("[useDetailedVideoLogic] pollTick error:", err));
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Only restart when pollTick itself changes (which is "never" since it only reads refs)
  }, [pollTick]);

  // ─── onVideoTimeUpdate (called from <video onTimeUpdate> or YouTube polling) ───
  const onVideoTimeUpdate = useCallback((currentTime?: number) => {
    if (!isMounted.current) return;
    let t = typeof currentTime === "number" ? currentTime : Number.NaN;
    if (!Number.isFinite(t)) {
      t = videoRefRef.current?.current?.currentTime ?? Number.NaN;
    }
    if (!Number.isFinite(t) || t < 0) return;
    // Pass time directly to pollTick so it doesn't need to re-fetch
    pollTick(t).catch(() => {});
  }, [pollTick]);

  // ─── Video loaded detection ───
  useEffect(() => {
    const video = videoRefRef.current?.current;
    if (!video) return;
    const handleLoaded = () => setIsVideoLoaded(true);
    if (video.readyState >= 1) {
      setIsVideoLoaded(true);
    } else {
      video.addEventListener("loadedmetadata", handleLoaded);
    }
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  // re-run if videoRef changes identity (unlikely but safe)
  }, [opts?.videoRef]);

  const handleVideoLoaded = useCallback(() => setIsVideoLoaded(true), []);

  // ─── Auto-play when ready ───
  useEffect(() => {
    if (isYoutubeVideo) return;
    if (status === "readyToPlay") {
      videoRefRef.current?.current?.play().catch((err: unknown) => {
        if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError")) {
          logger.debug("Video autoplay blocked by browser.");
          return;
        }
        logger.error("Error auto-playing video:", err);
      });
    }
  }, [status, isYoutubeVideo]);

  // ─── Subtitle loading ───
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!videoData?.srt_file?.filename_disk) {
        setSubtitles([]);
        currentSubtitleRef.current = null;
        setCurrentSubtitle(null);
        return;
      }
      try {
        const res = await fetch(`https://marutek.space/assets/${videoData.srt_file.filename_disk}`);
        const srtContent = await res.text();
        const parsed = parseSRTtoArray(srtContent);
        const sorted = Array.isArray(parsed)
          ? [...parsed].sort((a: any, b: any) => timeToSeconds(a.start) - timeToSeconds(b.start))
          : [];
        if (!cancelled) {
          setSubtitles(sorted as SubtitleItem[]);
          currentSubtitleRef.current = null;
          setCurrentSubtitle(null);
        }
      } catch (err) {
        logger.error("[useDetailedVideoLogic] Error loading subtitles:", err);
        if (!cancelled) setSubtitles([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [videoData?.srt_file?.filename_disk]);

  // ─── Exercise loading ───
  useEffect(() => {
    if (!videoData?.id) return;
    let cancelled = false;

    const load = async () => {
      try {
        logger.debug("[useDetailedVideoLogic] Fetching exercises for id:", videoData.id);
        const response = await bilingualApi.getExerciseById(videoData.id);
        logger.debug("[useDetailedVideoLogic] Exercise API response:", JSON.stringify(response));

        const raw = Array.isArray(response.exercises) ? response.exercises : [];
        const sorted = [...raw].sort(
          (a: any, b: any) => timeToSeconds(a.time_start) - timeToSeconds(b.time_start),
        );

        if (cancelled) return;

        if (sorted.length === 0) {
          if (Array.isArray(opts?.fallbackExercises) && opts!.fallbackExercises.length > 0) {
            logger.debug("[useDetailedVideoLogic] Using fallback exercises.");
            setExerciseData(opts!.fallbackExercises);
          } else {
            setExerciseData([]);
          }
          return;
        }
        setExerciseData(sorted);
      } catch (err: any) {
        logger.error("[useDetailedVideoLogic] Exercise fetch error:", err.message);
        if (cancelled) return;
        if (Array.isArray(opts?.fallbackExercises) && opts!.fallbackExercises.length > 0) {
          setExerciseData(opts!.fallbackExercises);
        } else if (err.message === "Unauthorized" || err.message === "Failed to fetch exercise") {
          router.replace("/sign-in");
        } else {
          setExerciseData([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoData?.id]);

  // ─── Answer submission ───
  const handleOptionPress = async (key: string) => {
    if (!activeQuestionRef.current) return;
    const question = activeQuestionRef.current;

    // Build answerText from whatever structure the exercise has
    const answerText =
      question[`answer_${key}`] ||
      question[`Answer_${key}`] ||
      (() => {
        let raw = question.options;
        if (typeof raw === "string") {
          try { raw = JSON.parse(raw); } catch { raw = []; }
        }
        if (Array.isArray(raw)) {
          const opt = raw.find((o: any) => String(o.id || o.key || "") === key);
          return opt ? (opt.val || opt.hanzi || opt.text || opt.value || key) : key;
        }
        return key;
      })();

    try {
      isAnswerTransitionRef.current = true;
      const answers = [{ questionId: question.id, answer: key, answerText, selectAnswer: key }];
      const response = await bilingualApi.submitExercise(answers);
      const result = Array.isArray(response) ? response[0] : response;

      setAnswerResults((prev) => [
        ...prev,
        { ...result, answerText, question: question.question, sort_id: question.sort_id },
      ]);
      setShowResult(true);
      playAnswerFeedback(result.status === "Đúng");

      const nextCount = answeredIdsRef.current.length + 1;
      const total = exerciseDataRef.current?.length ?? 0;
      setAnsweredIds((prev) => [...prev, question.id]);

      setTimeout(() => {
        setShowResult(false);
        setActiveQuestion(null);
        activeQuestionRef.current = null;
        isAnswerTransitionRef.current = false;

        if (total > 0 && nextCount >= total) {
          setHasCompletedAll(true);
          setShowCompletionOverlay(true);
        } else if (isMounted.current) {
          resumePlayback();
        }
      }, 1500);

      return result;
    } catch (err: any) {
      logger.error("[useDetailedVideoLogic] Submit error, using local fallback:", err.message);

      // Local fallback
      const correctAns = String(
        question.Correct_answer || question.correct_answer || question.correctAnswer || ""
      ).trim().toUpperCase();
      let isCorrect = false;
      const kUp = key.trim().toUpperCase();
      if (correctAns) {
        isCorrect = correctAns === kUp || correctAns === `ANSWER${kUp}` || correctAns === `ANSWER_${kUp}`;
      } else {
        // API không trả Correct_answer — thử tìm trong options
        let raw = question.options;
        if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { raw = []; } }
        if (Array.isArray(raw)) {
          const opt = raw.find((o: any) => String(o.id || o.key || "") === key);
          if (opt) isCorrect = !!(opt.isCorrect ?? opt.is_correct ?? opt.correct);
        }
        logger.warn("[useDetailedVideoLogic] No Correct_answer in exercise data, using local guess for Q", question.id);
      }

      const fallbackStatus = !correctAns && !isCorrect ? "Chưa xác nhận" : (isCorrect ? "Đúng" : "Sai");
      const fallbackResult = { status: fallbackStatus, correctAnswer: correctAns, isCorrect, questionId: question.id };
      setAnswerResults((prev) => [
        ...prev,
        { ...fallbackResult, answerText, question: question.question, sort_id: question.sort_id },
      ]);
      setShowResult(true);
      playAnswerFeedback(isCorrect);

      const nextCount = answeredIdsRef.current.length + 1;
      const total = exerciseDataRef.current?.length ?? 0;
      setAnsweredIds((prev) => [...prev, question.id]);

      setTimeout(() => {
        setShowResult(false);
        setActiveQuestion(null);
        activeQuestionRef.current = null;
        isAnswerTransitionRef.current = false;

        if (total > 0 && nextCount >= total) {
          setHasCompletedAll(true);
          setShowCompletionOverlay(true);
        } else if (isMounted.current) {
          resumePlayback();
        }
      }, 1500);

      return fallbackResult;
    }
  };

  const handleContinueWatching = useCallback(() => {
    setShowCompletionOverlay(false);
    const activeQ = activeQuestionRef.current;
    if (activeQ) {
      if (!answeredIdsRef.current.some((id) => String(id) === String(activeQ.id))) {
        setAnsweredIds((prev) => [...prev, activeQ.id]);
        answeredIdsRef.current = [...answeredIdsRef.current, activeQ.id];
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
    } catch (err) {
      logger.error("[useDetailedVideoLogic] Error in handleViewResults:", err);
    }
  }, [answerResults, videoData, router]);

  const selectQuestion = useCallback((question: ExerciseItem) => {
    if (!question) return;
    pausePlayback();
    const startSec = timeToSeconds(question.time_start);
    if (isYoutubeVideoRef.current) {
      youtubePlayerRefRef.current?.current?.seekTo?.(startSec);
    } else if (videoRefRef.current?.current) {
      videoRefRef.current.current.currentTime = startSec;
    }
    activeQuestionRef.current = question;
    setActiveQuestion(question);
  }, [pausePlayback]);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
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
    isComponentMounted: isMounted,
    handleOptionPress,
    handleContinueWatching,
    handleViewResults,
    resumePlayback,
    ytSavedTime: 0,
    handleVideoLoaded,
    onVideoTimeUpdate,
    selectQuestion,
    // legacy player shape (for callers that still use it)
    player: {
      play: resumePlayback,
      pause: pausePlayback,
      get currentTime() {
        return videoRefRef.current?.current?.currentTime ?? 0;
      },
    },
  };
};
