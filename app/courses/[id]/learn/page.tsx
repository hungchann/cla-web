"use client";

import Image from "next/image";
import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

function LearnRoomContent({ params }: Readonly<{ params: { id: string } }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id;

  // Retrieve current step from searchParams (default to 'learn-video-vocab')
  const currentStep = searchParams.get("step") || "learn-video-vocab";

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
    } else if (newStep.startsWith("learn")) {
      router.push(`/courses/${courseId}/learn?step=${newStep}`);
    }
  };

  // --- Voice Recording States (Video Vocab step) ---
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
                    onClick={() => handleSetView("learn-quiz-grammar")}
                    className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Phần tiếp <span className="text-base font-normal">&rarr;</span>
                  </button>
                </div>
              </div>

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

          {/* STEP 4: Bài tập ngữ pháp (learn-quiz-grammar) */}
          {currentStep === "learn-quiz-grammar" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
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
                      { key: "A", val: "Tạm biệt" },
                      { key: "B", val: "Cảm ơn" },
                      { key: "C", val: "Chào bạn" },
                      { key: "D", val: "Xin lỗi" },
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

                  {grammarSelected && (
                    <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${
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
                        <strong>Giải thích:</strong> &quot;你好 (nǐ hǎo)&quot; có nghĩa là &quot;Chào bạn&quot;, đây là lời chào cơ bản và phổ biến nhất trong tiếng Trung.
                      </p>
                      <button onClick={resetGrammarQuiz} className="text-[10px] mt-2 block text-gray-500 hover:text-amber-600 underline font-bold">
                        Thử lại câu này
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-50 select-none">
                    <button
                      onClick={() => handleSetView("learn-dictation")}
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

          {/* STEP 6: Thực hành hội thoại (learn-conversation) */}
          {currentStep === "learn-conversation" && (
            <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto space-y-6">
              <div className="w-full flex flex-col items-center space-y-4">
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
                  <div className="w-28 h-36 bg-gradient-to-b from-sky-100 to-sky-200 rounded-2xl flex items-end justify-center overflow-hidden shrink-0 shadow-sm">
                    <div className="text-5xl mb-2">👩‍🎓</div>
                  </div>
                </div>

                <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
                  <div className="text-center space-y-1.5">
                    <p className="font-bold text-gray-900 text-sm leading-relaxed">
                      刚来中国的时候不太习惯，不过现在好多了。我还交了一个中国朋友。
                    </p>
                    <button
                      onClick={() =>
                        speakChinese(
                          "刚来中国的时候不太习惯，不过现在好多了。我还交了一个中国朋友。"
                        )
                      }
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

              <button
                onClick={() => speakChinese("刚来中国的时候不太習慣")}
                className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
                </svg>
              </button>

              <div className="flex justify-end w-full pt-2">
                <button
                  onClick={() => handleSetView("learn-extra")}
                  className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Phần tiếp <span className="text-base font-normal">&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: Bài tập bổ sung (learn-extra) */}
          {currentStep === "learn-extra" && (
            <div className="flex flex-col items-center justify-start w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                <div className="lg:col-span-2 flex items-center justify-center">
                  <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-10 md:p-14 shadow-xs w-full max-w-lg">
                    <div className="flex items-center justify-center gap-10 md:gap-14">
                      {/* PDF 1 */}
                      <button className="flex flex-col items-center gap-3 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                        <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                          <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-sm tracking-wider">PDF</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-1">
                            <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-gray-700">Bài tập</span>
                      </button>

                      {/* PDF 2 */}
                      <button className="flex flex-col items-center gap-3 group cursor-pointer hover:scale-105 transition-transform active:scale-95">
                        <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center shadow-xs group-hover:shadow-md transition-shadow">
                          <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-sm tracking-wider">PDF</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-1">
                            <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-gray-700">Đáp án</span>
                      </button>

                      {/* Audio */}
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

                <div className="space-y-6">
                  <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl text-xs leading-relaxed text-amber-900 font-bold shadow-2xs">
                    <div className="text-sm mb-2 flex items-center gap-1.5 text-amber-700 font-black">
                      <span>💡</span> Note
                    </div>
                    Đây là 3 file để người học tải về để ôn tập thêm
                  </div>
                </div>
              </div>

              <div className="flex justify-between w-full pt-6 border-t border-gray-150 mt-8">
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
