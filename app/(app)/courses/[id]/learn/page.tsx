"use client";

import Image from "next/image";
import { use, useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import HighlightedText from "@/components/HighlightedText";
import { coursesApi } from "@/api/courses";
import { vocabularyApi } from "@/api/vocabulary";
import { notebookApi } from "@/api/notebook";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { CourseLesson, CourseLessonType } from "@/lib/types/course";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import { speakChinese } from "@/lib/utils/speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ASSET_URL } from "@/lib/constants";
import { Play, Check, Star, Folder, Volume2, Target, XCircle, User, Mic, PartyPopper, Lightbulb } from "lucide-react";

const STEP_TYPE_TO_LEARN: Record<string, CourseLessonType> = {
  "learn-video-vocab": "video_vocab",
  "learn-vocab-theory": "vocab_theory",
  "learn-quiz-vocab": "quiz_vocab",
  "learn-video-grammar": "video_grammar",
  "learn-quiz-grammar": "quiz_grammar",
  "learn-dictation": "dictation",
  "learn-conversation": "conversation",
  "learn-extra": "extra",
};

const LEARN_TO_STEP_TYPE: Record<string, string> = {
  "video_vocab": "learn-video-vocab",
  "vocab_theory": "learn-vocab-theory",
  "quiz_vocab": "learn-quiz-vocab",
  "video_grammar": "learn-video-grammar",
  "quiz_grammar": "learn-quiz-grammar",
  "dictation": "learn-dictation",
  "conversation": "learn-conversation",
  "extra": "learn-extra",
};

type VocabExample = {
    chinese: string;
    pinyin: string;
    vietnamese: string;
};

type VocabSense = {
    id: string | number;
    pos_label?: string;
    meaning: string;
    examples: VocabExample[];
};

type VocabItem = {
    id: string | number;
    word: string;
    pinyin: string;
    meaning: string;
    word_type?: string;
    note?: string;
    senses?: VocabSense[];
};

function VocabTheoryCards({ items, loading }: { items: VocabItem[]; loading: boolean }) {
    const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

    if (loading) {
        return (
            <div className="max-w-4xl w-full mx-auto rounded-2xl border border-amber-100 bg-white p-12 shadow-2xs dark:bg-zinc-900">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="max-w-4xl w-full mx-auto rounded-2xl border border-amber-100 bg-white p-12 text-center shadow-2xs dark:bg-zinc-900">
                <p className="text-sm font-bold text-zinc-500">Chưa có từ vựng cho bài học này</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl w-full mx-auto space-y-5">
            <div className="px-1">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Giải nghĩa từ vựng</h3>
                <p className="text-xs font-semibold text-zinc-500">Danh sách {items.length} từ trong bài học</p>
            </div>
            {items.map((item, itemIndex) => {
                const key = String(item.id ?? itemIndex);
                const senses = item.senses?.length ? item.senses : [{ id: "fallback", meaning: "Chưa có nghĩa", examples: [] }];
                const noteOpen = !!openNotes[key];
                return (
                    <article key={key} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{itemIndex + 1}</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-black tracking-wide text-zinc-900 dark:text-white">{item.word}</h4>
                                        <button type="button" onClick={() => speakChinese(item.word || "")} className="text-amber-600 hover:text-amber-700" aria-label={`Nghe ${item.word}`}>
                                            <Volume2 className="size-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-amber-600">{item.pinyin || "Chưa có pinyin"}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1.5">
                                {Array.from(new Set(senses.map((sense) => sense.pos_label).filter((pos): pos is string => Boolean(pos)))).map((pos) => (
                                    <span key={pos} className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{pos}</span>
                                ))}
                                {item.note && (
                                    <button type="button" onClick={() => setOpenNotes((prev) => ({ ...prev, [key]: !prev[key] }))} className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-bold text-zinc-600 hover:border-amber-300 hover:text-amber-600 dark:border-zinc-700 dark:text-zinc-300">
                                        {noteOpen ? "Ẩn cách viết hanzi" : "Hiện cách viết hanzi"}
                                    </button>
                                )}
                            </div>
                        </div>
                        {noteOpen && item.note && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm font-semibold leading-relaxed text-zinc-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-zinc-300">{item.note}</div>}
                        <div className="mt-4 space-y-3">
                            {senses.map((sense, senseIndex) => (
                                <div key={String(sense.id ?? senseIndex)} className="space-y-2">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100"><span className="mr-2 text-amber-600">{senseIndex + 1}.</span>{sense.meaning}</p>
                                    {sense.examples?.length ? sense.examples.map((example, exampleIndex) => (
                                        <div key={exampleIndex} className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/40">
                                            <div className="flex items-start justify-between gap-3"><span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{example.chinese}</span><button type="button" onClick={() => speakChinese(example.chinese)} className="shrink-0 text-xs font-bold text-amber-600 hover:text-amber-700">🔊 Nghe</button></div>
                                            {example.pinyin && <p className="mt-0.5 text-xs font-semibold text-amber-600">{example.pinyin}</p>}
                                            {example.vietnamese && <p className="mt-0.5 text-xs font-medium text-zinc-500">&rarr; {example.vietnamese}</p>}
                                        </div>
                                    )) : <p className="text-xs italic text-zinc-400">Chưa có ví dụ cho nghĩa này</p>}
                                </div>
                            ))}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function LearnRoomContent({ params }: Readonly<{ params: { id: string } }>) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = params.id;
    const lessonParam = searchParams.get("lesson");
    const stepParam = searchParams.get("step");
    const fallbackType: CourseLessonType = stepParam
        ? STEP_TYPE_TO_LEARN[stepParam] || "video_vocab"
        : "video_vocab";

    const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchLesson = async () => {
            const filterValidLessons = (lessons: CourseLesson[]) =>
                lessons.filter(
                    (l) =>
                        l.lesson_type !== "bilingual" &&
                        !l.title?.toLowerCase().includes("bài đọc song ngữ") &&
                        !l.title?.toLowerCase().includes("song ngữ")
                );

            try {
                if (lessonParam) {
                    const lesson = await coursesApi.getCourseLessonById(lessonParam);
                    if (isMounted) setCurrentLesson(lesson);
                } else if (stepParam) {
                    const chapters = await coursesApi.getCourseChapters(courseId);
                    if (!isMounted) return;
                    const flat = filterValidLessons(chapters.flatMap((c) => c.lessons || []));
                    const match = flat.find((l) => l.lesson_type === fallbackType);
                    if (isMounted) setCurrentLesson(match || flat[0] || null);
                    return;
                } else {
                    const chapters = await coursesApi.getCourseChapters(courseId);
                    if (!isMounted) return;
                    const flat = filterValidLessons(chapters.flatMap((c) => c.lessons || []));
                    if (isMounted) setCurrentLesson(flat[0] || null);
                    return;
                }

            } catch {
                if (isMounted) setCurrentLesson(null);
            }
        };
        fetchLesson();
        return () => { isMounted = false; };
    }, [courseId, lessonParam, stepParam, fallbackType]);

    const currentStep = currentLesson?.lesson_type
        ? LEARN_TO_STEP_TYPE[currentLesson.lesson_type] || `learn-${currentLesson.lesson_type}`
        : `learn-${fallbackType}`;

    // Dynamic Quiz Exercises state
    const [quizExercises, setQuizExercises] = useState<any[]>([]);
    const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

    // Dynamic Conversation Shadowing hook
    const conversationId =
        currentLesson?.lesson_type === "conversation" && currentLesson.scenario_id
            ? String(currentLesson.scenario_id)
            : courseId || "1";
    const conversationHook = useConversationDetail(conversationId);
    const {
        loading: convLoading,
        visibleMessages: convVisibleMessages,
        hasMoreMessages: convHasMoreMessages,
        activeRecordingId,
        handleContinue: handleConvContinue,
        handleSpeak: handleConvSpeak,
        handleToggleRecording: handleConvToggleRecording,
    } = conversationHook;

    const convEndRef = useRef<HTMLDivElement | null>(null);

    // Auto scroll conversation to bottom
    useEffect(() => {
        if (convEndRef.current) {
            convEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [convVisibleMessages.length]);

    // Load real exercises when quiz step activates
    useEffect(() => {
        const isQuiz = currentStep === "learn-quiz-vocab" || currentStep === "learn-quiz-grammar";
        const targetExerciseId = currentLesson?.exercise_id;
        if (!isQuiz || !targetExerciseId) return;

        let isMounted = true;
        const fetchExercises = async () => {
            setIsLoadingQuiz(true);
            try {
                const { default: api } = await import("@/api/authConfig");
                const r = await api.get(`/items/exercises?filter[link_exercise_id][_eq]=${targetExerciseId}&sort=sort&fields=id,sort,question,answer_A,answer_B,answer_C,answer_D,Correct_answer,Explanation`);
                if (isMounted) {
                    setQuizExercises(r.data?.data || []);
                    setCurrentQuizIdx(0);
                }
            } catch {
                if (isMounted) setQuizExercises([]);
            } finally {
                if (isMounted) setIsLoadingQuiz(false);
            }
        };
        fetchExercises();
        return () => { isMounted = false; };
    }, [currentStep, currentLesson?.exercise_id]);

    const currentQuiz = quizExercises[currentQuizIdx];

    const getVocabSelectedLabel = (selected: string | null) => {
        if (!selected || !currentQuiz) return "";
        const key = `answer_${selected}` as keyof typeof currentQuiz;
        return currentQuiz[key] || "";
    };

    let courseTitle = "Khóa giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)";
    if (courseId === "office-chinese") {
        courseTitle = "Khóa giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)";
    } else if (courseId === "marketing-traditional") {
        courseTitle = "Tiếng Trung Marketing (Phồn thể)";
    }

    // --- Vocab data (Video Vocab step) ---
    const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
    const [vocabLoading, setVocabLoading] = useState(false);
    const [selectedVocabIdx, setSelectedVocabIdx] = useState(0);
    const currentVocab = vocabItems[selectedVocabIdx] || null;

    // Load vocab details if lesson has video_section_id
    useEffect(() => {
        if (currentStep !== "learn-video-vocab") return;
        let isMounted = true;
        setVocabLoading(true);
        (async () => {
            try {
                const videoId = currentLesson?.video_section_id;
                if (!videoId) {
                    if (isMounted) setVocabItems([]);
                    return;
                }
                const { default: api } = await import("@/api/authConfig");
                const res = await api.get(`/items/video_section/${videoId}?fields=id,title,vocabularies.vocabularies_id.*`);
                const rawVocabs = res.data?.data?.vocabularies || [];
                const formatted: VocabItem[] = rawVocabs
                    .map((v: any) => v.vocabularies_id)
                    .filter(Boolean)
                    .map((v: any) => ({
                        id: v.id,
                        word: v.word || "",
                        pinyin: v.pinyin || "",
                        meaning: v.meaning || "",
                        word_type: v.word_type || "",
                        senses: v.senses || [],
                    }));
                if (isMounted) {
                    setVocabItems(formatted);
                    setSelectedVocabIdx(0);
                }
            } catch {
                if (isMounted) setVocabItems([]);
            } finally {
                if (isMounted) setVocabLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [currentStep, currentLesson?.video_section_id]);

    // --- Vocab Theory state (Lý thuyết: Giải nghĩa từ vựng) ---
    const [vocabTheoryItems, setVocabTheoryItems] = useState<any[]>([]);
    const [vocabTheoryLoading, setVocabTheoryLoading] = useState(false);
    const [vocabTheoryIdx, setVocabTheoryIdx] = useState(0);
    const [showHanziWrite, setShowHanziWrite] = useState(false);

    const currentTheoryVocab = vocabTheoryItems[vocabTheoryIdx] || null;

    useEffect(() => {
        if (currentStep !== "learn-vocab-theory") return;
        let isMounted = true;
        setVocabTheoryLoading(true);
        setVocabTheoryItems([]);
        setVocabTheoryIdx(0);
        (async () => {
            try {
                const lessonId = currentLesson?.id;
                if (!lessonId) {
                    if (isMounted) setVocabTheoryItems([]);
                    return;
                }
                const { default: api } = await import("@/api/authConfig");
                const detailRes = await api.get(`/items/course_lessons/${lessonId}?fields=id,vocab_display_map_id`);
                const displayMapId = detailRes.data?.data?.vocab_display_map_id;
                if (!displayMapId) {
                    if (isMounted) setVocabTheoryItems([]);
                    return;
                }
                const items = await vocabularyApi.getVocabByDisplayMap(displayMapId);
                if (isMounted) {
                    setVocabTheoryItems(items);
                    setVocabTheoryIdx(0);
                }
            } catch {
                if (isMounted) setVocabTheoryItems([]);
            } finally {
                if (isMounted) setVocabTheoryLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [currentStep, currentLesson?.id]);

    // --- Flashcard Save States ---
    const [isSavedToFlashcard, setIsSavedToFlashcard] = useState(false);
    const [showDecksList, setShowDecksList] = useState(false);
    const [decks, setDecks] = useState<any[]>([]);
    const [loadingDecks, setLoadingDecks] = useState(false);
    const [savingVocab, setSavingVocab] = useState(false);
    const [newDeckTitle, setNewDeckTitle] = useState("");
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSaveVocabClick = async () => {
        const user = tokenUtils.getUserData();
        if (!user) {
            setSaveMessage({ type: "error", text: "Vui lòng đăng nhập để lưu flashcard." });
            return;
        }
        setLoadingDecks(true);
        setShowDecksList(true);
        setSaveMessage(null);
        try {
            const personalDecks = await notebookApi.getPersonalNotebooks();
            setDecks(personalDecks || []);
        } catch {
            setSaveMessage({ type: "error", text: "Không thể tải bộ flashcard." });
        } finally {
            setLoadingDecks(false);
        }
    };

    const handleSelectDeckForVocab = async (deckId: string, deckTitle: string) => {
        setSavingVocab(true);
        try {
            await notebookApi.createVocabItemInPersonalDeck(
                deckId,
                currentVocab?.word || "",
                currentVocab?.pinyin || "",
                currentVocab?.meaning || ""
            );
            setSaveMessage({ type: "success", text: `Đã lưu vào bộ "${deckTitle}"!` });
            setIsSavedToFlashcard(true);
            setTimeout(() => {
                setShowDecksList(false);
                setSaveMessage(null);
            }, 1500);
        } catch {
            setSaveMessage({ type: "error", text: "Lưu thất bại." });
        } finally {
            setSavingVocab(false);
        }
    };

    const handleCreateAndSaveVocab = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckTitle.trim()) return;
        setSavingVocab(true);
        try {
            const newDeck = await notebookApi.createNoteBooks(newDeckTitle.trim());
            const deckId = newDeck?.id;
            if (!deckId) {
                throw new Error("Không lấy được ID bộ từ mới.");
            }
            await notebookApi.createVocabItemInPersonalDeck(
                deckId,
                currentVocab?.word || "",
                currentVocab?.pinyin || "",
                currentVocab?.meaning || ""
            );
            setSaveMessage({ type: "success", text: `Đã tạo bộ "${newDeckTitle}" và lưu từ!` });
            setIsSavedToFlashcard(true);
            setNewDeckTitle("");
            setTimeout(() => {
                setShowDecksList(false);
                setSaveMessage(null);
            }, 1500);
        } catch {
            setSaveMessage({ type: "error", text: "Thất bại." });
        } finally {
            setSavingVocab(false);
        }
    };

    // --- Voice Recording States ---
    const [recordState, setRecordState] = useState<"idle" | "recording" | "done">("idle");
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [playBackState, setPlayBackState] = useState(false);
    const [pronounceProcessing, setPronounceProcessing] = useState(false);
    const [pronounceError, setPronounceError] = useState<string | null>(null);
    const [pronounceResult, setPronounceResult] = useState<{ text: string; accuracy: number } | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (recordState === "recording") {
            setRecordSeconds(0);
            timer = setInterval(() => {
                setRecordSeconds((prev) => {
                    if (prev >= 3) {
                        setRecordState("done");
                        clearInterval(timer);
                        return 3;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [recordState]);

    const startPronunciation = async () => {
        setPronounceResult(null);
        setPronounceError(null);
        setPlayBackState(false);
        try {
            const { audioRecordingService } = await import("@/services/audioRecordingService");
            await audioRecordingService.startRecording();
            setRecordState("recording");
        } catch (err) {
            setPronounceError(err instanceof Error ? err.message : "Không thể bắt đầu ghi âm.");
        }
    };

    const resetPronunciation = async () => {
        setPronounceResult(null);
        setPronounceError(null);
        setPlayBackState(false);
        try {
            const { audioRecordingService } = await import("@/services/audioRecordingService");
            await audioRecordingService.resetRecorder();
        } catch {
            // bỏ qua lỗi reset
        }
        setRecordState("idle");
    };

    useEffect(() => {
        if (recordState !== "done") return;
        let cancelled = false;
        setPronounceProcessing(true);
        (async () => {
            try {
                const { audioRecordingService } = await import("@/services/audioRecordingService");
                const result = await audioRecordingService.stopRecordingAndTranscribe();
                if (cancelled) return;
                if (result.errorType || !result.text || !result.text.trim()) {
                    setPronounceError(
                        result.errorType === "empty"
                            ? "Không nhận dạng được giọng nói, hãy thử nói rõ hơn."
                            : "Không thể phân tích giọng nói, hãy thử lại.",
                    );
                    return;
                }
                const { compareTextsAdvanced } = await import("@/services/textComparisonService");
                const comparison = compareTextsAdvanced(currentVocab?.word || "", result.text);
                if (cancelled) return;
                setPronounceResult({ text: result.text, accuracy: Math.round(comparison.accuracy) });
            } catch {
                if (cancelled) return;
                setPronounceError("Không thể ghi âm/phân tích, hãy thử lại.");
            } finally {
                if (!cancelled) setPronounceProcessing(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [recordState, currentVocab?.word]);

    useEffect(() => {
        return () => {
            import("@/services/audioRecordingService")
                .then(({ audioRecordingService }) => audioRecordingService.cleanup().catch(() => {}))
                .catch(() => {});
        };
    }, []);

    // --- Vocab Quiz state ---
    const [vocabSelected, setVocabSelected] = useState<string | null>(null);
    const handleVocabSelect = (option: string) => {
        if (vocabSelected) return;
        setVocabSelected(option);
    };
    const resetVocabQuiz = () => {
        setVocabSelected(null);
    };

    // --- Grammar Video & Subtitle States ---
    const [grammarCurrentTime, setGrammarCurrentTime] = useState(0);
    const [grammarSubtitles, setGrammarSubtitles] = useState<any[]>([]);
    const [grammarVideoSource, setGrammarVideoSource] = useState<string | null>(null);
    const [grammarVideoLoading, setGrammarVideoLoading] = useState(false);
    const grammarVideoRef = useRef<HTMLVideoElement | null>(null);

    // --- Video Vocab States ---
    const [videoVocabSource, setVideoVocabSource] = useState<string | null>(null);
    const [videoVocabLoading, setVideoVocabLoading] = useState(false);
    const vocabVideoRef = useRef<HTMLVideoElement | null>(null);

    const handleGrammarTimeUpdate = () => {
        if (grammarVideoRef.current) {
            setGrammarCurrentTime(grammarVideoRef.current.currentTime);
        }
    };

    // Load video vocab file
    useEffect(() => {
        const videoId = currentLesson?.video_section_id;
        if (!videoId) {
            setVideoVocabSource(null);
            return;
        }
        let isMounted = true;
        setVideoVocabLoading(true);
        (async () => {
            try {
                const { default: api } = await import("@/api/authConfig");
                const res = await api.get(`/items/video_section/${videoId}?fields=id,video_file,subtitles`);
                if (!isMounted) return;
                const fileId = res.data?.data?.video_file;
                if (fileId) {
                    setVideoVocabSource(`${ASSET_URL}/${fileId}`);
                } else {
                    setVideoVocabSource(null);
                }
            } catch {
                if (isMounted) setVideoVocabSource(null);
            } finally {
                if (isMounted) setVideoVocabLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [currentLesson?.video_section_id]);

    // Load video grammar file and subtitles
    useEffect(() => {
        const videoId = currentLesson?.video_section_id;
        if (currentLesson?.lesson_type !== "video_grammar" || !videoId) {
            setGrammarVideoSource(null);
            setGrammarSubtitles([]);
            return;
        }
        let isMounted = true;
        setGrammarVideoLoading(true);
        (async () => {
            try {
                const { default: api } = await import("@/api/authConfig");
                const res = await api.get(`/items/video_section/${videoId}?fields=id,video_file,subtitles`);
                if (!isMounted) return;
                const fileId = res.data?.data?.video_file;
                if (fileId) {
                    setGrammarVideoSource(`${ASSET_URL}/${fileId}`);
                }
                const rawSubs = res.data?.data?.subtitles;
                if (Array.isArray(rawSubs)) {
                    setGrammarSubtitles(rawSubs);
                }
            } catch {
                if (isMounted) setGrammarVideoSource(null);
            } finally {
                if (isMounted) setGrammarVideoLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [currentLesson?.video_section_id, currentLesson?.lesson_type]);

    const activeGrammarSub = grammarSubtitles.find(
        (sub) => grammarCurrentTime >= (sub.start || 0) && grammarCurrentTime <= (sub.end || 9999)
    );

    // --- Dictation step state & helpers ---
    const [dictationInput, setDictationInput] = useState("");
    const [dictationChecked, setDictationChecked] = useState(false);
    const [dictationScore, setDictationScore] = useState<number | null>(null);

    const dictationExpected = currentLesson?.content || "";
    const dictationAudioUrl = currentLesson?.audio_id
        ? `${ASSET_URL}/${currentLesson.audio_id}`
        : currentLesson?.extra_audio_id
        ? `${ASSET_URL}/${currentLesson.extra_audio_id}`
        : null;

    const normalizeDictationText = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[\s\t\n\r]/g, "")
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>。，！？；：、（）《》【】]/g, "");
    };

    const handleCheckDictation = () => {
        const userNorm = normalizeDictationText(dictationInput);
        const expectedNorm = normalizeDictationText(dictationExpected);
        if (!expectedNorm) {
            setDictationScore(100);
        } else {
            const isMatch = userNorm === expectedNorm;
            setDictationScore(isMatch ? 100 : 0);
        }
        setDictationChecked(true);
    };

    const resetDictation = () => {
        setDictationInput("");
        setDictationChecked(false);
        setDictationScore(null);
    };

    // --- Word Info Modal State ---
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [wordInfo, setWordInfo] = useState<any>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header & Navigation */}
            <div className="bg-white border-b border-gray-100 shadow-2xs sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push(`/courses/${courseId}`)}
                            className="text-xs font-bold text-gray-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                        >
                            &larr; Khóa học
                        </button>
                        <span className="text-gray-300">|</span>
                        <h1 className="text-sm font-extrabold text-gray-900 truncate max-w-md">
                            {courseTitle}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col items-center">
                {/* STEP 1: Video Từ Vựng (learn-video-vocab) */}
                {currentStep === "learn-video-vocab" && (
                    <div className="max-w-2xl w-full mx-auto space-y-6">
                        <div className="space-y-6">
                            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-black group border border-gray-200">
                                {videoVocabLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : videoVocabSource ? (
                                    <video
                                        ref={vocabVideoRef}
                                        src={videoVocabSource}
                                        controls
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <>
                                        <Image
                                            src="/images/student_cafe.png"
                                            alt="Lesson Video Stream"
                                            fill
                                            className="object-cover opacity-50"
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white/70">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            <p className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                                                Chưa có video cho bài học này
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {vocabLoading ? (
                                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-2xs flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : !currentVocab ? (
                                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-2xs text-center">
                                    <p className="text-sm font-bold text-zinc-500">
                                        Chưa có từ vựng cho bài học này
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {vocabItems.length > 1 && (
                                        <div className="flex flex-wrap gap-2">
                                            {vocabItems.map((item, i) => (
                                                <button
                                                    key={String(item.id)}
                                                    onClick={() => setSelectedVocabIdx(i)}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${i === selectedVocabIdx
                                                        ? "bg-amber-600 border-amber-600 text-white"
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
                                                        }`}
                                                >
                                                    {item.word}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs space-y-4">
                                        <h4 className="font-extrabold text-amber-700 text-sm border-b border-amber-50 pb-2">
                                            Giải thích từ {currentVocab.word} ({currentVocab.pinyin}) trong tiếng Trung có nghĩa phổ biến:
                                        </h4>
                                        <ul className="space-y-3.5 text-xs text-gray-700 font-semibold leading-relaxed">
                                            {(currentVocab.senses?.length ? currentVocab.senses : [{ id: "fallback", meaning: currentVocab.meaning || "Chưa có nghĩa", examples: [] }]).map((sense, idx) => (
                                                <li key={String(sense.id ?? idx)} className="space-y-1">
                                                    <span className="text-gray-900 block font-bold">{idx + 1}. {sense.meaning}</span>
                                                    {sense.examples?.map((ex, j) => (
                                                        <div key={j} className="bg-gray-50 px-3 py-2 rounded-md font-mono flex items-center justify-between gap-2">
                                                            <span>{ex.chinese} &rarr; {ex.vietnamese}</span>
                                                            <button
                                                                onClick={() => speakChinese(ex.chinese)}
                                                                className="text-amber-600 hover:text-amber-700 text-sm cursor-pointer select-none font-bold shrink-0"
                                                            >
                                                                🔊 Nghe
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {!sense.examples?.length && (
                                                        <div className="bg-gray-50 px-3 py-2 rounded-md font-mono">
                                                            Chưa có ví dụ cho nghĩa này
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {currentVocab && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs space-y-5 relative">
                                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                                        {!showDecksList ? (
                                            <button
                                                onClick={handleSaveVocabClick}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${isSavedToFlashcard
                                                    ? "bg-amber-100 border-amber-300 text-amber-800"
                                                    : "bg-white border-gray-200 text-gray-600 hover:text-amber-500 hover:border-amber-200"
                                                    }`}
                                            >
                                                {isSavedToFlashcard ? <><Check className="w-4 h-4" /> Đã lưu Flashcard</> : <><Star className="w-4 h-4" /> Lưu từ vào flashcard</>}
                                            </button>
                                        ) : (
                                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg flex flex-col gap-2 w-48 text-left">
                                                <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Chọn bộ Flashcard:</h5>
                                                {loadingDecks ? (
                                                    <div className="py-2 flex justify-center"><span className="h-4 w-4 animate-spin rounded-full border border-amber-600 border-t-transparent"></span></div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-24 pr-1 scrollbar-thin">
                                                        {decks.length === 0 && !showCreateInput && <p className="text-[10px] text-zinc-400 text-center py-1">Chưa có bộ từ.</p>}
                                                        {decks.map(deck => (
                                                            <button
                                                                key={deck.id}
                                                                onClick={() => handleSelectDeckForVocab(deck.id, deck.title)}
                                                                disabled={savingVocab}
                                                                className="w-full text-left py-1 px-2 hover:bg-amber-50 dark:hover:bg-zinc-800 text-[11px] font-semibold rounded text-zinc-700 dark:text-zinc-300 bg-transparent border-none cursor-pointer"
                                                            >
                                                                <Folder className="w-4 h-4 text-amber-500 inline mr-1" /> {deck.title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {showCreateInput ? (
                                                    <form onSubmit={handleCreateAndSaveVocab} className="flex gap-1">
                                                        <input
                                                            type="text"
                                                            value={newDeckTitle}
                                                            onChange={(e) => setNewDeckTitle(e.target.value)}
                                                            placeholder="Tên bộ..."
                                                            className="w-full px-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-white"
                                                            autoFocus
                                                        />
                                                        <button type="submit" disabled={savingVocab || !newDeckTitle.trim()} className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded cursor-pointer border-none">
                                                            OK
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowCreateInput(true)}
                                                        className="text-center py-1 text-[10px] text-amber-600 font-bold border border-dashed border-amber-500/30 rounded bg-transparent cursor-pointer"
                                                    >
                                                        ➕ Tạo bộ mới
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setShowDecksList(false)}
                                                    className="text-center text-[10px] text-zinc-400 font-semibold mt-1 bg-transparent border-none cursor-pointer"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}

                                        {saveMessage && (
                                            <div className={`p-2 rounded-lg text-[10px] font-bold text-center ${saveMessage.type === "success"
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                }`}>
                                                {saveMessage.text}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3.5 pt-2">
                                        <button
                                            onClick={() => speakChinese(currentVocab?.word || "")}
                                            className="w-11 h-11 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90 transition-transform"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 0 0 1.06 1.06l2.25-2.25a.75.75 0 0 0 0-1.06l-2.25-2.25Z" />
                                            </svg>
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 tracking-wide">{currentVocab?.word}</h3>
                                            <p className="text-xs text-amber-600 font-bold">{currentVocab?.pinyin} — {currentVocab?.meaning}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-xl gap-4 border border-dashed border-gray-200">
                                        {recordState === "idle" && (
                                            <>
                                                <button
                                                    onClick={startPronunciation}
                                                    className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                                        <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
                                                    </svg>
                                                </button>
                                                {pronounceError && (
                                                    <p className="text-[10px] text-rose-600 font-bold max-w-xs text-center">
                                                        {pronounceError}
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {recordState === "recording" && (
                                            <div className="flex flex-col items-center gap-2">
                                                <button
                                                    onClick={() => setRecordState("done")}
                                                    className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 animate-ping cursor-pointer"
                                                >
                                                    <span className="w-5 h-5 bg-white rounded-xs"></span>
                                                </button>
                                                <p className="text-xs font-bold text-rose-600 tracking-wider animate-pulse">
                                                    ĐANG GHI ÂM: {recordSeconds}s / 3s
                                                </p>
                                            </div>
                                        )}

                                        {recordState === "done" && (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setPlayBackState(true);
                                                            speakChinese(currentVocab?.word || "");
                                                            setTimeout(() => setPlayBackState(false), 1200);
                                                        }}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        {playBackState ? <><Volume2 className="w-4 h-4 mr-1.5" /> Đang phát...</> : <><Play className="w-4 h-4 mr-1.5" /> Nghe lại</>}
                                                    </button>
                                                    <button
                                                        onClick={resetPronunciation}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        🔄 Ghi lại
                                                    </button>
                                                </div>
                                                {pronounceProcessing ? (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 animate-pulse">
                                                        <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                                                        Đang phân tích phát âm...
                                                    </div>
                                                ) : pronounceError ? (
                                                    <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-lg text-rose-700 font-extrabold text-xs max-w-xs text-center">
                                                        {pronounceError}
                                                    </div>
                                                ) : pronounceResult ? (
                                                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-emerald-800 font-extrabold text-xs">
                                                        <Target className="w-5 h-5 text-amber-500" />
                                                        <div>
                                                            <p>Điểm phát âm: {pronounceResult.accuracy}/100 ({pronounceResult.accuracy >= 85 ? "Xuất sắc" : pronounceResult.accuracy >= 70 ? "Khá tốt" : "Cần luyện thêm"})</p>
                                                            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Bạn nói: {pronounceResult.text}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg text-emerald-800 font-extrabold text-xs">
                                                        Đang xử lý...
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {recordState === "idle" && (
                                            <span className="text-xs text-gray-400 font-bold">
                                                Nhấn nút đỏ để bắt đầu ghi âm phát âm của bạn
                                            </span>
                                        )}
                                    </div>


                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 1.5: Lý thuyết: Giải nghĩa từ vựng (learn-vocab-theory) */}
                {currentStep === "learn-vocab-theory" && <VocabTheoryCards items={vocabTheoryItems} loading={vocabTheoryLoading} />}
                {false && currentStep === "learn-vocab-theory" && (
                    <div className="max-w-3xl w-full mx-auto space-y-6">
                        {vocabTheoryLoading ? (
                            <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-2xs flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : vocabTheoryItems.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-2xs text-center">
                                <p className="text-sm font-bold text-zinc-500">
                                    Chưa có từ vựng cho bài học này
                                </p>
                            </div>
                        ) : (
                            <>
                                {vocabTheoryItems.length > 1 && (
                                    <div className="flex flex-wrap gap-2">
                                        {vocabTheoryItems.map((item, i) => (
                                            <button
                                                key={String(item.id)}
                                                onClick={() => setVocabTheoryIdx(i)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${i === vocabTheoryIdx
                                                    ? "bg-amber-600 border-amber-600 text-white"
                                                    : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
                                                    }`}
                                            >
                                                {item.word}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentTheoryVocab && (
                                    <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-2xs space-y-6">
                                        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-amber-50 pb-5">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => speakChinese(currentTheoryVocab.word || "")}
                                                    className="w-12 h-12 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90 transition-transform shrink-0"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                                                    </svg>
                                                </button>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-wide">{currentTheoryVocab.word}</h3>
                                                    <p className="text-sm text-amber-600 font-bold">{currentTheoryVocab.pinyin}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(currentTheoryVocab.senses?.length > 1 || currentTheoryVocab.senses?.[0]?.pos_label) && (
                                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                                        {currentTheoryVocab.senses.map((sense: any, idx: number) => (
                                                            sense.pos_label ? (
                                                                <span key={idx} className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-950/40 px-2 py-1 rounded-md">
                                                                    {sense.pos_label}
                                                                </span>
                                                            ) : null
                                                        ))}
                                                    </div>
                                                )}
                                                {currentTheoryVocab.note && (
                                                    <button
                                                        onClick={() => setShowHanziWrite((prev) => !prev)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${showHanziWrite
                                                            ? "bg-amber-600 border-amber-600 text-white"
                                                            : "bg-white border-gray-200 text-gray-600 hover:text-amber-500 hover:border-amber-200"
                                                            }`}
                                                    >
                                                        {showHanziWrite ? "Ẩn cách viết" : "Hiện cách viết hanzi"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {showHanziWrite && currentTheoryVocab.note && (
                                            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-2">
                                                <h5 className="text-xs font-black text-amber-700 uppercase tracking-wider">
                                                    Ghi chú cách viết & bộ chữ Hán
                                                </h5>
                                                <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                                                    {currentTheoryVocab.note}
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-3.5">
                                            <h4 className="font-extrabold text-amber-700 text-sm">
                                                Giải nghĩa từ {currentTheoryVocab.word} ({currentTheoryVocab.pinyin}) trong tiếng Trung có nghĩa phổ biến:
                                            </h4>
                                            {(currentTheoryVocab.senses?.length ? currentTheoryVocab.senses : [{ id: "fallback", meaning: "Chưa có nghĩa", examples: [] }]).map((sense: any, idx: number) => (
                                                <div key={String(sense.id ?? idx)} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/30">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-700 font-black text-xs shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        {sense.pos_label && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                                                                {sense.pos_label}
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-bold text-gray-900">{sense.meaning}</span>
                                                    </div>
                                                    {sense.examples?.map((ex: any, j: number) => (
                                                        <div key={j} className="bg-white px-4 py-3 rounded-lg border border-gray-100 font-mono space-y-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-sm text-gray-800 font-semibold">{ex.chinese}</span>
                                                                <button
                                                                    onClick={() => speakChinese(ex.chinese)}
                                                                    className="text-amber-600 hover:text-amber-700 text-sm cursor-pointer select-none font-bold shrink-0"
                                                                >
                                                                    🔊 Nghe
                                                                </button>
                                                            </div>
                                                            {ex.pinyin && <p className="text-xs text-amber-600 font-semibold">{ex.pinyin}</p>}
                                                            {ex.vietnamese && <p className="text-xs text-gray-500 font-medium">&rarr; {ex.vietnamese}</p>}
                                                        </div>
                                                    ))}
                                                    {!sense.examples?.length && (
                                                        <p className="text-xs text-zinc-400 italic">Chưa có ví dụ cho nghĩa này</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* STEP 2: Bài tập từ vựng (learn-quiz-vocab) */}
                {currentStep === "learn-quiz-vocab" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                        <div className="lg:col-span-2 space-y-6">
                            {isLoadingQuiz && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-xs flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            {!isLoadingQuiz && !currentQuiz && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-xs text-center text-zinc-500 font-bold text-sm">
                                    {quizExercises.length === 0 ? "Chưa có câu hỏi trắc nghiệm" : "Đang tải..."}
                                </div>
                            )}
                            {!isLoadingQuiz && currentQuiz && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                                    <div className="flex items-center justify-between border-b border-amber-50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                                                Q{currentQuizIdx + 1}
                                            </span>
                                            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                                                {currentQuiz?.question || "Câu hỏi"}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => speakChinese("chi")}
                                            className="w-10 h-10 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90 transition-transform animate-bounce-slow"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentQuiz && ["A", "B", "C", "D"].map((key) => {
                                            const answerKey = `answer_${key}` as keyof typeof currentQuiz;
                                            const val = currentQuiz[answerKey] || "";
                                            const correctKey = currentQuiz.Correct_answer;
                                            const isSelected = vocabSelected === key;
                                            let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";

                                            if (isSelected) {
                                                if (key === correctKey) {
                                                    btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500";
                                                } else {
                                                    btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                                                }
                                            } else if (vocabSelected && key === correctKey) {
                                                btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                                            }

                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => handleVocabSelect(key)}
                                                    disabled={!currentQuiz}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer ${btnStyle}`}
                                                >
                                                    <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0 select-none text-gray-600 font-black">
                                                        {key}
                                                    </span>
                                                    <span>{val}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {vocabSelected && currentQuiz && (
                                        <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${vocabSelected === currentQuiz.Correct_answer
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                            : "bg-rose-50 border-rose-200 text-rose-900"
                                            }`}>
                                            <div className="flex items-center gap-1.5 font-bold text-sm">
                                                {vocabSelected === currentQuiz.Correct_answer ? (
                                                    <span className="flex items-center gap-1.5"><PartyPopper className="w-4 h-4 text-emerald-500" /> Chính xác!</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Sai rồi! Thử lại xem nhé.</span>
                                                )}
                                            </div>
                                            {currentQuiz.Explanation && (
                                                <p><strong>Giải thích:</strong> {currentQuiz.Explanation}</p>
                                            )}
                                            <p className="text-[10px] text-gray-500">
                                                Đáp án đúng: <strong className="text-emerald-700">{currentQuiz.Correct_answer}. {currentQuiz[`answer_${currentQuiz.Correct_answer}` as keyof typeof currentQuiz]}</strong> | Đáp án của bạn: <strong className={vocabSelected === currentQuiz.Correct_answer ? "text-emerald-700" : "text-rose-700"}>{vocabSelected}. {getVocabSelectedLabel(vocabSelected)}</strong>
                                            </p>
                                            <button onClick={resetVocabQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                                                Thử lại câu này
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-4 border-t border-gray-50 select-none">
                                        {quizExercises.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    resetVocabQuiz();
                                                    if (currentQuizIdx < quizExercises.length - 1) {
                                                        setCurrentQuizIdx((p) => p + 1);
                                                    }
                                                }}
                                                disabled={currentQuizIdx >= quizExercises.length - 1}
                                                className="text-xs font-black text-gray-500 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30"
                                            >
                                                Câu tiếp →
                                            </button>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold space-y-3 shadow-2xs">
                                <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                                    <Lightbulb className="w-4 h-4 text-amber-500 inline mr-1.5" /> Đặc điểm giao diện
                                </div>
                                <ul className="list-disc pl-4 space-y-2">
                                    <li>Phần này trong câu hỏi trắc nghiệm có thể kèm audio hoặc không</li>
                                    <li>Chọn xong sẽ hiện đáp án và giải thích luôn</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Video ngữ pháp (learn-video-grammar) */}
                {currentStep === "learn-video-grammar" && (
                    <div className="max-w-2xl w-full mx-auto space-y-6">
                        <div className="space-y-6">
                            <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-black group border border-gray-200">
                                {grammarVideoLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : grammarVideoSource ? (
                                    <video
                                        ref={grammarVideoRef}
                                        src={grammarVideoSource}
                                        controls
                                        className="h-full w-full object-contain"
                                        onTimeUpdate={handleGrammarTimeUpdate}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white/70">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <p className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                                            Chưa có video ngữ pháp cho bài học này
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-2xs space-y-4">
                                <h4 className="font-extrabold text-amber-700 text-sm border-b border-amber-50 pb-2">
                                    Giải thích chi tiết (Đang phát theo video)
                                </h4>
                                <div className="space-y-3.5 text-xs text-gray-700 font-semibold leading-relaxed">
                                    {activeGrammarSub ? (
                                        <div>
                                            <p className="text-sm font-bold text-zinc-800 dark:text-white mb-2">
                                                Chữ Hán: {activeGrammarSub.chinese} {activeGrammarSub.pinyin && `(${activeGrammarSub.pinyin})`}
                                            </p>
                                            <p className="bg-amber-50/60 text-amber-900 p-3.5 rounded-xl border-l-4 border-amber-500 font-semibold leading-relaxed">
                                                {activeGrammarSub.vietnamese}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-400 italic">
                                            Phát video để xem giải thích ngữ pháp tương ứng chạy theo thời gian thực.
                                        </p>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>
                )}

                {/* STEP 4: Bài tập ngữ pháp (learn-quiz-grammar) */}
                {currentStep === "learn-quiz-grammar" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                        <div className="lg:col-span-2 space-y-6">
                            {isLoadingQuiz && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-xs flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            {!isLoadingQuiz && !currentQuiz && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-12 shadow-xs text-center text-zinc-500 font-bold text-sm">
                                    {quizExercises.length === 0 ? "Chưa có câu hỏi trắc nghiệm" : "Đang tải..."}
                                </div>
                            )}
                            {!isLoadingQuiz && currentQuiz && (
                                <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                                    <div className="flex items-center justify-between border-b border-amber-50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                                                Q{currentQuizIdx + 1}
                                            </span>
                                            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                                                {currentQuiz?.question || "Câu hỏi"}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentQuiz && ["A", "B", "C", "D"].map((key) => {
                                            const answerKey = `answer_${key}` as keyof typeof currentQuiz;
                                            const val = currentQuiz[answerKey] || "";
                                            const correctKey = currentQuiz.Correct_answer;
                                            const isSelected = vocabSelected === key;
                                            let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";

                                            if (isSelected) {
                                                if (key === correctKey) {
                                                    btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500";
                                                } else {
                                                    btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                                                }
                                            } else if (vocabSelected && key === correctKey) {
                                                btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                                            }

                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => handleVocabSelect(key)}
                                                    disabled={!currentQuiz}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer ${btnStyle}`}
                                                >
                                                    <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0 select-none text-gray-600 font-black">
                                                        {key}
                                                    </span>
                                                    <span>{val}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {vocabSelected && currentQuiz && (
                                        <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${vocabSelected === currentQuiz.Correct_answer
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                            : "bg-rose-50 border-rose-200 text-rose-900"
                                            }`}>
                                            <div className="flex items-center gap-1.5 font-bold text-sm">
                                                {vocabSelected === currentQuiz.Correct_answer ? (
                                                    <span className="flex items-center gap-1.5"><PartyPopper className="w-4 h-4 text-emerald-500" /> Chính xác!</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Sai rồi! Thử lại xem nhé.</span>
                                                )}
                                            </div>
                                            {currentQuiz.Explanation && (
                                                <p><strong>Giải thích:</strong> {currentQuiz.Explanation}</p>
                                            )}
                                            <p className="text-[10px] text-gray-500">
                                                Đáp án đúng: <strong className="text-emerald-700">{currentQuiz.Correct_answer}. {currentQuiz[`answer_${currentQuiz.Correct_answer}` as keyof typeof currentQuiz]}</strong> | Đáp án của bạn: <strong className={vocabSelected === currentQuiz.Correct_answer ? "text-emerald-700" : "text-rose-700"}>{vocabSelected}. {getVocabSelectedLabel(vocabSelected)}</strong>
                                            </p>
                                            <button onClick={resetVocabQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                                                Thử lại câu này
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-4 border-t border-gray-50 select-none">
                                        {quizExercises.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    resetVocabQuiz();
                                                    if (currentQuizIdx < quizExercises.length - 1) {
                                                        setCurrentQuizIdx((p) => p + 1);
                                                    }
                                                }}
                                                disabled={currentQuizIdx >= quizExercises.length - 1}
                                                className="text-xs font-black text-gray-500 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30"
                                            >
                                                Câu tiếp →
                                            </button>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold space-y-3 shadow-2xs">
                                <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                                    <Lightbulb className="w-4 h-4 text-amber-500 inline mr-1.5" /> Đặc điểm giao diện
                                </div>
                                <ul className="list-disc pl-4 space-y-2">
                                    <li>Phần này trong câu hỏi trắc nghiệm có thể kèm audio hoặc không</li>
                                    <li>Chọn xong sẽ hiện đáp án và giải thích luôn</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5: Bài tập Nghe chép chính tả (learn-dictation) */}
                {currentStep === "learn-dictation" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fade-in">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                                <div className="flex items-center justify-between border-b border-amber-50 pb-3">
                                    <h3 className="font-black text-amber-800 text-base flex items-center gap-2">
                                        <Volume2 className="w-5 h-5 text-amber-500" /> Đề bài Nghe chép chính tả (Input Audio)
                                    </h3>
                                </div>

                                <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100/80 flex flex-col gap-3">
                                    <p className="text-xs font-bold text-amber-900">1. Nghe file âm thanh dưới đây:</p>
                                    {dictationAudioUrl ? (
                                        <audio src={dictationAudioUrl} controls preload="metadata" className="w-full h-11 shadow-2xs rounded-lg" />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => speakChinese(dictationExpected)}
                                                className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                                            >
                                                <Volume2 className="w-6 h-6" />
                                            </button>
                                            <span className="text-xs font-bold text-amber-700">Phát âm thanh bài tập</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-extrabold text-gray-900 text-sm">
                                        2. Chép lại chính xác nội dung câu bạn nghe được:
                                    </h4>

                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={dictationInput}
                                            onChange={(e) => setDictationInput(e.target.value)}
                                            placeholder="Nhập câu tiếng Trung bạn nghe được..."
                                            disabled={dictationChecked}
                                            className="w-full bg-white border-2 border-amber-200 focus:border-amber-500 focus-visible:ring-0 rounded-xl px-4 py-3 text-sm text-gray-900 font-bold placeholder-gray-400 transition-all font-mono shadow-2xs"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleCheckDictation}
                                            disabled={dictationChecked || !dictationInput.trim()}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-5 rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 shrink-0"
                                        >
                                            Chấm điểm & Kiểm tra
                                        </Button>
                                        {dictationChecked && (
                                            <button
                                                onClick={resetDictation}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                                            >
                                                🔄 Làm lại bài này
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {dictationChecked && dictationScore !== null && (
                                    <div className={`p-5 rounded-2xl border shadow-2xs space-y-3 ${
                                        dictationScore >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <Target className={`w-8 h-8 ${dictationScore >= 80 ? "text-emerald-500" : "text-rose-500"}`} />
                                            <div>
                                                <h5 className="font-extrabold text-sm">
                                                    Kết quả chấm điểm: {dictationScore}% {dictationScore === 100 ? "🎉 Hoàn hảo!" : dictationScore >= 80 ? "Chính xác!" : "Cần luyện thêm"}
                                                </h5>
                                                <p className="text-xs font-semibold mt-1">
                                                    Đáp án chuẩn từ Directus: <strong className="font-black underline font-mono">&quot;{dictationExpected}&quot;</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold space-y-3 shadow-2xs">
                                <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                                    <Lightbulb className="w-4 h-4 text-amber-500 inline mr-1.5" /> Hướng dẫn làm bài
                                </div>
                                <ul className="list-disc pl-4 space-y-2">
                                    <li>Lắng nghe âm thanh và nhập từng ký tự chữ Hán chính xác.</li>
                                    <li>Hệ thống chấm điểm tự động dựa trên cấu hình nội dung bài học từ Directus.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 6: Thực hành hội thoại (learn-conversation) */}
                {currentStep === "learn-conversation" && (
                    <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto space-y-6">
                        {convLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                <div className="w-10 h-10 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
                                <p className="text-xs font-bold text-zinc-500">Đang tải kịch bản hội thoại AI...</p>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col gap-6 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
                                {convVisibleMessages.map((msg: any) => {
                                    const isSpeakerA = msg.speaker?.toUpperCase() === "A";
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex items-start gap-3 w-full ${isSpeakerA ? "justify-start" : "justify-end"}`}
                                        >
                                            {isSpeakerA && (
                                                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                                    <User className="w-6 h-6 text-zinc-400" />
                                                </div>
                                            )}

                                            <div className="max-w-md flex flex-col gap-2">
                                                <div
                                                    className={`rounded-2xl p-4 shadow-sm relative ${isSpeakerA
                                                        ? "bg-white border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700"
                                                        : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                                        }`}
                                                >
                                                    <p className="font-bold text-sm leading-relaxed">{msg.chinese_text}</p>
                                                    <p
                                                        className={`text-[11px] leading-relaxed ${isSpeakerA ? "text-zinc-500" : "text-white/80 italic"
                                                            }`}
                                                    >
                                                        {msg.pinyin}
                                                    </p>
                                                    <p
                                                        className={`text-xs leading-relaxed ${isSpeakerA ? "text-zinc-400 font-medium" : "text-amber-100 font-semibold"
                                                            }`}
                                                    >
                                                        {msg.vietnamese_text}
                                                    </p>

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleConvSpeak(msg.chinese_text)}
                                                            className={`text-xs cursor-pointer ${isSpeakerA ? "text-zinc-400 hover:text-zinc-600" : "text-white/80 hover:text-white"}`}
                                                        >
                                                            🔊 Phát âm mẫu
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Trình ghi âm và so khớp phát âm của B */}
                                                {!isSpeakerA && (
                                                    <div className="flex flex-col gap-2 p-3 bg-white border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl shadow-2xs">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-[10px] font-bold text-zinc-400 select-none">
                                                                Luyện nói câu này:
                                                            </span>

                                                            <button
                                                                onClick={() => handleConvToggleRecording(msg.id)}
                                                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${activeRecordingId === msg.id && msg.recording?.state.isRecording
                                                                    ? "bg-rose-500 text-white animate-pulse"
                                                                    : msg.recording?.state.isProcessing
                                                                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                                        : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500 hover:bg-amber-200 cursor-pointer"
                                                                    }`}
                                                                disabled={msg.recording?.state.isProcessing}
                                                            >
                                                                {activeRecordingId === msg.id && msg.recording?.state.isRecording ? (
                                                                    <>
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                                                                        Dừng nói
                                                                    </>
                                                                ) : msg.recording?.state.isProcessing ? (
                                                                    <>
                                                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 border-t-amber-600 animate-spin"></span>
                                                                        Đang dịch giọng...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Mic className="w-4 h-4 inline mr-1.5" /> Nhấp để nói
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Hiển thị so sánh phát âm thực tế nếu có */}
                                                        {msg.recording?.comparison && (
                                                            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-zinc-500 select-none">Phân tích giọng nói:</span>
                                                                    <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${msg.recording.comparison.accuracy >= 80
                                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500"
                                                                        : "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-500"
                                                                        }`}>
                                                                        Độ chính xác: {Math.round(msg.recording.comparison.accuracy)}%
                                                                    </span>
                                                                </div>

                                                                <div className="py-2 px-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                                                    <HighlightedText
                                                                        text={msg.chinese_text}
                                                                        highlightedWords={msg.recording.comparison.highlightedText}
                                                                        showPinyin={true}
                                                                        segmentedWords={msg.chinese_text.split("").map((c: any) => ({ word: c, pinyin: "" }))}
                                                                    />
                                                                </div>

                                                                {msg.recording.result?.text && (
                                                                    <p className="text-[10px] text-zinc-400 italic">
                                                                        AI nghe được: &quot;{msg.recording.result.text}&quot;
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {!isSpeakerA && (
                                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={convEndRef} />
                            </div>
                        )}

                        <div className="flex justify-between items-center w-full pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            {convHasMoreMessages && !convLoading && (
                                <button
                                    onClick={handleConvContinue}
                                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                                >
                                    Xem câu thoại tiếp theo 💬
                                </button>
                            )}


                        </div>
                    </div>
                )}

                {/* STEP 7: Bài tập bổ sung (learn-extra) */}
                {currentStep === "learn-extra" && (
                    <div className="flex flex-col items-center justify-start w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl items-center">
                            {/* Left side: Dashed bordered container with 3 download items */}
                            <div className="md:col-span-2 bg-white rounded-2xl border-2 border-dashed border-orange-200 p-8 shadow-xs w-full">
                                <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-6 text-center">
                                    📥 Giao diện tải tài liệu & Bài tập bổ sung
                                </h4>
                                <div className="flex items-center justify-around gap-6">
                                    {/* PDF 1 */}
                                    {currentLesson?.extra_pdf_id ? (
                                        <a
                                            href={`${ASSET_URL}/${currentLesson.extra_pdf_id}`}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                        >
                                            <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative">
                                                <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                                                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                    <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">Tải Bài tập</span>
                                        </a>
                                    ) : (
                                        <div className="text-xs text-zinc-400 italic">Chưa có file bài tập</div>
                                    )}

                                    {/* PDF 2 */}
                                    {currentLesson?.extra_answer_id ? (
                                        <a
                                            href={`${ASSET_URL}/${currentLesson.extra_answer_id}`}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                        >
                                            <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative">
                                                <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                                                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                    <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">Tải Đáp án</span>
                                        </a>
                                    ) : (
                                        <div className="text-xs text-zinc-400 italic">Chưa có file đáp án</div>
                                    )}

                                    {/* Audio */}
                                    {currentLesson?.extra_audio_id ? (
                                        <a
                                            href={`${ASSET_URL}/${currentLesson.extra_audio_id}`}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                        >
                                            <div className="w-16 h-20 bg-orange-50 border border-orange-200 rounded-xl flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-500">
                                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">Tải Audio</span>
                                        </a>
                                    ) : (
                                        <div className="text-xs text-zinc-400 italic">Chưa có audio</div>
                                    )}
                                </div>
                            </div>

                            {/* Right side: Helper Text */}
                            <div className="md:col-span-1 text-sm font-bold text-gray-700 leading-relaxed space-y-2 p-2">
                                <div className="flex items-center gap-1.5 text-amber-600 text-lg">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="font-semibold text-gray-600">
                                    Đây là các file để người học tải về máy ôn tập thêm.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end w-full pt-6 border-t border-gray-150 mt-8 max-w-3xl">
                            <button
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                Về lộ trình học &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* WordInfoModal for translations and flashcard saves */}
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
        </div>
    );
}

export default function LearnRoomPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const unwrappedParams = use(params);

    return (
        <Suspense
            fallback={
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
                </div>
            }
        >
            <LearnRoomContent params={unwrappedParams} />
        </Suspense>
    );
}
