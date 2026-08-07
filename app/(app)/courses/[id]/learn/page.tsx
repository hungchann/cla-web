"use client";

import Image from "next/image";
import { use, useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import HighlightedText from "@/components/HighlightedText";
import { coursesApi } from "@/api/courses";
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
  "learn-quiz-vocab": "quiz_vocab",
  "learn-video-grammar": "video_grammar",
  "learn-quiz-grammar": "quiz_grammar",
  "learn-dictation": "dictation",
  "learn-conversation": "conversation",
  "learn-reading": "reading",
  "learn-extra": "extra",
};

const LEARN_TO_STEP_TYPE: Record<string, string> = {
  "video_vocab": "learn-video-vocab",
  "quiz_vocab": "learn-quiz-vocab",
  "video_grammar": "learn-video-grammar",
  "quiz_grammar": "learn-quiz-grammar",
  "dictation": "learn-dictation",
  "conversation": "learn-conversation",
  "reading": "learn-reading",
  "extra": "learn-extra",
};

const MOCK_GRAMMAR_SRT = `1
00:00:01,000 --> 00:00:05,000
你好
ní hǎo
Chào bạn (Cụm từ chào hỏi cơ bản nhất trong tiếng Trung).

2
00:00:06,000 --> 00:00:11,000
谢谢
xièxie
Cảm ơn (Cách bày tỏ lòng biết ơn thông dụng).

3
00:00:12,000 --> 00:00:18,000
语法：Biến điệu thanh 3
yǔfǎ: biàndiào thanh 3
Khi hai âm tiết mang thanh 3 đi liền nhau, âm thứ nhất biến thành thanh 2 (ní hǎo).
`;

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
    senses?: VocabSense[];
};

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
            try {
                if (lessonParam) {
                    const lesson = await coursesApi.getCourseLessonById(lessonParam);
                    if (isMounted) setCurrentLesson(lesson);
                    return;
                }
                if (stepParam) {
                    const chapters = await coursesApi.getCourseChapters(courseId);
                    if (!isMounted) return;
                    const match = chapters
                      .flatMap((c) => c.lessons || [])
                      .find((l) => l.lesson_type === fallbackType);
                    if (isMounted) setCurrentLesson(match || null);
                    return;
                }
                const chapters = await coursesApi.getCourseChapters(courseId);
                if (!isMounted) return;
                const firstLesson = chapters.flatMap((c) => c.lessons || [])[0];
                if (isMounted) setCurrentLesson(firstLesson || null);
            } catch (err) {
                if (isMounted) setCurrentLesson(null);
            }
        };
        fetchLesson();
        return () => { isMounted = false; };
    }, [courseId, lessonParam, stepParam, fallbackType]);

    const currentStep = currentLesson?.lesson_type
        ? LEARN_TO_STEP_TYPE[currentLesson.lesson_type] || `learn-${currentLesson.lesson_type}`
        : `learn-${fallbackType}`;

    useEffect(() => {
        if (currentLesson?.lesson_type === "reading" && currentLesson.resource_id) {
            router.replace(`/bilingual/${currentLesson.resource_id}`);
        }
    }, [currentLesson, router]);

    // Dynamic Quiz Exercises state (vocab + grammar quiz from link_exercise)
    const [quizExercises, setQuizExercises] = useState<any[]>([]);
    const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

    // Dynamic Conversation Shadowing hook
    const conversationId =
        currentLesson?.lesson_type === "conversation" && currentLesson.resource_id
            ? String(currentLesson.resource_id)
            : courseId || "1";
    const conversationHook = useConversationDetail(conversationId);
    const {
        items: convMessages,
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
        if (!isQuiz || !currentLesson?.resource_id || currentLesson.resource_collection !== "link_exercise") return;
        if (quizExercises.length > 0) return;

        const fetchExercises = async () => {
            setIsLoadingQuiz(true);
            try {
                const { default: api } = await import("@/api/authConfig");
                const r = await api.get(`/items/exercises?filter[link_exercise_id][_eq]=${currentLesson.resource_id}&sort=sort&fields=id,sort,question,answer_A,answer_B,answer_C,answer_D,Correct_answer,Explanation`);
                setQuizExercises(r.data?.data || []);
                setCurrentQuizIdx(0);
            } catch (e) {
                setQuizExercises([]);
            } finally {
                setIsLoadingQuiz(false);
            }
        };
        fetchExercises();
    }, [currentStep, currentLesson?.resource_id, currentLesson?.resource_collection, quizExercises.length]);



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

    const handleSetView = (newStep: string) => {
        if (newStep === "home") {
            router.push("/dashboard");
        } else if (newStep === "courses") {
            router.push("/courses");
        } else if (newStep === "bilingual-list") {
            router.push("/bilingual");
        } else if (newStep === "flashcard") {
            router.push("/flashcard");
        } else if (newStep.startsWith("learn")) {
            if (newStep === "learn-reading") {
                if (currentLesson?.resource_id) {
                    router.push(`/bilingual/${currentLesson.resource_id}`);
                }
                return;
            }
            const lessonType = STEP_TYPE_TO_LEARN[newStep] || newStep.replace(/^learn-/, "");
            if (currentLesson && currentLesson.lesson_type === lessonType) {
                router.push(`/courses/${courseId}/learn?lesson=${currentLesson.id}`);
                return;
            }
            coursesApi
              .getCourseChapters(courseId)
              .then((chapters) => {
                const match = chapters
                  .flatMap((c) => c.lessons || [])
                  .find((l) => l.lesson_type === lessonType);
                if (match) {
                  router.push(`/courses/${courseId}/learn?lesson=${match.id}`);
                } else {
                  router.push(`/courses/${courseId}/learn?step=${newStep}`);
                }
              })
              .catch(() => router.push(`/courses/${courseId}/learn?step=${newStep}`));
        }
    };

    // --- Vocab data (Video Vocab step): đọc từ DB theo resource_id ---
    const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
    const [vocabLoading, setVocabLoading] = useState(false);
    const [selectedVocabIdx, setSelectedVocabIdx] = useState(0);
    const currentVocab = vocabItems[selectedVocabIdx] || null;

    // --- Voice Recording States (Video Vocab step) ---
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
        } catch (err) {
            console.error("Lỗi tải bộ flashcard:", err);
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
        } catch (err) {
            console.error("Lỗi lưu từ vựng:", err);
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
        } catch (err) {
            console.error("Lỗi tạo bộ và lưu từ:", err);
            setSaveMessage({ type: "error", text: "Thất bại." });
        } finally {
            setSavingVocab(false);
        }
    };

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

    // Bắt đầu ghi âm thật (MediaRecorder) trước khi chuyển UI sang trạng thái "recording"
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

    // Reset recorder khi bấm "Ghi lại"
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

    // Khi trạng thái chuyển sang "done": dừng ghi âm, gửi server transcribe rồi chấm điểm thật
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
            } catch (err) {
                console.warn("Lỗi ghi âm/phân tích phát âm:", err);
                if (cancelled) return;
                setPronounceError("Không thể ghi âm/phân tích, hãy thử lại.");
            } finally {
                if (!cancelled) setPronounceProcessing(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [recordState]);

    // Dọn dẹp recorder khi rời trang
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

    // --- Grammar Video and Subtitle States ---
    const [grammarCurrentTime, setGrammarCurrentTime] = useState(0);
    const [grammarSubtitles, setGrammarSubtitles] = useState<any[]>([]);
    const [grammarVideoSource, setGrammarVideoSource] = useState<string | null>(null);
    const [grammarVideoLoading, setGrammarVideoLoading] = useState(false);
    const grammarVideoRef = useRef<HTMLVideoElement | null>(null);
    const grammarSubtitleContainerRef = useRef<HTMLDivElement>(null);

    // --- Video từ vựng (STEP 1): load video thật từ video_section ---
    const [videoVocabSource, setVideoVocabSource] = useState<string | null>(null);
    const [videoVocabLoading, setVideoVocabLoading] = useState(false);
    const vocabVideoRef = useRef<HTMLVideoElement | null>(null);

    // Word translation states (for WordInfoModal)
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [wordInfo, setWordInfo] = useState<any>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleWordPress = async (word: string) => {
        speakChinese(word);
        setSelectedWord(word);
        setWordInfo(null);
        setIsTranslating(true);
        try {
            const { translateWord } = await import("@/api/apiService");
            const res = await translateWord(word);
            const translated = res?.[0];
            if (translated) {
                setWordInfo({
                    word: translated.word || word,
                    pinyin: translated.pinyin || "N/A",
                    meanings: translated.meaning || translated.meanings || "Không tìm thấy nghĩa.",
                    traditional: translated.traditional || "",
                    simplified: translated.simplified || translated.word || word,
                    classifiers: translated.classifiers || [],
                });
            }
        } catch (err) {
            console.warn("API translate failed for course word:", err);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleGrammarTimeUpdate = () => {
        if (grammarVideoRef.current) {
            setGrammarCurrentTime(grammarVideoRef.current.currentTime);
        }
    };

    const timeToSeconds = (timeStr: string): number => {
        if (!timeStr) return 0;
        const parts = timeStr.split(":");
        const hours = Number(parts[0]) || 0;
        const minutes = Number(parts[1]) || 0;
        const secParts = parts[2]?.replace(",", ".") || "0";
        const seconds = Number(secParts) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    };

    // Find active grammar subtitle
    const activeGrammarSub = grammarSubtitles.find((st) => {
        const s = timeToSeconds(String(st.start));
        const e = timeToSeconds(String(st.end));
        return grammarCurrentTime >= s && grammarCurrentTime <= e;
    });

    const activeGrammarSubIndex = grammarSubtitles.findIndex(
        (sub) => sub.id === activeGrammarSub?.id
    );

    // Load grammar video & subtitles
    useEffect(() => {
        let cancelled = false;
        const loadGrammarVideo = async () => {
            try {
                const { bilingualApi } = await import("@/api/bilingual");
                const videosList = await bilingualApi.getVideoSection();
                let found = null;

                // Ưu tiên lấy video theo resource_id trong lesson
                if (currentLesson?.resource_id) {
                    found = videosList.find(
                        (v) => String(v.id) === String(currentLesson.resource_id),
                    ) || null;
                }
                // Fallback: tìm video ngữ pháp theo tiêu đề/genre nếu không có resource_id
                if (!found) {
                    found = videosList.find(v => {
                        const titleLower = v.title?.toLowerCase() || "";
                        const genreLower = (v as any).genre_id?.title?.toLowerCase() || "";
                        return titleLower.includes("ngữ pháp") || genreLower.includes("ngữ pháp") || genreLower.includes("grammar") || titleLower.includes("grammar");
                    }) || null;
                }

                if (!cancelled) {
                    setGrammarVideoSource(
                        found?.video_file?.filename_disk
                            ? `${ASSET_URL}/${found.video_file.filename_disk}`
                            : null,
                    );
                }

                if (found && found.srt_file?.filename_disk) {
                    const srtUrl = `${ASSET_URL}/${found.srt_file.filename_disk}`;
                    const res = await fetch(srtUrl);
                    const srtText = await res.text();
                    const { parseSRTtoArray } = await import("@/services/subtitle");
                    const parsed = parseSRTtoArray(srtText);
                    if (!cancelled) setGrammarSubtitles(parsed.map(item => ({
                        ...item,
                        segmentedWords: item.chinese ? item.chinese.split("").map(char => ({ word: char, pinyin: "" })) : []
                    })));
                } else if (!cancelled) {
                    const { parseSRTtoArray } = await import("@/services/subtitle");
                    const parsed = parseSRTtoArray(MOCK_GRAMMAR_SRT);
                    setGrammarSubtitles(parsed.map(item => ({
                        ...item,
                        segmentedWords: item.chinese ? item.chinese.split("").map(char => ({ word: char, pinyin: "" })) : []
                    })));
                }
            } catch (err) {
                console.warn("Lỗi tải video/phụ đề ngữ pháp:", err);
                if (!cancelled) setGrammarVideoSource(null);
                try {
                    const { parseSRTtoArray } = await import("@/services/subtitle");
                    const parsed = parseSRTtoArray(MOCK_GRAMMAR_SRT);
                    if (!cancelled) setGrammarSubtitles(parsed.map(item => ({
                        ...item,
                        segmentedWords: item.chinese ? item.chinese.split("").map(char => ({ word: char, pinyin: "" })) : []
                    })));
                } catch { }
            } finally {
                if (!cancelled) setGrammarVideoLoading(false);
            }
        };

        if (currentStep === "learn-video-grammar") {
            setGrammarVideoLoading(true);
            loadGrammarVideo();
        }
        return () => {
            cancelled = true;
        };
    }, [currentStep, currentLesson?.resource_id]);

    // Load video thật của bài video_vocab (theo resource_id trong lesson)
    useEffect(() => {
        let cancelled = false;
        const loadVocabVideo = async () => {
            if (currentLesson?.lesson_type !== "video_vocab" || !currentLesson.resource_id) {
                if (!cancelled) setVideoVocabSource(null);
                return;
            }
            if (!cancelled) setVideoVocabLoading(true);
            try {
                const { bilingualApi } = await import("@/api/bilingual");
                const videosList = await bilingualApi.getVideoSection();
                const found = videosList.find(
                    (v) => String(v.id) === String(currentLesson.resource_id),
                );
                if (!cancelled) {
                    setVideoVocabSource(
                        found?.video_file?.filename_disk
                            ? `${ASSET_URL}/${found.video_file.filename_disk}`
                            : null,
                    );
                }
            } catch (err) {
                console.warn("Lỗi tải video từ vựng:", err);
                if (!cancelled) setVideoVocabSource(null);
            } finally {
                if (!cancelled) setVideoVocabLoading(false);
            }
        };
        loadVocabVideo();
        return () => {
            cancelled = true;
        };
    }, [currentLesson?.lesson_type, currentLesson?.resource_id]);

    // Tải từ vựng của bài video_vocab theo resource_id
    useEffect(() => {
        let cancelled = false;
        const loadVocab = async () => {
            if (currentStep !== "learn-video-vocab" || !currentLesson?.resource_id) {
                if (!cancelled) setVocabItems([]);
                return;
            }
            if (!cancelled) setVocabLoading(true);
            try {
                const { getVocabularyByIdSection } = await import("@/api/apiService");
                const res = await getVocabularyByIdSection(String(currentLesson.resource_id));
                const list: VocabItem[] = res?.data?.vocabulary || [];
                if (!cancelled) {
                    setVocabItems(list);
                    setSelectedVocabIdx(0);
                }
            } catch (err) {
                console.warn("Lỗi tải từ vựng bài học:", err);
                if (!cancelled) setVocabItems([]);
            } finally {
                if (!cancelled) setVocabLoading(false);
            }
        };
        loadVocab();
        return () => {
            cancelled = true;
        };
    }, [currentStep, currentLesson?.resource_id]);

    // Scroll to active grammar subtitle
    useEffect(() => {
        if (activeGrammarSubIndex !== -1 && grammarSubtitleContainerRef.current) {
            const activeEl = grammarSubtitleContainerRef.current.children[activeGrammarSubIndex] as HTMLElement;
            if (activeEl) {
                grammarSubtitleContainerRef.current.scrollTo({
                    top: activeEl.offsetTop - 80,
                    behavior: "smooth",
                });
            }
        }
    }, [activeGrammarSubIndex]);

    // --- Dictation states ---
    const [dictationInput, setDictationInput] = useState("");
    const [dictationChecked, setDictationChecked] = useState(false);
    const [dictationScore, setDictationScore] = useState<number | null>(null);
    const dictationExpected = currentLesson?.content || "你好";
    const dictationAudioUrl = currentLesson?.resource_id
        ? `${ASSET_URL}/${currentLesson.resource_id}`
        : null;

    const handleCheckDictation = () => {
        setDictationChecked(true);
        const expected = dictationExpected.trim().toLowerCase();
        const clean = dictationInput.trim().toLowerCase();
        if (expected && clean === expected) {
            setDictationScore(100);
        } else if (expected && clean.includes(expected.slice(0, 2))) {
            setDictationScore(85);
        } else if (clean.length > 0) {
            setDictationScore(45);
        } else {
            setDictationScore(0);
        }
    };

    const resetDictation = () => {
        setDictationInput("");
        setDictationChecked(false);
        setDictationScore(null);
    };

    return (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in">

            {/* Study breadcrumbs */}
            <div className="bg-amber-50/40 border-b border-gray-100 px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
                <div className="space-y-0.5">
                    <h2 className="text-[13px] md:text-sm font-bold text-gray-700 tracking-tight leading-none">
                        {courseTitle}
                    </h2>
                    <p className="text-[11px] md:text-xs text-gray-400 font-bold">
                        {currentLesson?.title || "Đang tải bài học..."}
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/courses/${courseId}`)}
                    className="text-xs bg-white text-gray-600 hover:text-amber-500 font-bold border border-gray-200 px-3.5 py-1.5 rounded-full transition-all active:scale-95 shadow-2xs cursor-pointer"
                >
                    &larr; Lộ trình học
                </button>
            </div>

            {/* Study Area content */}
            <div className="p-6 md:p-8 max-w-4xl w-full mx-auto flex-1 flex flex-col justify-start">

                {/* STEP 1: Video từ vựng (learn-video-vocab) */}
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
                                                            <Folder className="w-4 h-4 text-amber-500" /> {deck.title}
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
                        </div>

                                    {recordState === "idle" && (
                                        <span className="text-xs text-gray-400 font-bold">
                                            Nhấn nút đỏ để bắt đầu ghi âm phát âm của bạn
                                        </span>
                                    )}

                                <div className="flex justify-end pt-2 border-t border-gray-50">
                                    <button
                                        onClick={() => handleSetView("learn-quiz-vocab")}
                                        className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        Phần tiếp <span className="text-base font-normal">&rarr;</span>
                                    </button>
                                </div>
                            </div>
                            )}
                        </div>
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
                                    <button
                                        onClick={() => handleSetView("learn-video-grammar")}
                                        className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        Phần tiếp <span className="text-base font-normal">&rarr;</span>
                                    </button>
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
                                    <li>Phần này trong câu hỏi trắc nghiệm có thể kèm audio hoặc không.</li>
                                    <li>Chọn xong sẽ hiện đáp án và giải thích luôn.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Video ngữ pháp (learn-video-grammar) */}
                {currentStep === "learn-video-grammar" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                        <div className="lg:col-span-2 space-y-6">
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
                                    Giải thích chi tiết (Đang nói)
                                </h4>
                                <div className="space-y-3.5 text-xs text-gray-700 font-semibold leading-relaxed">
                                    {activeGrammarSub ? (
                                        <div>
                                            <p className="text-sm font-bold text-zinc-800 dark:text-white mb-2">
                                                Chữ Hán: {activeGrammarSub.chinese} {activeGrammarSub.pinyin && `(${activeGrammarSub.pinyin})`}
                                            </p>
                                            <p className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border-l-4 border-amber-400 font-medium">
                                                {activeGrammarSub.vietnamese}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-400 italic">
                                            Phát video để xem giải thích ngữ pháp tương ứng theo thời gian thực. Bạn cũng có thể click vào các chữ Hán trong phụ đề bên phải để tra nghĩa và lưu vào Flashcard.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => handleSetView("learn-quiz-grammar")}
                                    className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors cursor-pointer border-none bg-transparent"
                                >
                                    Phần tiếp <span className="text-base font-normal">&rarr;</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col h-[400px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                    Phụ đề ngữ pháp (SRT)
                                </h2>
                                <div
                                    ref={grammarSubtitleContainerRef}
                                    className="flex-1 overflow-y-auto mt-2 pr-1 scrollbar-thin flex flex-col gap-2"
                                >
                                    {grammarSubtitles.length === 0 ? (
                                        <div className="text-center text-zinc-400 text-xs py-10">Đang tải phụ đề ngữ pháp...</div>
                                    ) : (
                                        grammarSubtitles.map((sub, index) => {
                                            const isActive = activeGrammarSubIndex === index;
                                            return (
                                                <div
                                                    key={sub.id || index}
                                                    onClick={() => {
                                                        if (grammarVideoRef.current) {
                                                            grammarVideoRef.current.currentTime = timeToSeconds(sub.start);
                                                            grammarVideoRef.current.play().catch(() => { });
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${isActive
                                                        ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/10"
                                                        : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-850 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                                                        }`}
                                                >
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                        {sub.segmentedWords?.map((w: any, wi: number) => (
                                                            <span
                                                                key={wi}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleWordPress(w.word);
                                                                }}
                                                                className={`text-sm font-bold hover:underline hover:text-amber-500 cursor-pointer ${isActive ? "text-white hover:text-amber-200" : "text-zinc-800 dark:text-white"
                                                                    }`}
                                                            >
                                                                {w.word}
                                                            </span>
                                                        ))}
                                                        {sub.pinyin && (
                                                            <span className={`text-[10px] ml-1 opacity-80 ${isActive ? "text-amber-100" : "text-amber-600"}`}>
                                                                ({sub.pinyin})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs leading-relaxed font-semibold ${isActive ? "text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
                                                        {sub.vietnamese}
                                                    </p>
                                                </div>
                                            );
                                        })
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
                                        <button
                                            onClick={() => handleSetView("learn-dictation")}
                                            className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            Phần tiếp <span className="text-base font-normal">&rarr;</span>
                                        </button>
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
                                <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                                    {dictationAudioUrl ? (
                                        <audio src={dictationAudioUrl} controls preload="metadata" className="w-full h-10" />
                                    ) : (
                                        <button
                                            onClick={() => speakChinese(dictationExpected)}
                                            className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </button>
                                    )}

                                    {dictationAudioUrl && (
                                        <div className="text-amber-500 text-lg animate-pulse">🔊</div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-extrabold text-gray-900 text-sm">
                                        Chép câu mà bạn nghe được:
                                    </h4>

                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={dictationInput}
                                            onChange={(e) => setDictationInput(e.target.value)}
                                            placeholder={`Gợi ý: nhập '${dictationExpected}' để chấm điểm`}
                                            disabled={dictationChecked}
                                            className="w-full bg-transparent border-b-2 border-dashed border-amber-300 focus:border-amber-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-0 py-2 text-sm text-gray-800 font-bold placeholder-gray-400 transition-all font-mono"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            onClick={handleCheckDictation}
                                            disabled={dictationChecked}
                                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-5 rounded-full text-xs shadow-xs transition-colors cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 shrink-0"
                                        >
                                            Kiểm tra
                                        </Button>
                                        {dictationChecked && (
                                            <button
                                                onClick={resetDictation}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-6 py-2 rounded-full text-xs shadow-xs transition-colors cursor-pointer active:scale-95 shrink-0"
                                            >
                                                Luyện lại
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {dictationChecked && dictationScore !== null && (
                                    <div className="p-5 bg-white border border-amber-200 rounded-xl shadow-2xs space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Target className="w-8 h-8 text-amber-500" />
                                            <div>
                                                <h5 className="font-extrabold text-amber-700 text-sm">
                                                    Đúng {dictationScore}%
                                                </h5>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                    Đáp án chuẩn: &quot;{dictationExpected}&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-2 border-t border-gray-50">
                                    <button
                                        onClick={() => handleSetView("learn-conversation")}
                                        className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        Phần tiếp <span className="text-base font-normal">&rarr;</span>
                                    </button>
                                </div>
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

                            <button
                                onClick={() => handleSetView("learn-extra")}
                                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                            >
                                Phần tiếp <span className="text-base font-normal">&rarr;</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 7: Bài tập bổ sung (learn-extra) */}
                {currentStep === "learn-extra" && (
                    <div className="flex flex-col items-center justify-start w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl items-center">

                            {/* Left side: Dashed bordered container with 3 download items */}
                            <div className="md:col-span-2 bg-white rounded-2xl border-2 border-dashed border-orange-200 p-8 shadow-xs w-full">
                                <div className="flex items-center justify-around gap-6">
                                    {/* PDF 1 */}
                                    {currentLesson?.extra_pdf_id ? (
                                        <a
                                            href={`${ASSET_URL}/${currentLesson.extra_pdf_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                        >
                                            <div className="w-14 h-18 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative">
                                                <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                                                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                    <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">Bài tập</span>
                                        </a>
                                    ) : (
                                        <div className="text-xs text-zinc-400 italic">Chưa có file bài tập</div>
                                    )}

                                    {/* PDF 2 */}
                                    {currentLesson?.extra_answer_id ? (
                                        <a
                                            href={`${ASSET_URL}/${currentLesson.extra_answer_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                        >
                                            <div className="w-14 h-18 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative">
                                                <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                                                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                    <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">Đáp án</span>
                                        </a>
                                    ) : (
                                        <div className="text-xs text-zinc-400 italic">Chưa có file đáp án</div>
                                    )}

                                    {/* Audio */}
                                    {currentLesson?.extra_audio_id ? (
                                        <a
                                            href={`${ASSET_URL}/${currentLesson.extra_audio_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                                        >
                                            <div className="w-14 h-18 bg-orange-50 border border-orange-200 rounded-lg flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-500">
                                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">Audio</span>
                                        </a>
                                    ) : (
                                        <div className="text-xs text-zinc-400 italic">Chưa có audio</div>
                                    )}
                                </div>
                            </div>

                            {/* Right side: Helper Text "Đây là 3 file để..." */}
                            <div className="md:col-span-1 text-sm font-bold text-gray-700 leading-relaxed space-y-2 p-2">
                                <div className="flex items-center gap-1.5 text-amber-600 text-lg">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="font-semibold text-gray-600">
                                    Đây là 3 file để người học tải về để ôn tập thêm
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between w-full pt-6 border-t border-gray-150 mt-8 max-w-3xl">
                            <button
                                onClick={() => handleSetView("learn-conversation")}
                                className="text-xs font-black text-gray-500 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                &larr; Phần trước
                            </button>
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
