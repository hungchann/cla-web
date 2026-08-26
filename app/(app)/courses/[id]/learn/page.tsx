"use client";

import { use, useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import { coursesApi } from "@/api/courses";
import { vocabularyApi } from "@/api/vocabulary";
import { CourseLesson, CourseLessonType, LessonTheory, LessonVideo, LessonExtra } from "@/lib/types/course";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import { PremiumGate } from "@/components/PremiumGate";
import { usePremium } from "@/lib/hooks/usePremium";
import {
  FREE_EXERCISE_LIMIT,
  getCompletedExerciseCount,
  incrementCompletedExerciseCount,
} from "@/lib/premium";
import { parseSRTtoArray } from "@/services/subtitle";
import { Button } from "@/components/ui/button";

import { LearnHeader } from "./components/LearnHeader";
import { VideoVocabStep } from "./components/VideoVocabStep";
import { VocabTheoryStep } from "./components/VocabTheoryStep";
import { QuizStep } from "./components/QuizStep";
import { VideoGrammarStep } from "./components/VideoGrammarStep";
import { DictationStep } from "./components/DictationStep";
import { ConversationStep } from "./components/ConversationStep";
import { ExtraLessonStep } from "./components/ExtraLessonStep";
import { srtTimeToSeconds, type VocabItem, type SubtitleItem } from "./types";

const LEARN_TO_STEP_TYPE: Record<string, string> = {
    video_vocab: "learn-video-vocab",
    vocab_theory: "learn-vocab-theory",
    quiz_vocab: "learn-quiz-vocab",
    video_grammar: "learn-video-grammar",
    quiz_grammar: "learn-quiz-grammar",
    dictation: "learn-dictation",
    conversation: "learn-conversation",
    extra: "learn-extra",
};

/** Các step tính là BÀI TẬP — user Free giới hạn FREE_EXERCISE_LIMIT bài (contract premium). */
const EXERCISE_LESSON_TYPES = new Set<string>(["quiz_vocab", "quiz_grammar", "dictation", "conversation"]);

function LearnRoomContent({ params }: { readonly params: { id: string } }) {
    const courseId = params.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const lessonParam = searchParams.get("lesson");
    const stepParam = searchParams.get("step");

    const fallbackType: CourseLessonType =
        (stepParam as CourseLessonType) || "video_vocab";

    const [courseTitle, setCourseTitle] = useState("Chi tiết khóa học");
    const [currentLesson, setCurrentLesson] = useState<CourseLesson | null>(null);

    // Fetch course details
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const c = await coursesApi.getCourseById(courseId);
                if (isMounted && c?.title) setCourseTitle(c.title);
            } catch {
                // ignore error
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [courseId]);

    // Fetch current lesson based on search params
    useEffect(() => {
        let isMounted = true;

        const filterValidLessons = (lessons: CourseLesson[]) =>
            lessons.filter((l) => (l as any).is_published !== false);

        const getFlatLessons = async () => {
            const chapters = await coursesApi.getCourseChapters(courseId);
            return filterValidLessons(chapters.flatMap((c) => c.lessons || []));
        };

        const fetchLesson = async () => {
            try {
                if (lessonParam) {
                    const lesson = await coursesApi.getCourseLessonById(lessonParam);
                    if (!isMounted) return;
                    if (lesson) {
                        setCurrentLesson(lesson);
                        return;
                    }
                }

                const flat = await getFlatLessons();
                if (!isMounted) return;

                if (lessonParam) {
                    const fallback = flat[0] || null;
                    setCurrentLesson(fallback);
                    if (fallback) {
                        router.replace(`/courses/${courseId}/learn?lesson=${fallback.id}`, {
                            scroll: false,
                        });
                    }
                } else {
                    const target = stepParam
                        ? (flat.find((l) => l.lesson_type === fallbackType) || flat[0] || null)
                        : (flat[0] || null);
                    setCurrentLesson(target);
                }
            } catch {
                if (isMounted) setCurrentLesson(null);
            }
        };
        fetchLesson();
        return () => {
            isMounted = false;
        };
    }, [courseId, lessonParam, stepParam, fallbackType, router]);

    const currentStep = currentLesson?.lesson_type
        ? LEARN_TO_STEP_TYPE[currentLesson.lesson_type] || `learn-${currentLesson.lesson_type}`
        : `learn-${fallbackType}`;

    // --- STEP 1: Video Vocab States ---
    const [lessonVideo, setLessonVideo] = useState<LessonVideo | null>(null);
    const [videoVocabLoading, setVideoVocabLoading] = useState(false);
    const [videoVocabSubtitles, setVideoVocabSubtitles] = useState<SubtitleItem[]>([]);
    const [videoVocabTime, setVideoVocabTime] = useState(0);
    const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
    const [vocabLoading, setVocabLoading] = useState(false);
    const [selectedVocabIdx, setSelectedVocabIdx] = useState(0);

    // Fetch video vocab data
    useEffect(() => {
        if (currentStep !== "learn-video-vocab" || !currentLesson?.id) return;
        let isMounted = true;
        setVideoVocabLoading(true);

        (async () => {
            try {
                const vid = await coursesApi.getLessonVideo(currentLesson.id);
                if (isMounted) setLessonVideo(vid);

                const subContent = (vid as any)?.subtitle_content;
                if (subContent) {
                    const parsed = parseSRTtoArray(subContent);
                    if (isMounted) {
                        setVideoVocabSubtitles(
                            parsed.map((s) => ({
                                start: srtTimeToSeconds(s.start),
                                end: srtTimeToSeconds(s.end),
                                chinese: s.chinese,
                                vietnamese: s.vietnamese,
                                pinyin: s.pinyin,
                                rawText: s.rawText,
                            }))
                        );
                    }
                } else if (isMounted) {
                    setVideoVocabSubtitles([]);
                }
            } catch {
                if (isMounted) {
                    setLessonVideo(null);
                    setVideoVocabSubtitles([]);
                }
            } finally {
                if (isMounted) setVideoVocabLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // Fetch lesson vocab items
    useEffect(() => {
        if (currentStep !== "learn-video-vocab" || !currentLesson?.id) return;
        let isMounted = true;
        setVocabLoading(true);

        (async () => {
            try {
                const rawVocabs = await coursesApi.getLessonVocab(currentLesson.id);
                const formatted: VocabItem[] = rawVocabs.map((v) => ({
                    id: v.id,
                    word: v.word,
                    pinyin: v.pinyin || "",
                    meaning: v.meaning || "",
                    word_type: (v as any).word_type,
                    note: (v as any).note,
                    time_start: v.time_start,
                    time_end: v.time_end,
                    gif_id: typeof v.gif_id === "object" ? v.gif_id?.id : v.gif_id,
                    gif_url: v.gif_url,
                    senses: (v as any).senses?.map((s: any) => ({
                        id: s.id,
                        pos_label: s.pos_label,
                        meaning: s.meaning,
                        examples: s.examples || [],
                    })),
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

        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // --- STEP 1.5: Vocab Theory States ---
    const [vocabTheoryItems, setVocabTheoryItems] = useState<VocabItem[]>([]);
    const [vocabTheoryLoading, setVocabTheoryLoading] = useState(false);
    const [lessonTheory, setLessonTheory] = useState<LessonTheory | null>(null);
    const [lessonTheoryLoading, setLessonTheoryLoading] = useState(false);

    useEffect(() => {
        if (currentStep !== "learn-vocab-theory" || !currentLesson?.id) return;
        let isMounted = true;
        setVocabTheoryLoading(true);
        setLessonTheoryLoading(true);

        (async () => {
            try {
                // 1. Fetch lesson theory content first
                const theoryData = await coursesApi.getLessonTheory(currentLesson.id);
                if (!isMounted) return;
                setLessonTheory(theoryData);
                setLessonTheoryLoading(false);

                // 2. Resolve vocabularies: Priority 1: M2M vocab_items linked directly from Dictionary
                let vocabs: any[] = [];
                if (theoryData?.vocab_items && theoryData.vocab_items.length > 0) {
                    vocabs = await vocabularyApi.getVocabDetailsForItems(theoryData.vocab_items);
                }

                // Priority 2: Preset display map from dictionary
                if (vocabs.length === 0) {
                    const rawMapId = theoryData?.vocab_display_map_id;
                    const displayMapId = typeof rawMapId === "object" ? (rawMapId as any)?.id : rawMapId;
                    if (displayMapId) {
                        vocabs = await vocabularyApi.getVocabByDisplayMap(displayMapId);
                    }
                }

                // Priority 3: Fallback to lesson_vocab items
                if (vocabs.length === 0) {
                    const fallbackVocabs = await coursesApi.getLessonVocab(currentLesson.id);
                    vocabs = fallbackVocabs.map((v) => ({
                        id: v.id,
                        word: v.word,
                        pinyin: v.pinyin || "",
                        meaning: v.meaning || "",
                        note: (v as any).note,
                        gif_id: typeof v.gif_id === "object" ? (v.gif_id as any)?.id : v.gif_id,
                        gif_url: v.gif_url,
                        senses: (v as any).senses || [
                            {
                                id: `fallback-${v.id}`,
                                meaning: v.meaning || "",
                                examples: [],
                            },
                        ],
                    }));
                }

                if (isMounted) {
                    setVocabTheoryItems(
                        vocabs.map((v) => ({
                            id: v.id,
                            word: v.word,
                            pinyin: v.pinyin || "",
                            meaning: v.meaning || "",
                            note: v.note,
                            gif_id: v.gif_id,
                            gif_url: v.gif_url,
                            senses: v.senses || [],
                        }))
                    );
                }
            } catch {
                if (isMounted) {
                    setVocabTheoryItems([]);
                    setLessonTheory(null);
                }
            } finally {
                if (isMounted) {
                    setVocabTheoryLoading(false);
                    setLessonTheoryLoading(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // --- STEP 2 & STEP 4: Quiz Vocab & Quiz Grammar States ---
    const [quizExercises, setQuizExercises] = useState<any[]>([]);
    const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

    useEffect(() => {
        const isQuiz = currentStep === "learn-quiz-vocab" || currentStep === "learn-quiz-grammar";
        const targetLessonId = currentLesson?.id;
        if (!isQuiz || !targetLessonId) return;

        let isMounted = true;
        const fetchExercises = async () => {
            setIsLoadingQuiz(true);
            try {
                const questions = await coursesApi.getLessonQuestions(targetLessonId);
                const mapped = questions.map((q) => ({
                    id: q.id,
                    question: q.question,
                    answer_A: q.answer_A,
                    answer_B: q.answer_B,
                    answer_C: q.answer_C,
                    answer_D: q.answer_D,
                    Correct_answer: q.correct_answer,
                    Explanation: q.explanation,
                    audio_url: q.audio_url,
                }));
                if (isMounted) {
                    setQuizExercises(mapped);
                    setCurrentQuizIdx(0);
                }
            } catch {
                if (isMounted) setQuizExercises([]);
            } finally {
                if (isMounted) setIsLoadingQuiz(false);
            }
        };
        fetchExercises();
        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // --- STEP 3: Video Grammar States ---
    const [grammarVideo, setGrammarVideo] = useState<LessonVideo | null>(null);
    const [grammarVideoLoading, setGrammarVideoLoading] = useState(false);
    const [grammarSubtitles, setGrammarSubtitles] = useState<SubtitleItem[]>([]);
    const [grammarVideoTime, setGrammarVideoTime] = useState(0);

    useEffect(() => {
        if (currentStep !== "learn-video-grammar" || !currentLesson?.id) return;
        let isMounted = true;
        setGrammarVideoLoading(true);

        (async () => {
            try {
                const vid = await coursesApi.getLessonVideo(currentLesson.id);
                if (isMounted) setGrammarVideo(vid);

                const subContent = (vid as any)?.subtitle_content;
                if (subContent) {
                    const parsed = parseSRTtoArray(subContent);
                    if (isMounted) {
                        setGrammarSubtitles(
                            parsed.map((s) => ({
                                start: srtTimeToSeconds(s.start),
                                end: srtTimeToSeconds(s.end),
                                chinese: s.chinese,
                                vietnamese: s.vietnamese,
                                pinyin: s.pinyin,
                                rawText: s.rawText,
                            }))
                        );
                    }
                } else if (isMounted) {
                    setGrammarSubtitles([]);
                }
            } catch {
                if (isMounted) {
                    setGrammarVideo(null);
                    setGrammarSubtitles([]);
                }
            } finally {
                if (isMounted) setGrammarVideoLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // --- STEP 5: Dictation States ---
    const [dictationSentences, setDictationSentences] = useState<any[]>([]);
    const [dictationLoading, setDictationLoading] = useState(false);

    useEffect(() => {
        if (currentStep !== "learn-dictation" || !currentLesson?.id) return;
        let isMounted = true;
        setDictationLoading(true);

        (async () => {
            try {
                const s = await coursesApi.getLessonDictation(currentLesson.id);
                if (isMounted) setDictationSentences(s);
            } catch {
                if (isMounted) setDictationSentences([]);
            } finally {
                if (isMounted) setDictationLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // --- STEP 6: Conversation Shadowing States ---
    const [lessonDialogues, setLessonDialogues] = useState<any[]>([]);

    useEffect(() => {
        if (currentStep !== "learn-conversation") return;
        let isMounted = true;
        (async () => {
            try {
                const lessonId = currentLesson?.id;
                if (!lessonId) {
                    if (isMounted) setLessonDialogues([]);
                    return;
                }
                const items = await coursesApi.getLessonDialogues(lessonId);
                if (isMounted) setLessonDialogues(items);
            } catch {
                if (isMounted) setLessonDialogues([]);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    const conversationHook = useConversationDetail(
        courseId || "1",
        lessonDialogues.length ? lessonDialogues : undefined
    );
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

    useEffect(() => {
        if (convEndRef.current) {
            convEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [convVisibleMessages.length]);

    // --- STEP 7: Lesson Extra States ---
    const [lessonExtra, setLessonExtra] = useState<LessonExtra | null>(null);

    useEffect(() => {
        if (currentStep !== "learn-extra" || !currentLesson?.id) return;
        let isMounted = true;
        (async () => {
            try {
                const ex = await coursesApi.getLessonExtra(currentLesson.id);
                if (isMounted) setLessonExtra(ex);
            } catch {
                if (isMounted) setLessonExtra(null);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [currentStep, currentLesson?.id]);

    // Word popup lookup
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [wordInfo, setWordInfo] = useState<any>(null);
    const [isTranslating] = useState(false);

    // --- Premium gate: Free chỉ được làm FREE_EXERCISE_LIMIT bài tập (đếm khi HOÀN THÀNH — mirror mobile) ---
    const { isPremium, isLoading: premiumLoading } = usePremium();
    const [gateDismissedFor, setGateDismissedFor] = useState<string | null>(null);
    const [completedCount, setCompletedCount] = useState(() => getCompletedExerciseCount());

    const currentLessonId = currentLesson?.id != null ? String(currentLesson.id) : null;
    const isExerciseStep =
        currentLesson?.lesson_type != null &&
        EXERCISE_LESSON_TYPES.has(String(currentLesson.lesson_type));

    // Free hoàn thành 1 bài → tăng bộ đếm (mirror mobile exerciseStorage)
    const handleExerciseComplete = () => {
        if (isPremium) return;
        setCompletedCount(incrementCompletedExerciseCount());
    };

    // Derived: bài hiện tại có bị khóa theo hạn mức Free không
    const exerciseBlocked =
        !premiumLoading &&
        isExerciseStep &&
        !isPremium &&
        completedCount >= FREE_EXERCISE_LIMIT;

    // Render the main learn content based on lesson status, loading states, and active steps
    const renderMainContent = () => {
        if (!currentLesson) {
            return (
                <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-2xs dark:bg-zinc-900 dark:border-zinc-800">
                    <p className="text-sm font-black text-zinc-600 dark:text-zinc-300">
                        Khóa học chưa có bài học nào.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-zinc-400">
                        Hãy quay lại trang khóa học và chọn một bài học khác.
                    </p>
                    <Button
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="mt-6 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                    >
                        Về khóa học
                    </Button>
                </div>
            );
        }

        if (exerciseBlocked) {
            return (
                <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl border border-amber-200 p-12 text-center shadow-2xs dark:bg-zinc-900 dark:border-amber-900/40">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                        <Lock className="size-6 text-white" />
                    </div>
                    <p className="mt-4 text-sm font-black text-zinc-900 dark:text-white">
                        Bạn đã hết lượt bài tập miễn phí
                    </p>
                    <p className="mt-2 text-xs font-semibold text-zinc-400 leading-relaxed">
                        Gói Free được thử tối đa {FREE_EXERCISE_LIMIT} bài tập. Nâng cấp Premium để luyện tập không giới hạn.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Button
                            onClick={() => router.push("/pricing")}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold"
                        >
                            Nâng cấp Premium
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/courses/${courseId}`)}
                            className="text-xs font-bold"
                        >
                            Về khóa học
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <>
                {/* STEP 1: Video Từ Vựng (learn-video-vocab) */}
                {currentStep === "learn-video-vocab" && (
                    <VideoVocabStep
                        videoSource={lessonVideo?.video_url || null}
                        videoLoading={videoVocabLoading}
                        subtitles={videoVocabSubtitles}
                        currentTime={videoVocabTime}
                        onTimeUpdate={setVideoVocabTime}
                        vocabItems={vocabItems}
                        vocabLoading={vocabLoading}
                        selectedVocabIdx={selectedVocabIdx}
                        onSelectVocab={setSelectedVocabIdx}
                    />
                )}

                {/* STEP 1.5: Lý thuyết: Giải nghĩa từ vựng (learn-vocab-theory) */}
                {currentStep === "learn-vocab-theory" && (
                    <VocabTheoryStep
                        vocabItems={vocabTheoryItems}
                        vocabLoading={vocabTheoryLoading}
                        theory={lessonTheory}
                        theoryLoading={lessonTheoryLoading}
                    />
                )}

                {/* STEP 2: Trắc nghiệm từ vựng (learn-quiz-vocab) */}
                {currentStep === "learn-quiz-vocab" && (
                    <QuizStep
                        exercises={quizExercises}
                        loading={isLoadingQuiz}
                        currentIndex={currentQuizIdx}
                        onIndexChange={setCurrentQuizIdx}
                        onComplete={handleExerciseComplete}
                    />
                )}

                {/* STEP 3: Video ngữ pháp (learn-video-grammar) */}
                {currentStep === "learn-video-grammar" && (
                    <VideoGrammarStep
                        videoSource={grammarVideo?.video_url || null}
                        videoLoading={grammarVideoLoading}
                        subtitles={grammarSubtitles}
                        currentTime={grammarVideoTime}
                        onTimeUpdate={setGrammarVideoTime}
                    />
                )}

                {/* STEP 4: Bài tập ngữ pháp (learn-quiz-grammar) */}
                {currentStep === "learn-quiz-grammar" && (
                    <QuizStep
                        exercises={quizExercises}
                        loading={isLoadingQuiz}
                        currentIndex={currentQuizIdx}
                        onIndexChange={setCurrentQuizIdx}
                        onComplete={handleExerciseComplete}
                    />
                )}

                {/* STEP 5: Bài tập Nghe chép chính tả (learn-dictation) */}
                {currentStep === "learn-dictation" && (
                    <DictationStep
                        sentences={dictationSentences}
                        loading={dictationLoading}
                        onComplete={handleExerciseComplete}
                    />
                )}

                {/* STEP 6: Thực hành hội thoại (learn-conversation) */}
                {currentStep === "learn-conversation" && (
                    <ConversationStep
                        loading={convLoading}
                        visibleMessages={convVisibleMessages}
                        hasMoreMessages={convHasMoreMessages}
                        activeRecordingId={activeRecordingId}
                        onSpeak={handleConvSpeak}
                        onToggleRecording={(id) => handleConvToggleRecording(String(id))}
                        onContinue={handleConvContinue}
                        convEndRef={convEndRef}
                    />
                )}

                {/* STEP 7: Bài tập bổ sung (learn-extra) */}
                {currentStep === "learn-extra" && (
                    <ExtraLessonStep
                        lessonExtra={lessonExtra}
                        onBackToCourse={() => router.push(`/courses/${courseId}`)}
                    />
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans dark:bg-zinc-950">
            {/* Header & Navigation */}
            <LearnHeader courseId={courseId} courseTitle={courseTitle} />

            {/* Main Content Body */}
            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col items-center">
                {renderMainContent()}

                {/* PremiumGate cho bài tập vượt hạn mức Free */}
                <PremiumGate
                    isOpen={exerciseBlocked && gateDismissedFor !== currentLessonId}
                    onClose={() => setGateDismissedFor(currentLessonId)}
                    feature="bài tập luyện tập"
                    description={`Gói Free chỉ gồm ${FREE_EXERCISE_LIMIT} bài tập thử nghiệm. Nâng cấp Premium để mở khóa toàn bộ bài tập, nghe chép chính tả và luyện hội thoại không giới hạn.`}
                />

                {/* WordInfoModal for translations and flashcard saves */}
                {selectedWord && (
                    <WordInfoModal
                        isVisible={Boolean(selectedWord)}
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

export default function LearnRoomPage({
    params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
    const unwrappedParams = use(params);

    return (
        <Suspense
            fallback={
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
                </div>
            }
        >
            <LearnRoomContent params={unwrappedParams} />
        </Suspense>
    );
}
