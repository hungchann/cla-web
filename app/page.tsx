"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [view, setView] = useState<
    | "home"
    | "courses"
    | "course-detail"
    | "learn-video-vocab"
    | "learn-quiz-vocab"
    | "learn-video-grammar"
    | "learn-quiz-grammar"
    | "learn-dictation"
    | "learn-conversation"
    | "learn-extra"
    | "bilingual-list"
    | "bilingual-reader"
  >("home");

  const isStudyMode = view.startsWith("learn");
  const isBilingualMode = view.startsWith("bilingual");

  // Bilingual reader tab state
  const [readerTab, setReaderTab] = useState<"content" | "vocab" | "grammar" | "shadowing" | "exercise">("shadowing");

  // Browser Text-to-Speech handler
  const speakChinese = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Home View States ---
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const toggleFlip = (index: number) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const featuredCourses = [
    {
      id: "living-chinese",
      level: "Sơ cấp",
      title: "Giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)",
      duration: "2 - 3 tháng",
    },
    {
      id: "office-chinese",
      level: "Sơ cấp",
      title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
      duration: "2 - 3 tháng",
    },
    {
      id: "marketing-traditional",
      level: "Trung cấp",
      title: "Tiếng Trung Marketing (Phồn thể)",
      duration: "2 - 3 tháng",
    },
  ];

  const bilingualArticles = [
    {
      titleCn: "面对同辈压力",
      titleVi: "Đối mặt với áp lực đồng trang lứa",
      date: "10/5/2026",
    },
    {
      titleCn: "如何高效学习汉语",
      titleVi: "Làm thế nào để học tiếng Trung hiệu quả",
      date: "08/5/2026",
    },
    {
      titleCn: "中国茶文化简介",
      titleVi: "Giới thiệu về văn hóa trà Trung Quốc",
      date: "05/5/2026",
    },
  ];

  const flashcards = [
    { word: "压力", pinyin: "yālì", meaning: "Áp lực, sức ép" },
    { word: "同辈", pinyin: "tóngbèi", meaning: "Đồng trang lứa, cùng thế hệ" },
    { word: "对", pinyin: "duì", meaning: "Đối mặt, đối phó, đúng" },
  ];

  // --- Courses Catalog States ---
  const simplifiedCourses = [
    ...featuredCourses,
    {
      id: "office-chinese-2",
      level: "Sơ cấp",
      title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
      duration: "3 - 4 tháng",
    },
    {
      id: "office-chinese-3",
      level: "Sơ cấp",
      title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
      duration: "2 - 3 tháng",
    },
    {
      id: "marketing-traditional-2",
      level: "Trung cấp",
      title: "Tiếng Trung Marketing (Phồn thể)",
      duration: "2 - 3 tháng",
    },
  ];

  const traditionalCourses = [
    {
      id: "bilingual-pressure",
      title: "Đối mặt với áp lực đồng trang lứa",
      subtext: "面对同辈压力",
      duration: "10/5/2026",
      isBilingual: true,
    },
    {
      id: "office-chinese-4",
      level: "Sơ cấp",
      title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
      duration: "2 - 3 tháng",
    },
    {
      id: "marketing-traditional-3",
      level: "Trung cấp",
      title: "Tiếng Trung Marketing (Phồn thể)",
      duration: "2 - 3 tháng",
    },
  ];

  // --- Course Detail Syllabus States ---
  const [activeTab, setActiveTab] = useState<"info" | "syllabus" | "reviews">("syllabus");
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({
    1: true,
  });
  const toggleLesson = (num: number) => {
    setExpandedLessons((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const syllabusLessons = [
    {
      num: 1,
      title: "Bài 1: Phát âm - Chào hỏi cơ bản (1)",
      subtopics: [
        { name: "Video từ vựng", id: "learn-video-vocab" },
        { name: "Bài tập: từ vựng", id: "learn-quiz-vocab" },
        { name: "Video ngữ pháp", id: "learn-video-grammar" },
        { name: "Bài tập ngữ pháp", id: "learn-quiz-grammar" },
        { name: "Bài tập: Nghe chép chính tả", id: "learn-dictation" },
        { name: "Thực hành hội thoại", id: "learn-conversation" },
        { name: "Bài tập bổ sung", id: "learn-extra" },
      ],
    },
    { num: 2, title: "Bài 2: Phát âm - Chào hỏi cơ bản (2)", subtopics: [] },
    { num: 3, title: "Bài 3: Phát âm - Giới thiệu bản thân (3)", subtopics: [] },
    { num: 4, title: "Bài 4: Giới thiệu tuổi tác", tag: "Học thử miễn phí", subtopics: [] },
  ];

  // --- Study Room States ---
  // Voice recording (Video Vocab step)
  const [isSavedToFlashcard, setIsSavedToFlashcard] = useState(false);
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

  // Vocab Quiz state (Choice C is correct)
  const [vocabSelected, setVocabSelected] = useState<string | null>(null);
  const handleVocabSelect = (option: string) => {
    if (vocabSelected) return;
    setVocabSelected(option);
  };
  const resetVocabQuiz = () => {
    setVocabSelected(null);
  };

  // Grammar Quiz state (Choice C is correct)
  const [grammarSelected, setGrammarSelected] = useState<string | null>(null);
  const handleGrammarSelect = (option: string) => {
    if (grammarSelected) return;
    setGrammarSelected(option);
  };
  const resetGrammarQuiz = () => {
    setGrammarSelected(null);
  };

  // Dictation states (Chép chính tả)
  const [dictationInput, setDictationInput] = useState("");
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationScore, setDictationScore] = useState<number | null>(null);

  const handleCheckDictation = () => {
    setDictationChecked(true);
    const clean = dictationInput.trim().toLowerCase();
    if (clean === "你好" || clean === "nǐ hǎo" || clean === "ni hao") {
      setDictationScore(100);
    } else if (clean.includes("ni") || clean.includes("hao") || clean.includes("nǐ") || clean.includes("hǎo")) {
      setDictationScore(85); // Matches Image 10 exactly!
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
    <div className="min-h-screen bg-amber-50/10 flex flex-col font-sans text-gray-800 relative">
      
      {/* 1. HOME VIEW */}
      {view === "home" && (
        <div className="flex flex-col flex-1">
          <Header view={view} setView={setView} showLogo={true} />
          
          <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 space-y-12 animate-fade-in">
            {/* Banner Slider */}
            <section className="bg-white rounded-2xl border border-amber-100 p-6 flex flex-col md:flex-row items-center gap-8 shadow-xs">
              <div className="w-full md:w-1/2 relative h-64 md:h-80 rounded-xl overflow-hidden shadow-md">
                <Image
                  src="/images/banner_dashboard.png"
                  alt="Sun Chinese Dashboard Banner"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                  Tính năng nổi bật
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">
                  Trải nghiệm Học tiếng Trung Đột phá trên Nền tảng Web
                </h2>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  Hệ thống học tập thông minh tích hợp Video bài giảng tương tác, luyện phát âm chuẩn AI,
                  phân tích cấu trúc câu chữ Hán và thẻ ghi nhớ Flashcard tự động hóa phương pháp SRS.
                </p>
                <div className="text-xs text-amber-500 font-semibold italic bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
                  Note: Đây là thanh cuộn các ảnh giới thiệu tính năng web/app
                </div>
              </div>
            </section>

            {/* Khóa học nổi bật */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">🎓</span> Khóa học nổi bật
                </h2>
                <button
                  onClick={() => setView("courses")}
                  className="text-amber-600 hover:text-amber-700 font-bold text-sm flex items-center gap-1 group cursor-pointer"
                >
                  Xem tất cả <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredCourses.map((course, idx) => (
                  <button
                    key={idx}
                    onClick={() => setView("course-detail")}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col text-left cursor-pointer"
                  >
                    <div className="relative h-44 w-full bg-gray-100">
                      <Image
                        src="/images/study_tablet.png"
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-md font-bold text-white shadow-xs bg-amber-500">
                        {course.level}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-200 text-[15px] leading-snug">
                        {course.title}
                      </h3>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-2 border-t border-gray-50">
                        <span>⏱️</span> {course.duration}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Bài đọc song ngữ */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">📖</span> Bài đọc song ngữ
                </h2>
                <button onClick={() => setView("courses")} className="text-amber-600 hover:text-amber-700 font-bold text-sm cursor-pointer">
                  Xem thêm
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bilingualArticles.map((article, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:border-amber-200 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-40 w-full bg-gray-50">
                      <Image
                        src="/images/study_tablet.png"
                        alt={article.titleVi}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-amber-700 text-sm">{article.titleCn}</h3>
                        <p className="font-semibold text-gray-800 text-[13px] leading-snug">
                          {article.titleVi}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{article.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Video song ngữ */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">🎥</span> Video song ngữ
                </h2>
                <span className="text-gray-400 text-xs font-semibold">Tất cả video</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bilingualArticles.map((article, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:border-amber-200 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-40 w-full bg-gray-50">
                      <Image
                        src="/images/study_tablet.png"
                        alt={article.titleVi}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-amber-600 shadow-md">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6 ml-0.5"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-amber-700 text-sm">{article.titleCn}</h3>
                        <p className="font-semibold text-gray-800 text-[13px] leading-snug">
                          {article.titleVi}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{article.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sách - báo song ngữ */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">📚</span> Sách - báo song ngữ
                </h2>
                <span className="text-gray-400 text-xs font-semibold">Đọc sách</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bilingualArticles.map((article, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:border-amber-200 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-40 w-full bg-gray-50">
                      <Image
                        src="/images/study_tablet.png"
                        alt={article.titleVi}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-amber-700 text-sm">{article.titleCn}</h3>
                        <p className="font-semibold text-gray-800 text-[13px] leading-snug">
                          {article.titleVi}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{article.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Flashcard Section */}
            <section className="space-y-6 pb-12">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span className="text-amber-500">🎴</span> Flashcard tương tác (Nhấp để lật)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {flashcards.map((fc, idx) => {
                  const isFlipped = !!flippedCards[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleFlip(idx)}
                      className="h-32 bg-amber-400 hover:bg-amber-500 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-md select-none transform transition-all duration-300 active:scale-95 text-center relative p-4 group overflow-hidden"
                    >
                      <div
                        className={`transition-all duration-300 flex flex-col items-center justify-center w-full h-full ${
                          isFlipped ? "rotate-x-180 opacity-0 hidden" : "opacity-100"
                        }`}
                      >
                        <span className="text-3xl font-black text-gray-900 tracking-wider">
                          {fc.word}
                        </span>
                        <span className="text-xs text-amber-900/70 mt-1 font-bold">
                          Nhấp để xem nghĩa
                        </span>
                      </div>

                      <div
                        className={`transition-all duration-300 flex flex-col items-center justify-center w-full h-full ${
                          isFlipped ? "opacity-100" : "rotate-x-180 opacity-0 hidden"
                        }`}
                      >
                        <span className="text-base font-bold text-amber-900 tracking-wide">
                          {fc.pinyin}
                        </span>
                        <span className="text-lg font-black text-gray-900 mt-1">
                          {fc.meaning}
                        </span>
                        <span className="text-xs text-amber-900/70 mt-2 font-semibold">
                          Nhấp để quay lại
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>
          
          <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-medium">
            &copy; {new Date().getFullYear()} Sun Chinese. Tất cả các quyền được bảo lưu.
          </footer>
        </div>
      )}

      {/* 2. COURSES SELECTION VIEW */}
      {view === "courses" && (
        <div className="flex h-screen overflow-hidden bg-white text-gray-800 flex-1 animate-fade-in">
          <Sidebar view={view} setView={setView} />
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Header view={view} setView={setView} showLogo={false} />
            
            <div className="p-6 md:p-8 space-y-12 max-w-6xl w-full mx-auto">
              <section className="space-y-6">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">🇨🇳</span> Giản thể (Trung Quốc đại lục)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {simplifiedCourses.map((course, idx) => (
                    <button
                      key={idx}
                      onClick={() => setView("course-detail")}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col text-left cursor-pointer"
                    >
                      <div className="relative h-44 w-full bg-gray-100">
                        <Image
                          src="/images/study_tablet.png"
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-md font-bold text-white shadow-xs bg-amber-500">
                          {course.level}
                        </span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-200 text-[15px] leading-snug">
                          {course.title}
                        </h3>
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-2 border-t border-gray-50">
                          <span>⏱️</span> {course.duration}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-6 pb-12">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="text-amber-500">🇹🇼</span> Phồn thể (Đài Loan, Hong Kong, Macao)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {traditionalCourses.map((course, idx) => (
                    <button
                      key={idx}
                      onClick={() => setView("course-detail")}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col text-left cursor-pointer"
                    >
                      <div className="relative h-44 w-full bg-gray-100">
                        <Image
                          src="/images/study_tablet.png"
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {course.level && (
                          <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-md font-bold text-white shadow-xs bg-amber-500">
                            {course.level}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          {course.isBilingual && (
                            <h4 className="text-amber-700 font-bold text-xs mb-1">
                              {course.subtext}
                            </h4>
                          )}
                          <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-200 text-[15px] leading-snug">
                            {course.title}
                          </h3>
                        </div>
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-2 border-t border-gray-50">
                          {course.isBilingual ? <span>📅</span> : <span>⏱️</span>} {course.duration}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* 3. COURSE DETAIL SYLLABUS VIEW */}
      {view === "course-detail" && (
        <div className="flex flex-col flex-1 pb-16 bg-[#fafafa] animate-fade-in">
          <Header view={view} setView={setView} showLogo={true} />
          
          <main className="max-w-5xl w-full mx-auto px-4 py-8 space-y-8 flex-1">
            {/* Info Banner */}
            <section className="bg-white rounded-2xl border-2 border-[#f59e0b] overflow-hidden flex flex-col md:flex-row shadow-xs">
              <div className="p-6 md:p-8 flex-1 space-y-4">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">
                  Khóa giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)
                </h1>
                <ul className="space-y-3.5 pl-5 list-disc text-sm md:text-base text-gray-700 font-medium">
                  <li>Dành cho người mới bắt đầu học Tiếng Trung hoặc học nhưng bị mất gốc</li>
                  <li>
                    Muốn học giao tiếp Tiếng Trung để đi du lịch, công tác nhưng không có nhiều thời
                    gian lên lớp học
                  </li>
                  <li>Học các chủ điểm giao tiếp từ con số 0</li>
                </ul>
              </div>
              <div className="relative w-full md:w-80 h-52 md:h-auto bg-gray-50 shrink-0 border-t md:border-t-0 md:border-l border-gray-100">
                <Image
                  src="/images/study_tablet.png"
                  alt="Syllabus Study Desk"
                  fill
                  className="object-cover"
                />
              </div>
            </section>

            {/* Tabs */}
            <section className="border-b border-gray-200">
              <div className="flex gap-8 text-sm md:text-base font-bold">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`pb-3 px-1 transition-colors cursor-pointer ${
                    activeTab === "info"
                      ? "border-b-3 border-[#f59e0b] text-[#f59e0b]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Thông tin khóa học
                </button>
                <button
                  onClick={() => setActiveTab("syllabus")}
                  className={`pb-3 px-1 transition-colors cursor-pointer ${
                    activeTab === "syllabus"
                      ? "border-b-3 border-[#f59e0b] text-[#f59e0b]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Nội dung bài học
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-3 px-1 transition-colors cursor-pointer ${
                    activeTab === "reviews"
                      ? "border-b-3 border-[#f59e0b] text-[#f59e0b]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Đánh giá của học viên
                </button>
              </div>
            </section>

            {/* Tab content */}
            {activeTab === "syllabus" && (
              <section className="space-y-8">
                <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6 shadow-xs">
                  <div className="relative w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src="/images/student_cafe.png"
                      alt="Student studying in Cafe"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="font-extrabold text-gray-900 text-lg">Nội dung bài học</h3>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
                      Khóa học hướng đến đối tượng ABC
                      <br />
                      Gồm 15 bài
                      <br />
                      Mỗi bài học bao gồm 7 phần: video giải thích từ vựng, bài tập từ vựng, video ngữ
                      pháp, bài tập ngữ pháp, bài tập nghe chép chính tả, thực hành hội thoại, bài tập bổ
                      sung.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="w-full md:w-1/2 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-amber-800">
                      <span>Tiến độ học tập</span>
                      <span>40%</span>
                    </div>
                    <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#f59e0b] h-full rounded-full" style={{ width: "40%" }} />
                    </div>
                  </div>
                  <button
                    onClick={() => setView("learn-video-vocab")}
                    className="bg-[#f59e0b] text-white hover:bg-amber-600 font-bold px-6 py-2.5 rounded-full text-sm shadow-xs transition-colors cursor-pointer active:scale-95"
                  >
                    Học tiếp =&gt;
                  </button>
                </div>

                <div className="space-y-4">
                  {syllabusLessons.map((lesson) => {
                    const isExpanded = !!expandedLessons[lesson.num];
                    return (
                      <div
                        key={lesson.num}
                        className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden"
                      >
                        <button
                          onClick={() => toggleLesson(lesson.num)}
                          className="w-full flex items-center justify-between p-4.5 font-extrabold text-gray-900 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[15px]">{lesson.title}</span>
                            {lesson.tag && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                {lesson.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 font-mono text-lg">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 border-t border-gray-50 space-y-2">
                            {lesson.subtopics.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {lesson.subtopics.map((sub, sidx) => (
                                  <button
                                    key={sidx}
                                    onClick={() => setView(sub.id as any)}
                                    className="flex items-center justify-between p-3.5 bg-[#fff8e6] hover:bg-[#ffe082] text-gray-900 hover:text-amber-950 font-bold rounded-lg transition-all duration-200 border border-amber-100 cursor-pointer text-left w-full"
                                  >
                                    <span className="text-xs">{sub.name}</span>
                                    <span className="text-amber-600 text-xs font-mono">&rarr;</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">
                                Bài học chưa được mở khóa hoặc đang cập nhật nội dung.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === "info" && (
              <section className="bg-white rounded-xl p-8 border border-gray-100 text-gray-600 space-y-4">
                <h3 className="font-extrabold text-gray-900 text-lg">Mô tả chi tiết khóa học</h3>
                <p className="text-sm leading-relaxed">
                  Đây là khóa học đàm thoại toàn diện được thiết kế đặc biệt cho người Việt Nam học
                  tiếng Trung từ cơ bản. Các nội dung bám sát thực tế cuộc sống, công sở và đi lại.
                </p>
              </section>
            )}

            {activeTab === "reviews" && (
              <section className="bg-white rounded-xl p-8 border border-gray-100 space-y-4">
                <h3 className="font-extrabold text-gray-900 text-lg">Đánh giá tiêu biểu</h3>
                <div className="border-l-4 border-amber-400 pl-4 space-y-1">
                  <p className="text-sm italic text-gray-600">
                    &quot;Khóa học rất thực tế, bài học từ vựng có video ngắn rất dễ nhớ. Phần luyện nói
                    chấm điểm pinyin cực kỳ hay!&quot;
                  </p>
                  <span className="text-xs text-gray-400 font-bold">- Nguyễn Văn A (Học viên)</span>
                </div>
              </section>
            )}
          </main>
        </div>
      )}

      {/* 4. LEARN ROOM VIEWS */}
      {isStudyMode && (
        <div className="flex h-screen overflow-hidden bg-white text-gray-800 flex-1 animate-fade-in">
          <Sidebar view={view} setView={setView} />
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Header view={view} setView={setView} showLogo={false} />
            
            {/* Study breadcrumbs */}
            <div className="bg-amber-50/40 border-b border-gray-100 px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
              <div className="space-y-0.5">
                <h2 className="text-[13px] md:text-sm font-bold text-gray-700 tracking-tight leading-none">
                  Khóa giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)
                </h2>
                <p className="text-[11px] md:text-xs text-gray-400 font-bold">
                  Bài 1: Phát âm – Chào hỏi cơ bản (1)
                </p>
              </div>
              <button
                onClick={() => setView("course-detail")}
                className="text-xs bg-white text-gray-600 hover:text-amber-500 font-bold border border-gray-200 px-3.5 py-1.5 rounded-full transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                &larr; Lộ trình học
              </button>
            </div>

            {/* Study Area content */}
            <div className="p-6 md:p-8 max-w-4xl w-full mx-auto flex-1 flex flex-col justify-start">
              
              {/* SCREEN 4: Video từ vựng (learn-video-vocab) */}
              {view === "learn-video-vocab" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Video Box */}
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

                    {/* Explanation details */}
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

                    {/* Speech Practice */}
                    <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-2xs space-y-5 relative">
                      <button
                        onClick={() => setIsSavedToFlashcard(!isSavedToFlashcard)}
                        className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                          isSavedToFlashcard
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-gray-200 text-gray-600 hover:text-amber-500 hover:border-amber-200"
                        }`}
                      >
                        {isSavedToFlashcard ? "✓ Đã lưu Flashcard" : "⭐ Lưu từ vào flashcard"}
                      </button>

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
                          onClick={() => setView("learn-quiz-vocab")}
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

              {/* SCREEN 5 & 6: Bài tập từ vựng (learn-quiz-vocab) */}
              {view === "learn-quiz-vocab" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fade-in">
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

                      {/* Explanation box (Image 6 feedback) */}
                      {vocabSelected && (
                        <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 animate-fade-in ${
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
                            Đáp án đúng: <strong className="text-emerald-700">C. chi</strong> | Đáp án của bạn: <strong className={vocabSelected === "C" ? "text-emerald-700" : "text-rose-700"}>{vocabSelected}. {vocabSelected === "A" ? "zhi" : vocabSelected === "B" ? "ji" : vocabSelected === "C" ? "chi" : "qi"}</strong>
                          </p>
                          <button onClick={resetVocabQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                            Thử lại câu này
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end pt-4 border-t border-gray-50 select-none">
                        <button
                          onClick={() => setView("learn-video-grammar")}
                          className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          câu 2 <span className="text-base font-normal">&rarr;</span>
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

              {/* SCREEN 7: Video ngữ pháp (learn-video-grammar) */}
              {view === "learn-video-grammar" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fade-in">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Video player */}
                    <div className="relative rounded-2xl overflow-hidden shadow-md aspect-video bg-black group border border-gray-200">
                      <Image
                        src="/images/student_cafe.png"
                        alt="Grammar Video Lecture"
                        fill
                        className="object-cover opacity-85 group-hover:scale-[1.01] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      
                      <button
                        onClick={() => speakChinese("你好")}
                        className="absolute inset-0 m-auto w-16 h-16 bg-amber-500/90 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg active:scale-95 animate-pulse cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>

                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs select-none bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-xs font-bold">
                        <span>▶ Đang giảng: Ngữ pháp bài 1</span>
                        <span>01:45 / 09:20</span>
                      </div>
                    </div>

                    {/* Grammar description card */}
                    <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-2xs space-y-4">
                      <h4 className="font-extrabold text-amber-700 text-sm border-b border-amber-50 pb-2">
                        Giải thích ngữ pháp
                      </h4>
                      <div className="space-y-3.5 text-xs text-gray-700 font-semibold leading-relaxed">
                        <p>
                          <strong>Biến điệu của hai thanh 3 (Thanh hỏi):</strong>
                        </p>
                        <p>
                          Khi hai âm tiết mang thanh 3 đi liền với nhau, âm tiết thứ nhất sẽ phát âm biến điệu thành thanh 2 (Thanh sắc), tuy nhiên cách viết pinyin vẫn giữ nguyên ký hiệu thanh 3.
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg font-mono text-center border-l-4 border-amber-400">
                          你 (nǐ) + 好 (hǎo) &rarr; 你好 (ní hǎo)
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setView("learn-quiz-grammar")}
                        className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        Phần tiếp <span className="text-base font-normal">&rarr;</span>
                      </button>
                    </div>
                  </div>

                  {/* Sidebar Callout */}
                  <div className="space-y-6">
                    <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold shadow-2xs">
                      <div className="text-sm mb-2 flex items-center gap-1.5 text-amber-700 font-black">
                        <span>💡</span> Note phát triển
                      </div>
                      Note: phần này sẽ được set thời gian xuất hiện để khớp với video
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 8 & 9: Bài tập ngữ pháp (learn-quiz-grammar) */}
              {view === "learn-quiz-grammar" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fade-in">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                      <div className="flex items-center justify-between border-b border-amber-50 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                            Q1
                          </span>
                          <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                            Câu 1: Chọn nghĩa đúng của câu sau:
                          </h3>
                        </div>
                        <button
                          onClick={() => speakChinese("你好")}
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
                          const isSelected = grammarSelected === opt.key;
                          let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";
                          
                          if (isSelected) {
                            if (opt.key === "C") {
                              btnStyle = "border-[#f59e0b] bg-amber-50 text-amber-950 ring-2 ring-[#f59e0b]";
                            } else {
                              btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                            }
                          } else if (grammarSelected && opt.key === "C") {
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

                      {/* Explanation box (Image 9 feedback) */}
                      {grammarSelected && (
                        <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 animate-fade-in ${
                          grammarSelected === "C" 
                            ? "bg-amber-50 border-[#f59e0b] text-amber-950"
                            : "bg-rose-50 border-rose-200 text-rose-900"
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold text-sm">
                            {grammarSelected === "C" ? (
                              <span>🎉 Chính xác!</span>
                            ) : (
                              <span>❌ Chọn chưa đúng rồi!</span>
                            )}
                          </div>
                          <p>
                            <strong>Giải thích:</strong> Câu ABC có nghĩa là Lời chào lịch sự khi gặp mặt người khác, thể hiện sự hiếu khách và tôn trọng.
                          </p>
                          <button onClick={resetGrammarQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                            Thử lại câu này
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end pt-4 border-t border-gray-50 select-none">
                        <button
                          onClick={() => setView("learn-dictation")}
                          className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          câu 2 <span className="text-base font-normal">&rarr;</span>
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
                        <li>Phần này trong câu hỏi trắc nghiệm có thể kèm audio hoặc không</li>
                        <li>Chọn xong sẽ hiện đáp án và giải thích luôn</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 10: Bài tập Nghe chép chính tả (learn-dictation) */}
              {view === "learn-dictation" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fade-in">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-amber-100 p-6 md:p-8 shadow-xs space-y-6">
                      
                      {/* Audio Player Widget */}
                      <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 flex items-center gap-4">
                        <button
                          onClick={() => speakChinese("你好")}
                          className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                        
                        {/* Audio Timeline slider */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold select-none">
                            <span>Nghe phát âm</span>
                            <span>0:02 / 0:02</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden relative">
                            <div className="bg-amber-500 h-full rounded-full w-full" />
                          </div>
                        </div>

                        {/* Speaker wave indicator icon */}
                        <div className="text-amber-500 text-lg animate-pulse">🔊</div>
                      </div>

                      {/* Dictation Input Area */}
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

                      {/* Dictation Feedback Card (Image 10 bottom) */}
                      {dictationChecked && dictationScore !== null && (
                        <div className="p-5 bg-white border border-amber-200 rounded-xl shadow-2xs space-y-2 animate-fade-in">
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
                          onClick={() => setView("learn-conversation")}
                          className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          câu 2 <span className="text-base font-normal">&rarr;</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold space-y-4 shadow-2xs">
                      <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                        <span>💡</span> Mô tả chấm điểm
                      </div>
                      <ul className="list-disc pl-4 space-y-2">
                        <li>Chọn xong sẽ hiện đáp án luôn.</li>
                        <li>Giống phần chấm điểm bài tập dịch trong app.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 13: Thực hành hội thoại (learn-conversation) */}
              {view === "learn-conversation" && (
                <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
                  {/* Conversation Bubble Area */}
                  <div className="w-full flex flex-col items-center space-y-4">
                    {/* AI Question Bubble */}
                    <div className="flex items-start gap-4 w-full justify-center">
                      <div className="max-w-md">
                        <div className="bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-2xl rounded-tl-sm p-5 shadow-md space-y-2 relative">
                          <p className="font-bold text-sm leading-relaxed">
                            来中国已经一年了，你适应留学的生活了吗?
                          </p>
                          <p className="text-[11px] text-white/80 italic leading-relaxed">
                            Lái Zhōngguó yǐjīng yì nián le, nǐ shìyìng liúxué de shēnghuó le ma?
                          </p>
                          <p className="text-xs text-amber-100 font-semibold leading-relaxed">
                            Đến Trung Quốc đã một năm rồi, bạn đã thích nghi với cuộc sống du học chưa?
                          </p>
                          <button
                            onClick={() => speakChinese("来中国已经一年了，你适应留学的生活了吗")}
                            className="text-white/80 hover:text-white text-xs mt-1 cursor-pointer"
                          >
                            🔊
                          </button>
                        </div>
                      </div>
                      {/* Character Illustration */}
                      <div className="w-28 h-36 bg-gradient-to-b from-sky-100 to-sky-200 rounded-2xl flex items-end justify-center overflow-hidden shrink-0 shadow-sm">
                        <div className="text-5xl mb-2">👩‍🎓</div>
                      </div>
                    </div>

                    {/* User Response Area */}
                    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
                      <div className="text-center space-y-1.5">
                        <p className="font-bold text-gray-900 text-sm leading-relaxed">
                          刚来中国的时候不太习惯，不过现在好多了。我还交了一个中国朋友。
                        </p>
                        <button
                          onClick={() => speakChinese("刚来中国的时候不太习惯，不过现在好多了。我还交了一个中国朋友。")}
                          className="text-amber-500 hover:text-amber-600 text-sm cursor-pointer inline-block"
                        >
                          🔊
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center leading-relaxed font-medium">
                        Gāng lái Zhōngguó de shíhou bù tài xíguàn, búguò xiànzài hǎo duō le. Wǒ hái jiāole yì ge Zhōngguó péngyou.
                      </p>
                      <p className="text-xs text-amber-500 text-center italic font-semibold leading-relaxed">
                        Lúc mới đến Trung Quốc thì tôi vẫn chưa quen lắm, nhưng hiện tại đã tốt hơn nhiều rồi. Tôi còn làm quen được với một người bạn Trung Quốc.
                      </p>
                    </div>
                  </div>

                  {/* Mic Record Button */}
                  <button
                    onClick={() => speakChinese("刚来中国的时候不太习惯")}
                    className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
                    </svg>
                  </button>

                  {/* Navigation */}
                  <div className="flex justify-end w-full pt-2">
                    <button
                      onClick={() => setView("learn-extra")}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Phần tiếp <span className="text-base font-normal">&rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 12: Bài tập bổ sung (learn-extra) */}
              {view === "learn-extra" && (
                <div className="flex flex-col items-center justify-start w-full animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                    <div className="lg:col-span-2 flex items-center justify-center">
                      {/* Download Files Card */}
                      <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-10 md:p-14 shadow-xs w-full max-w-lg">
                        <div className="flex items-center justify-center gap-10 md:gap-14">
                          {/* Bài tập PDF */}
                          <button className="flex flex-col items-center gap-3 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                            <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                              <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-sm tracking-wider">PDF</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-1">
                                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-700">Bài tập</span>
                          </button>

                          {/* Đáp án PDF */}
                          <button className="flex flex-col items-center gap-3 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                            <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                              <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-sm tracking-wider">PDF</span>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-1">
                                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-700">Đáp án</span>
                          </button>

                          {/* Audio File */}
                          <button className="flex flex-col items-center gap-3 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                            <div className="w-16 h-20 bg-amber-50 border border-amber-200 rounded-lg flex flex-col items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-amber-500">
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-700">Audio</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Side note */}
                    <div className="space-y-6">
                      <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold shadow-2xs">
                        <div className="text-sm mb-2 flex items-center gap-1.5 text-amber-700 font-black">
                          <span>💡</span> Note
                        </div>
                        Đây là 3 file để người học tải về để ôn tập thêm
                      </div>
                    </div>
                  </div>

                  {/* Navigation back */}
                  <div className="flex justify-between w-full pt-6">
                    <button
                      onClick={() => setView("learn-conversation")}
                      className="text-xs font-black text-gray-500 hover:text-amber-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="text-base font-normal">&larr;</span> Phần trước
                    </button>
                    <button
                      onClick={() => setView("course-detail")}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Về lộ trình học <span className="text-base font-normal">&rarr;</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING DEMO PREVIEW TOOLBAR --- */}
      <div className="fixed bottom-4 right-4 bg-white/95 border-2 border-amber-300 p-3 rounded-2xl shadow-xl z-50 max-w-xs md:max-w-md flex flex-col gap-2 select-none backdrop-blur-xs">
        <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center justify-between border-b border-amber-100 pb-1.5">
          <span>🛠️ Demo View Controller</span>
          <span className="bg-amber-100 px-1.5 py-0.5 rounded-sm">8 View Modes</span>
        </div>
        
        {/* Row 1: App Navigation */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setView("home")}
            className={`text-[9px] font-extrabold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "home" ? "bg-amber-500 text-white shadow-xs" : "bg-gray-100 hover:bg-amber-100 text-gray-700"
            }`}
          >
            1. Trang chủ
          </button>
          <button
            onClick={() => setView("courses")}
            className={`text-[9px] font-extrabold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "courses" ? "bg-amber-500 text-white shadow-xs" : "bg-gray-100 hover:bg-amber-100 text-gray-700"
            }`}
          >
            2. Khóa học
          </button>
          <button
            onClick={() => setView("course-detail")}
            className={`text-[9px] font-extrabold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "course-detail" ? "bg-amber-500 text-white shadow-xs" : "bg-gray-100 hover:bg-amber-100 text-gray-700"
            }`}
          >
            3. Chi tiết
          </button>
        </div>

        {/* Row 2: Study Steps */}
        <div className="grid grid-cols-2 gap-1 border-t border-gray-100 pt-2">
          <button
            onClick={() => setView("learn-video-vocab")}
            className={`text-[9px] font-bold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "learn-video-vocab" ? "bg-amber-500 text-white" : "bg-gray-50 hover:bg-amber-100 text-gray-600"
            }`}
          >
            4. Học: Video Vocab (Ảnh 4)
          </button>
          <button
            onClick={() => setView("learn-quiz-vocab")}
            className={`text-[9px] font-bold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "learn-quiz-vocab" ? "bg-amber-500 text-white" : "bg-gray-50 hover:bg-amber-100 text-gray-600"
            }`}
          >
            5. Học: Quiz Vocab (Ảnh 5 & 6)
          </button>
          <button
            onClick={() => setView("learn-video-grammar")}
            className={`text-[9px] font-bold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "learn-video-grammar" ? "bg-amber-500 text-white" : "bg-gray-50 hover:bg-amber-100 text-gray-600"
            }`}
          >
            6. Học: Video Ngữ pháp (Ảnh 7)
          </button>
          <button
            onClick={() => setView("learn-quiz-grammar")}
            className={`text-[9px] font-bold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "learn-quiz-grammar" ? "bg-amber-500 text-white" : "bg-gray-50 hover:bg-amber-100 text-gray-600"
            }`}
          >
            7. Học: Quiz Ngữ pháp (Ảnh 8 & 9)
          </button>
        </div>
        
        {/* Row 3: Dictation */}
        <div className="grid grid-cols-1 border-t border-gray-100 pt-1.5">
          <button
            onClick={() => setView("learn-dictation")}
            className={`text-[9px] font-bold px-1.5 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              view === "learn-dictation" ? "bg-amber-500 text-white" : "bg-gray-50 hover:bg-amber-100 text-gray-600"
            }`}
          >
            8. Học: Nghe chép chính tả (Ảnh 10)
          </button>
        </div>
      </div>

    </div>
  );
}
