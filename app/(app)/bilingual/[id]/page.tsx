"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { translateWord, getVocabularyByIdSection } from "@/api/apiService";
import { segmentChineseText as apiSegmentChineseText } from "@/api/segment";
import { isAIConsentRequiredError } from "@/services/aiConsentErrors";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { parseSRTtoArray } from "@/services/subtitle";
import { speakChinese } from "@/lib/utils/speech";
import { getAssetUrl } from "@/lib/utils/assets";
import { BackButton } from "@/components/BackButton";
import { PageContainer } from "@/components/PageContainer";
import { BookmarkPlus, Eye, EyeOff, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useSubtitleSync } from "@/lib/hooks/useSubtitleSync";
import { timeToSeconds } from "@/lib/utils/subtitleUtils";
import { BilingualContent } from "@/components/bilingual/BilingualContent";
import { BilingualVocab } from "@/components/bilingual/BilingualVocab";
import { BilingualGrammar } from "@/components/bilingual/BilingualGrammar";
import { BilingualShadowing } from "@/components/bilingual/BilingualShadowing";
import { BilingualExercise } from "@/components/bilingual/BilingualExercise";

const MOCK_DICTIONARY: Record<string, { pinyin: string; meaning: string }> = {
    "面对": { pinyin: "miànduì", meaning: "Đối mặt, đối diện" },
    "同辈": { pinyin: "tóngbèi", meaning: "Bạn đồng trang lứa" },
    "压力": { pinyin: "yālì", meaning: "Áp lực" },
    "核心": { pinyin: "héxīn", meaning: "Cốt lõi, trọng tâm" },
    "是": { pinyin: "shì", meaning: "Là" },
    "建立": { pinyin: "jiànlì", meaning: "Thiết lập, xây dựng" },
    "自我": { pinyin: "zìwǒ", meaning: "Bản thân, tự mình" },
    "坐标系": { pinyin: "zuòbiāoxì", meaning: "Hệ quy chiếu / hệ tọa độ" },
    "纵向": { pinyin: "zòngxiàng", meaning: "Theo chiều dọc" },
    "横向": { pinyin: "héngxiàng", meaning: "Theo chiều ngang" },
};

const MOCK_SRT_CONTENT: Record<string, string> = {
    "bilingual-pressure": `1
00:00:01,000 --> 00:00:05,000
面对同辈压力，核心是建立自我坐标系。
miànduì tóngbèi yālì, héxīn shì jiànlì zìwǒ zuòbiāoxì.
Đối mặt với áp lực đồng trang lứa, cốt lõi là thiết lập hệ quy chiếu của riêng mình.

2
00:00:06,000 --> 00:00:10,000
管理信息 input、专注纵向成长，而非横向比较。
guǎnlǐ xìnxī input, zhuānzhù zòngxiàng chéngzhǎng, ér fēi héngxiàng bǐjiào.
Quản lý lượng thông tin tiếp nhận, tập trung vào sự phát triển theo chiều dọc của bản thân, thay vì liên tục so sánh theo chiều ngang với người khác.`,
};

export default function BilingualDetailPage({
    params,
}: Readonly<{
    params: Promise<{ id: string }>;
}>) {
    const { id } = use(params);

    const [isOpenPinyin, setIsOpenPinyin] = useState(true);
    const [selectedWord, setSelectedWord] = useState<{ id?: string; word: string; pinyin: string; meaning: string } | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [srtData, setSrtData] = useState<any[]>([]);

    // Tab State
    const [activeTab, setActiveTab] = useState<"content" | "vocab" | "grammar" | "shadowing" | "exercise">("content");
    const [exerciseType, setExerciseType] = useState<"select" | "quiz" | "trans_zh_vi" | "trans_vi_zh">("select");

    // Audio Play & Progress States
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    // Quiz State
    const [quizSelected, setQuizSelected] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Fetch Bilingual Item detail
    const { data: item } = useQuery({
        queryKey: ["bilingual-detail", id],
        queryFn: () => bilingualApi.getBilingualItemById(id),
    });

    // Fetch Vocabulary list for this section
    const { data: vocabResult, isLoading: isVocabLoading } = useQuery({
        queryKey: ["bilingual-vocab", id],
        queryFn: () => getVocabularyByIdSection(id),
    });

    // Fetch Grammar list for this section
    const { data: grammarResult, isLoading: isGrammarLoading } = useQuery({
        queryKey: ["bilingual-grammar", id],
        queryFn: () => bilingualApi.getGrammarById(id),
    });

    // Fetch Exercise list for this section
    const { data: exerciseResult, isLoading: isExerciseLoading } = useQuery({
        queryKey: ["bilingual-exercise", id],
        queryFn: () => bilingualApi.getExerciseById(id),
    });

    const vocabList = vocabResult?.data?.vocabulary || [];
    const grammarList = grammarResult || [];
    const exerciseList = exerciseResult?.exercises || [];

    const { activeIndex, setActiveIndex, binarySearchSubtitle } = useSubtitleSync({
        subtitles: srtData,
        timeToSeconds,
        leadTimeSeconds: 0.1,
    });

    useEffect(() => {
        if (audio && !audio.paused && currentTime > 0) {
            const idx = binarySearchSubtitle(currentTime);
            if (idx !== null && idx !== activeIndex) {
                setActiveIndex(idx);
            }
        }
    }, [currentTime, audio, binarySearchSubtitle, activeIndex, setActiveIndex]);

    const handleReplayLine = (lineItem: any, index: number) => {
        if (lineItem?.start) {
            const targetTime = timeToSeconds(String(lineItem.start));
            if (audio) {
                audio.currentTime = targetTime;
                setCurrentTime(targetTime);
                audio.play().catch((e) => console.log("Play line failed", e));
                setIsPlaying(true);
            } else {
                speakChinese(lineItem.chinese);
            }
            setActiveIndex(index);
        }
    };

    const audioUrl = item?.file_script?.filename_disk
        ? `https://marutek.space/assets/${item.file_script.filename_disk}`
        : null;

    useEffect(() => {
        if (audioUrl) {
            const newAudio = new Audio(audioUrl);
            setAudio(newAudio);

            const handleTimeUpdate = () => setCurrentTime(newAudio.currentTime);
            const handleDurationChange = () => setDuration(newAudio.duration);
            const handleEnded = () => setIsPlaying(false);

            newAudio.addEventListener("timeupdate", handleTimeUpdate);
            newAudio.addEventListener("durationchange", handleDurationChange);
            newAudio.addEventListener("ended", handleEnded);

            return () => {
                newAudio.pause();
                newAudio.removeEventListener("timeupdate", handleTimeUpdate);
                newAudio.removeEventListener("durationchange", handleDurationChange);
                newAudio.removeEventListener("ended", handleEnded);
            };
        }
    }, [audioUrl]);

    const handlePlayPause = () => {
        if (audio) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play().catch(e => console.log("Play failed", e));
                setIsPlaying(true);
            }
        } else {
            // TTS Fallback
            setIsPlaying(!isPlaying);
            if (!isPlaying) {
                const fullText = srtData.map((d) => d.chinese).join(" ");
                speakChinese(fullText);
            } else if (typeof window !== "undefined" && window.speechSynthesis !== undefined) {
                window.speechSynthesis.cancel();
            }
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audio && duration > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };


    useEffect(() => {
        const loadSubtitle = async () => {
            let parsedSubtitles: any[] = [];
            if (item?.SubRip_Subtitle?.filename_disk) {
                try {
                    const srtUrl = `https://marutek.space/assets/${item.SubRip_Subtitle.filename_disk}`;
                    const res = await fetch(srtUrl);
                    const srtText = await res.text();
                    const parsed = parseSRTtoArray(srtText);
                    if (parsed && parsed.length > 0) {
                        parsedSubtitles = parsed;
                    }
                } catch (e) {
                    console.error("Error loading remote subtitle:", e);
                }
            }

            // Fallback sang Mock SRT
            if (parsedSubtitles.length === 0) {
                const mockSrt = MOCK_SRT_CONTENT[id] || MOCK_SRT_CONTENT["bilingual-pressure"] || MOCK_SRT_CONTENT["1"];
                parsedSubtitles = parseSRTtoArray(mockSrt);
            }

            // Phân tách từ Hán ngữ thực thông qua API
            try {
                const chineseTexts = parsedSubtitles.map((p) => p.chinese);
                const segmentResult = await apiSegmentChineseText(chineseTexts);

                const enriched = parsedSubtitles.map((p, idx) => {
                    const apiWords = segmentResult[idx] || [];
                    const segmentedWords = apiWords.map((w: any) => ({
                        word: w.word,
                        pinyin: w.pinyin,
                    }));
                    return {
                        ...p,
                        segmentedWords: segmentedWords.length > 0 ? segmentedWords : segmentChineseTextFallback(p.chinese),
                    };
                });
                setSrtData(enriched);
            } catch (err) {
                if (isAIConsentRequiredError(err)) {
                    console.log("AI consent not granted yet, using local segmentation fallback.");
                } else {
                    console.warn("API segment failed, falling back to local segmentation:", err);
                }
                const enriched = parsedSubtitles.map((p) => ({
                    ...p,
                    segmentedWords: segmentChineseTextFallback(p.chinese),
                }));
                setSrtData(enriched);
            }
        };

        loadSubtitle();
    }, [item, id]);

    // Phân đoạn chữ Hán giả lập sang các từ rời để click
    const segmentChineseTextFallback = (text: string) => {
        const words: { word: string; pinyin: string }[] = [];
        let i = 0;
        while (i < text.length) {
            let matched = false;
            for (let len = 4; len >= 1; len--) {
                if (i + len <= text.length) {
                    const chunk = text.substring(i, i + len);
                    if (MOCK_DICTIONARY[chunk]) {
                        words.push({ word: chunk, pinyin: MOCK_DICTIONARY[chunk].pinyin });
                        i += len;
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                const singleChar = text[i];
                words.push({ word: singleChar, pinyin: "" });
                i++;
            }
        }
        return words;
    };



    const handleWordPress = async (word: string) => {
        speakChinese(word);

        setSelectedWord({ word, pinyin: "Đang tải...", meaning: "Đang dịch nghĩa..." });
        setIsTranslating(true);

        try {
            const res = await translateWord(word);
            const translated = res?.[0];
            if (translated) {
                setSelectedWord({
                    id: translated.id,
                    word: translated.word || word,
                    pinyin: translated.pinyin || "N/A",
                    meaning: translated.meaning || translated.meanings || "Không tìm thấy nghĩa."
                });
            } else {
                setSelectedWord({
                    word,
                    pinyin: "N/A",
                    meaning: "Không tìm thấy nghĩa."
                });
            }
        } catch (err) {
            console.warn("API translate failed, falling back to local dict:", err);
            const dict = MOCK_DICTIONARY[word];
            if (dict) {
                setSelectedWord({ word, pinyin: dict.pinyin, meaning: dict.meaning });
            } else {
                setSelectedWord({ word, pinyin: "Chưa cập nhật", meaning: "Dịch vụ tạm thời không khả dụng." });
            }
        } finally {
            setIsTranslating(false);
        }
    };


    return (
        <>
            <PageContainer maxWidth="narrow" className="gap-6">
                <BackButton href="/bilingual" label="Danh sách bài đọc" />

                {/* Header titles */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-150 dark:border-zinc-800 pb-4 w-full">
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                            {item?.title || "Đang tải..."}
                        </h1>
                        <p className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-500 italic">
                            {item?.title_trans || ""}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsOpenPinyin(!isOpenPinyin)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isOpenPinyin
                                ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-500"
                                : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
                            }`}
                    >
                        {isOpenPinyin ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {isOpenPinyin ? "Ẩn Pinyin" : "Hiện Pinyin"}
                    </button>
                </div>

                {/* Banner Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-xs border border-zinc-200/60 dark:border-zinc-800 h-56 md:h-64 w-full bg-zinc-100 dark:bg-zinc-900 shrink-0">
                    <img
                        src={getAssetUrl(item?.image?.filename_disk) || "/images/study_tablet.png"}
                        alt={item?.title_trans || "Bilingual Study Banner"}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                {/* Audio controller - plays/pauses the audio block */}
                <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center gap-3 w-full shadow-3xs">
                    <div className="flex items-center gap-6 justify-center">
                        <button
                            onClick={() => {
                                if (audio) {
                                    audio.currentTime = Math.max(0, audio.currentTime - 5);
                                    setCurrentTime(audio.currentTime);
                                }
                            }}
                            className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
                            disabled={!audio}
                        >
                            <SkipBack className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all shadow-xs active:scale-95 cursor-pointer font-bold border-none"
                        >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => {
                                if (audio) {
                                    audio.currentTime = Math.min(duration, audio.currentTime + 5);
                                    setCurrentTime(audio.currentTime);
                                }
                            }}
                            className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
                            disabled={!audio}
                        >
                            <SkipForward className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Timeline Progress Bar */}
                    <div className="w-full max-w-md flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none">
                            {formatTime(currentTime)}
                        </span>
                        <div
                            onClick={handleProgressClick}
                            className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full relative cursor-pointer overflow-hidden"
                        >
                            <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none">
                            {formatTime(duration)}
                        </span>
                    </div>

                    {selectedWord && (
                        <div className="mt-4 flex flex-col gap-3 w-full border-t border-zinc-200/80 dark:border-zinc-850 pt-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-amber-650 dark:text-amber-500">
                                    {selectedWord.word}
                                </span>
                                {isTranslating ? (
                                    <span className="inline-block w-4 h-4 border-2 border-zinc-200 border-t-amber-650 rounded-full animate-spin"></span>
                                ) : (
                                    <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                                        {selectedWord.pinyin}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">Ý nghĩa:</h4>
                                <p className="mt-1 text-md font-semibold text-zinc-800 dark:text-zinc-200">
                                    {selectedWord.meaning}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <button
                                    onClick={() => speakChinese(selectedWord.word)}
                                    className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-none cursor-pointer"
                                >
                                    <Volume2 className="h-3.5 w-3.5" />
                                    Nghe lại
                                </button>
                                {selectedWord.id && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await bilingualApi.getVocabularyById(selectedWord.id!);
                                                alert("Đã lưu từ vựng vào sổ tay thành công!");
                                            } catch (e) {
                                                alert("Lưu từ vựng thất bại hoặc từ đã được lưu!");
                                            }
                                        }}
                                        className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 px-3 py-1.5 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border-none cursor-pointer"
                                    >
                                        <BookmarkPlus className="h-3.5 w-3.5" />
                                        Lưu vào sổ tay
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs bar */}
                <div className="border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 md:gap-8 font-extrabold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
                    {[
                        { id: "content", name: "Nội dung" },
                        { id: "vocab", name: "Từ vựng" },
                        { id: "grammar", name: "Ngữ pháp" },
                        { id: "shadowing", name: "Shadowing" },
                        { id: "exercise", name: "Bài tập" },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    setSelectedWord(null);
                                }}
                                className={`pb-2 transition-all cursor-pointer bg-transparent border-none ${
                                    isActive
                                        ? "border-b-2 border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50"
                                        : "hover:text-zinc-600 dark:hover:text-zinc-350"
                                }`}
                            >
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Box */}
                <div className="space-y-6 w-full">

                    {/* 1. Tab content: NỘI DUNG */}
                    {activeTab === "content" && (
                        <BilingualContent
                            srtData={srtData}
                            isOpenPinyin={isOpenPinyin}
                            onWordPress={handleWordPress}
                            onSpeakParagraph={speakChinese}
                            activeIndex={activeIndex}
                            onReplay={handleReplayLine}
                        />
                    )}

                    {/* 2. Tab content: TỪ VỰNG */}
                    {activeTab === "vocab" && (
                        <BilingualVocab
                            vocabList={vocabList}
                            isLoading={isVocabLoading}
                            onWordPress={handleWordPress}
                        />
                    )}

                    {/* 3. Tab content: NGỮ PHÁP */}
                    {activeTab === "grammar" && (
                        <BilingualGrammar
                            grammarList={grammarList}
                            isLoading={isGrammarLoading}
                        />
                    )}

                    {/* 4. Tab content: SHADOWING */}
                    {activeTab === "shadowing" && (
                        <BilingualShadowing
                            srtData={srtData}
                            onSpeakWord={speakChinese}
                        />
                    )}

                    {/* 5. Tab content: BÀI TẬP */}
                    {activeTab === "exercise" && (
                        <BilingualExercise
                            exerciseList={exerciseList}
                            isLoading={isExerciseLoading}
                            srtData={srtData}
                            quizSelected={quizSelected}
                            setQuizSelected={setQuizSelected}
                            currentQuestionIndex={currentQuestionIndex}
                            setCurrentQuestionIndex={setCurrentQuestionIndex}
                            exerciseType={exerciseType}
                            setExerciseType={setExerciseType}
                        />
                    )}
                    {/* Bottom link to go back */}
                    <div className="flex justify-start w-full pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <Link
                            href="/bilingual"
                            className="text-xs font-black text-zinc-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                        >
                            &larr; Quay lại danh sách
                        </Link>
                    </div>

                </div>
            </PageContainer>
            <style jsx global>{`
                .grammar-html-renderer h1,
                .grammar-html-renderer h2,
                .grammar-html-renderer h3,
                .grammar-html-renderer h4 {
                    font-weight: 800;
                    color: #7c2d12;
                    margin-top: 1rem;
                    margin-bottom: 0.4rem;
                }
                .dark .grammar-html-renderer h1,
                .dark .grammar-html-renderer h2,
                .dark .grammar-html-renderer h3,
                .dark .grammar-html-renderer h4 {
                    color: #fdba74;
                }
                .grammar-html-renderer p {
                    margin-bottom: 0.6rem;
                }
                .grammar-html-renderer ul,
                .grammar-html-renderer ol {
                    padding-left: 1.2rem;
                    margin-bottom: 0.75rem;
                    list-style-type: disc;
                }
                .grammar-html-renderer li {
                    margin-bottom: 0.25rem;
                }
                .grammar-html-renderer strong {
                    color: #ea580c;
                    font-weight: 700;
                }
                .dark .grammar-html-renderer strong {
                    color: #fed7aa;
                }
                .grammar-html-renderer em {
                    color: #57534e;
                    font-style: italic;
                }
                .dark .grammar-html-renderer em {
                    color: #d6d3d1;
                }
            `}</style>
        </>
    );
}
