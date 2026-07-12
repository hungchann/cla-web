"use client";

import Image from "next/image";
import { use, useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useConversationDetail } from "@/lib/hooks/useConversationDetail";
import HighlightedText from "@/components/HighlightedText";
import { grammarApi } from "@/api/grammar";
import { notebookApi } from "@/api/notebook";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { WordInfoModal } from "@/components/video/WordInfoModal";

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

function LearnRoomContent({ params }: Readonly<{ params: { id: string } }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const currentStep = searchParams.get("step") || "learn-video-vocab";

  // Dynamic Grammar Questions state
  const [grammarQuestions, setGrammarQuestions] = useState<any[]>([]);
  const [isLoadingGrammar, setIsLoadingGrammar] = useState(false);
  const [activeGrammarIndex, setActiveGrammarIndex] = useState(0);

  // Dynamic Conversation Shadowing hook
  const conversationHook = useConversationDetail(courseId || "1");
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

  // Load dynamic grammar items when active
  useEffect(() => {
    if (currentStep === "learn-quiz-grammar" && grammarQuestions.length === 0) {
      const loadGrammar = async () => {
        setIsLoadingGrammar(true);
        try {
          const items = await grammarApi.getRandomGrammarItems();
          setGrammarQuestions(items || []);
        } catch (err) {
          console.warn("Lỗi tải ngữ pháp động:", err);
        } finally {
          setIsLoadingGrammar(false);
        }
      };
      loadGrammar();
    }
  }, [currentStep, grammarQuestions.length]);

  // Browser Text-to-Speech handler
  const speakChinese = (text: string) => {
    if (globalThis.window !== undefined && globalThis.speechSynthesis !== undefined) {
      globalThis.speechSynthesis.cancel();
      const utterance = new globalThis.SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      globalThis.speechSynthesis.speak(utterance);
    }
  };

  const getVocabSelectedLabel = (selected: string | null) => {
    if (selected === "A") return "zhi";
    if (selected === "B") return "ji";
    if (selected === "C") return "chi";
    if (selected === "D") return "qi";
    return "";
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
      router.push(`/courses/${courseId}/learn?step=${newStep}`);
    }
  };

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
        "大方",
        "dàfang",
        "Hào phóng, rộng rãi"
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
        "大方",
        "dàfang",
        "Hào phóng, rộng rãi"
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

  // --- Vocab Quiz state ---
  const [vocabSelected, setVocabSelected] = useState<string | null>(null);
  const handleVocabSelect = (option: string) => {
    if (vocabSelected) return;
    setVocabSelected(option);
  };
  const resetVocabQuiz = () => {
    setVocabSelected(null);
  };

  // --- Grammar Quiz state ---
  const [grammarSelected, setGrammarSelected] = useState<string | null>(null);
  const handleGrammarSelect = (option: string) => {
    if (grammarSelected) return;
    setGrammarSelected(option);
  };
  const resetGrammarQuiz = () => {
    setGrammarSelected(null);
  };

  // --- Grammar Video and Subtitle States ---
  const [grammarCurrentTime, setGrammarCurrentTime] = useState(0);
  const [grammarSubtitles, setGrammarSubtitles] = useState<any[]>([]);
  const grammarVideoRef = useRef<HTMLVideoElement | null>(null);
  const grammarSubtitleContainerRef = useRef<HTMLDivElement>(null);

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
    const loadGrammarVideo = async () => {
      try {
        const { bilingualApi } = await import("@/api/bilingual");
        const videosList = await bilingualApi.getVideoSection();
        const found = videosList.find(v => {
          const titleLower = v.title?.toLowerCase() || "";
          const genreLower = (v as any).genre_id?.title?.toLowerCase() || "";
          return titleLower.includes("ngữ pháp") || genreLower.includes("ngữ pháp") || genreLower.includes("grammar") || titleLower.includes("grammar");
        });
        
        if (found && found.srt_file?.filename_disk) {
          const srtUrl = `https://marutek.space/assets/${found.srt_file.filename_disk}`;
          const res = await fetch(srtUrl);
          const srtText = await res.text();
          const { parseSRTtoArray } = await import("@/services/subtitle");
          const parsed = parseSRTtoArray(srtText);
          setGrammarSubtitles(parsed.map(item => ({
            ...item,
            segmentedWords: item.chinese ? item.chinese.split("").map(char => ({ word: char, pinyin: "" })) : []
          })));
        } else {
          const { parseSRTtoArray } = await import("@/services/subtitle");
          const parsed = parseSRTtoArray(MOCK_GRAMMAR_SRT);
          setGrammarSubtitles(parsed.map(item => ({
            ...item,
            segmentedWords: item.chinese ? item.chinese.split("").map(char => ({ word: char, pinyin: "" })) : []
          })));
        }
      } catch (err) {
        console.warn("Lỗi tải video/phụ đề ngữ pháp:", err);
        try {
          const { parseSRTtoArray } = await import("@/services/subtitle");
          const parsed = parseSRTtoArray(MOCK_GRAMMAR_SRT);
          setGrammarSubtitles(parsed.map(item => ({
            ...item,
            segmentedWords: item.chinese ? item.chinese.split("").map(char => ({ word: char, pinyin: "" })) : []
          })));
        } catch {}
      }
    };

    if (currentStep === "learn-video-grammar") {
      loadGrammarVideo();
    }
  }, [currentStep]);

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

  const handleCheckDictation = () => {
    setDictationChecked(true);
    const clean = dictationInput.trim().toLowerCase();
    if (clean === "你好" || clean === "nǐ hǎo" || clean === "ni hao") {
      setDictationScore(100);
    } else if (
      clean.includes("ni") ||
      clean.includes("hao") ||
      clean.includes("nǐ") ||
      clean.includes("hǎo")
    ) {
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
    <div className="flex h-screen overflow-hidden bg-white text-gray-800 flex-1 -m-4 sm:-m-6 lg:-m-8 animate-fade-in">
      <Sidebar view={currentStep} setView={handleSetView} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header view={currentStep} setView={handleSetView} showLogo={false} />

        {/* Study breadcrumbs */}
        <div className="bg-amber-50/40 border-b border-gray-100 px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
          <div className="space-y-0.5">
            <h2 className="text-[13px] md:text-sm font-bold text-gray-700 tracking-tight leading-none">
              {courseTitle}
            </h2>
            <p className="text-[11px] md:text-xs text-gray-400 font-bold">
              Bài 1: Phát âm – Chào hỏi cơ bản (1)
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              <div className="lg:col-span-2 space-y-6">
                <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-black group border border-gray-200">
                  <Image
                    src="/images/student_cafe.png"
                    alt="Lesson Video Stream"
                    fill
                    className="object-cover opacity-85 group-hover:scale-[1.01] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <button
                    onClick={() => speakChinese("大方")}
                    className="absolute inset-0 m-auto w-16 h-16 bg-amber-500/90 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg active:scale-95 animate-pulse cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs select-none bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-xs font-bold">
                    <span>▶ Đang giảng: Đại từ - Tính từ</span>
                    <span>04:12 / 12:45</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs space-y-4">
                  <h4 className="font-extrabold text-amber-700 text-sm border-b border-amber-50 pb-2">
                    Giải thích từ 大方 (dàfang) trong tiếng Trung có nghĩa phổ biến:
                  </h4>
                  <ul className="space-y-3.5 text-xs text-gray-700 font-semibold leading-relaxed">
                    <li className="space-y-1">
                      <span className="text-gray-900 block font-bold">1. Hào phóng, rộng rãi (thường nói về tiền bạc hoặc cách đối xử)</span>
                      <div className="bg-gray-50 px-3 py-2 rounded-md font-mono flex items-center justify-between">
                        <span>他很大方. &rarr; Anh ấy rất hào phóng.</span>
                        <button
                          onClick={() => speakChinese("他很大方")}
                          className="text-amber-600 hover:text-amber-700 text-sm cursor-pointer select-none font-bold"
                        >
                          🔊 Nghe
                        </button>
                      </div>
                    </li>
                    <li className="space-y-1">
                      <span className="text-gray-900 block font-bold">2. Tự nhiên, đĩnh đạc, không ngại ngùng</span>
                      <div className="bg-gray-50 px-3 py-2 rounded-md font-mono flex items-center justify-between">
                        <span>她在台上表现得很大方. &rarr; Cô ấy thể hiện rất tự nhiên và tự tin trên sân khấu.</span>
                        <button
                          onClick={() => speakChinese("她在台上表现得很大方")}
                          className="text-amber-600 hover:text-amber-700 text-sm cursor-pointer select-none font-bold"
                        >
                          🔊 Nghe
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs space-y-5 relative">
                  <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    {!showDecksList ? (
                      <button
                        onClick={handleSaveVocabClick}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                          isSavedToFlashcard
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-gray-200 text-gray-600 hover:text-amber-500 hover:border-amber-200"
                        }`}
                      >
                        {isSavedToFlashcard ? "✓ Đã lưu Flashcard" : "⭐ Lưu từ vào flashcard"}
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
                                📁 {deck.title}
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
                      <div className={`p-2 rounded-lg text-[10px] font-bold text-center ${
                        saveMessage.type === "success" 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}>
                        {saveMessage.text}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 pt-2">
                    <button
                      onClick={() => speakChinese("大方")}
                      className="w-11 h-11 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90 transition-transform"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 0 0 1.06 1.06l2.25-2.25a.75.75 0 0 0 0-1.06l-2.25-2.25Z" />
                      </svg>
                    </button>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-wide">大方</h3>
                      <p className="text-xs text-amber-600 font-bold">dàfang — Hào phóng, rộng rãi</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-xl gap-4 border border-dashed border-gray-200">
                    {recordState === "idle" && (
                      <button
                        onClick={() => setRecordState("recording")}
                        className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
                        </svg>
                      </button>
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
                              speakChinese("大方");
                              setTimeout(() => setPlayBackState(false), 1200);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            {playBackState ? "🔊 Đang phát..." : "▶ Nghe lại"}
                          </button>
                          <button
                            onClick={() => setRecordState("idle")}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            🔄 Ghi lại
                          </button>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-emerald-800 font-extrabold text-xs">
                          <span className="text-lg">🎯</span>
                          <div>
                            <p>Điểm phát âm: 92/100 (Xuất sắc)</p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Luyện nói chuẩn âm sắc pinyin!</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {recordState === "idle" && (
                      <span className="text-xs text-gray-400 font-bold">
                        Nhấn nút đỏ để bắt đầu ghi âm phát âm của bạn
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleSetView("learn-quiz-vocab")}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Phần tiếp <span className="text-base font-normal">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold shadow-2xs">
                  <div className="text-sm mb-2 flex items-center gap-1.5 text-amber-700 font-black">
                    <span>💡</span> Note phát triển
                  </div>
                  Note: 2 phần này sẽ được set thời gian xuất hiện để khớp với thời gian từ đang được giảng trong video.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Bài tập từ vựng (learn-quiz-vocab) */}
          {currentStep === "learn-quiz-vocab" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-amber-50 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                        Q1
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                        Câu 1: Chọn từ nghe được trong audio
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
                    {[
                      { key: "A", val: "zhi" },
                      { key: "B", val: "ji" },
                      { key: "C", val: "chi" },
                      { key: "D", val: "qi" },
                    ].map((opt) => {
                      const isSelected = vocabSelected === opt.key;
                      let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";

                      if (isSelected) {
                        if (opt.key === "C") {
                          btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500";
                        } else {
                          btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                        }
                      } else if (vocabSelected && opt.key === "C") {
                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleVocabSelect(opt.key)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0 select-none text-gray-600 font-black">
                            {opt.key}
                          </span>
                          <span>{opt.val}</span>
                        </button>
                      );
                    })}
                  </div>

                  {vocabSelected && (
                    <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${
                      vocabSelected === "C"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        {vocabSelected === "C" ? (
                          <span>🎉 Chính xác!</span>
                        ) : (
                          <span>❌ Sai rồi! Thử lại xem nhé.</span>
                        )}
                      </div>
                      <p>
                        <strong>Giải thích:</strong> trong audio phát âm chữ &quot;chi&quot;, chú ý chữ này khi phát âm sẽ bật hơi mạnh.
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Đáp án đúng: <strong className="text-emerald-700">C. chi</strong> | Đáp án của bạn: <strong className={vocabSelected === "C" ? "text-emerald-700" : "text-rose-700"}>{vocabSelected}. {getVocabSelectedLabel(vocabSelected)}</strong>
                      </p>
                      <button onClick={resetVocabQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                        Thử lại câu này
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-50 select-none">
                    <button
                      onClick={() => handleSetView("learn-video-grammar")}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Phần tiếp <span className="text-base font-normal">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold space-y-3 shadow-2xs">
                  <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                    <span>💡</span> Đặc điểm giao diện
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
                  <video
                    ref={grammarVideoRef}
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    controls
                    className="h-full w-full object-contain"
                    onTimeUpdate={handleGrammarTimeUpdate}
                  />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs select-none bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-xs font-bold pointer-events-none">
                    <span>▶ Đang phát: Video bài giảng Ngữ pháp</span>
                    <span>{Math.floor(grammarCurrentTime)}s</span>
                  </div>
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
                                grammarVideoRef.current.play().catch(() => {});
                              }
                            }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                              isActive
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
                                  className={`text-sm font-bold hover:underline hover:text-amber-500 cursor-pointer ${
                                    isActive ? "text-white hover:text-amber-200" : "text-zinc-800 dark:text-white"
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
                <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                  {isLoadingGrammar ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="w-8 h-8 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
                      <p className="text-xs font-bold text-zinc-500">Đang tải câu hỏi ngữ pháp...</p>
                    </div>
                  ) : grammarQuestions.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <p className="text-sm font-bold text-zinc-500">Không tìm thấy dữ liệu ngữ pháp động.</p>
                      <button
                        onClick={() => handleSetView("learn-dictation")}
                        className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                      >
                        Bỏ qua phần này
                      </button>
                    </div>
                  ) : (() => {
                    const currentGrammar = grammarQuestions[activeGrammarIndex];
                    const correctKey = ["A", "B", "C", "D"][activeGrammarIndex] || "A";

                    const options = grammarQuestions.map((item, idx) => {
                      const key = ["A", "B", "C", "D"][idx] || "A";
                      return {
                        key,
                        val: item.description || "Điểm ngữ pháp cần nghiên cứu",
                        title: item.title,
                        isCorrect: idx === activeGrammarIndex,
                      };
                    });

                    return (
                      <>
                        <div className="flex items-center justify-between border-b border-amber-50 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                              {activeGrammarIndex + 1}
                            </span>
                            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                              Đâu là mô tả định nghĩa đúng của điểm ngữ pháp &quot;{currentGrammar?.title}&quot;?
                            </h3>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {options.map((opt) => {
                            const isSelected = grammarSelected === opt.key;
                            let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";

                            if (isSelected) {
                              if (opt.key === correctKey) {
                                btnStyle = "border-[#f59e0b] bg-amber-50 text-amber-950 ring-2 ring-[#f59e0b]";
                              } else {
                                btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                              }
                            } else if (grammarSelected && opt.key === correctKey) {
                              btnStyle = "border-[#f59e0b] bg-amber-50 text-amber-950";
                            }

                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleGrammarSelect(opt.key)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-sm cursor-pointer ${btnStyle}`}
                              >
                                <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0 select-none text-gray-600 font-black">
                                  {opt.key}
                                </span>
                                <span>{opt.val}</span>
                              </button>
                            );
                          })}
                        </div>

                        {grammarSelected && (
                          <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${
                            grammarSelected === correctKey
                              ? "bg-amber-50 border-[#f59e0b] text-amber-950"
                              : "bg-rose-50 border-rose-200 text-rose-900"
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold text-sm">
                              {grammarSelected === correctKey ? (
                                <span>🎉 Chính xác!</span>
                              ) : (
                                <span>❌ Chọn chưa đúng rồi!</span>
                              )}
                            </div>
                            <p>
                              <strong>Chi tiết cấu trúc:</strong> {currentGrammar?.content}
                            </p>
                            <button onClick={resetGrammarQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                              Thử lại câu này
                            </button>
                          </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-50 select-none">
                          <button
                            onClick={() => {
                              if (activeGrammarIndex < grammarQuestions.length - 1) {
                                setActiveGrammarIndex((prev) => prev + 1);
                                setGrammarSelected(null);
                              } else {
                                handleSetView("learn-dictation");
                              }
                            }}
                            className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {activeGrammarIndex < grammarQuestions.length - 1 ? "Câu tiếp" : "Phần tiếp"} <span className="text-base font-normal">&rarr;</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold space-y-3 shadow-2xs">
                  <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                    <span>💡</span> Đặc điểm giao diện
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
                    <button
                      onClick={() => speakChinese("你好")}
                      className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold select-none">
                        <span>Nghe phát âm</span>
                        <span>0:02 / 0:02</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden relative">
                        <div className="bg-amber-500 h-full rounded-full w-full" />
                      </div>
                    </div>

                    <div className="text-amber-500 text-lg animate-pulse">🔊</div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-extrabold text-gray-900 text-sm">
                      Chép câu mà bạn nghe được:
                    </h4>

                    <div className="relative">
                      <input
                        type="text"
                        value={dictationInput}
                        onChange={(e) => setDictationInput(e.target.value)}
                        placeholder="Gợi ý: nhập 'ni hao' hoặc '你好' để chấm điểm"
                        disabled={dictationChecked}
                        className="w-full bg-transparent border-b-2 border-dashed border-amber-300 focus:border-amber-500 focus:outline-none py-2 text-sm text-gray-800 font-bold placeholder-gray-400 transition-all font-mono"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleCheckDictation}
                        disabled={dictationChecked}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2 rounded-full text-xs shadow-xs transition-colors cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 shrink-0"
                      >
                        Kiểm tra
                      </button>
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
                        <span className="text-2xl">🎯</span>
                        <div>
                          <h5 className="font-extrabold text-amber-700 text-sm">
                            Đúng {dictationScore}%
                          </h5>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            Đáp án chuẩn: &quot;你好 (nǐ hǎo)&quot;
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
                            👩‍🎓
                          </div>
                        )}

                        <div className="max-w-md flex flex-col gap-2">
                          <div
                            className={`rounded-2xl p-4 shadow-sm relative ${
                              isSpeakerA
                                ? "bg-white border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700"
                                : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                            }`}
                          >
                            <p className="font-bold text-sm leading-relaxed">{msg.chinese_text}</p>
                            <p
                              className={`text-[11px] leading-relaxed ${
                                isSpeakerA ? "text-zinc-500" : "text-white/80 italic"
                              }`}
                            >
                              {msg.pinyin}
                            </p>
                            <p
                              className={`text-xs leading-relaxed ${
                                isSpeakerA ? "text-zinc-400 font-medium" : "text-amber-100 font-semibold"
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
                                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                                    activeRecordingId === msg.id && msg.recording?.state.isRecording
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
                                      🎙️ Nhấp để nói
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Hiển thị so sánh phát âm thực tế nếu có */}
                              {msg.recording?.comparison && (
                                <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-zinc-500 select-none">Phân tích giọng nói:</span>
                                    <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                                      msg.recording.comparison.accuracy >= 80
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
                    <button className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                      <div className="w-14 h-18 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative">
                        <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-700">Bài tập</span>
                    </button>

                    {/* PDF 2 */}
                    <button className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                      <div className="w-14 h-18 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative">
                        <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-700">Đáp án</span>
                    </button>

                    {/* Audio */}
                    <button className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                      <div className="w-14 h-18 bg-orange-50 border border-orange-200 rounded-lg flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-500">
                          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-gray-700">Audio</span>
                    </button>
                  </div>
                </div>

                {/* Right side: Helper Text "Đây là 3 file để..." */}
                <div className="md:col-span-1 text-sm font-bold text-gray-700 leading-relaxed space-y-2 p-2">
                  <div className="flex items-center gap-1.5 text-amber-600 text-lg">
                    💡
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
