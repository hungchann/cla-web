"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

// Browser Text-to-Speech handler
const speakChinese = (text: string) => {
  if (typeof window !== "undefined" && window.speechSynthesis !== undefined) {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

export default function BilingualDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = use(params);
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"content" | "vocab" | "grammar" | "shadowing" | "exercise">("content");

  // Audio Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  // Shadowing Micro State
  const [shadowState, setShadowState] = useState<"idle" | "recording" | "done">("idle");
  const [shadowSeconds, setShadowSeconds] = useState(0);

  // Quiz State
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (shadowState === "recording") {
      setShadowSeconds(0);
      timer = setInterval(() => {
        setShadowSeconds((prev) => {
          if (prev >= 3) {
            setShadowState("done");
            clearInterval(timer);
            return 3;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [shadowState]);

  const handleSetView = (newStep: string) => {
    if (newStep === "home") {
      router.push("/dashboard");
    } else if (newStep === "courses") {
      router.push("/courses");
    } else if (newStep === "bilingual-list") {
      router.push("/bilingual");
    }
  };

  const vocabData = [
    { word: "同辈", type: "Danh từ", pinyin: "tóngbèi", meaning: "Bạn đồng trang lứa", example: "他是我的同辈 (Anh ấy là bạn đồng trang lứa của tôi)" },
    { word: "压力", type: "Danh từ", pinyin: "yālì", meaning: "Áp lực", example: "面对同辈压力 (Đối mặt với áp lực đồng trang lứa)" },
    { word: "坐标系", type: "Danh từ", pinyin: "zuòbiāoxì", meaning: "Hệ tọa độ / Hệ quy chiếu", example: "建立自我坐标系 (Xây dựng hệ quy chiếu của riêng mình)" },
    { word: "纵向", type: "Tính từ", pinyin: "zòngxiàng", meaning: "Theo chiều dọc", example: "专注纵向成长 (Tập trung phát triển theo chiều dọc)" },
    { word: "横向", type: "Tính từ", pinyin: "héngxiàng", meaning: "Theo chiều ngang", example: "而非横向比较 (Thay vì so sánh theo chiều ngang)" },
  ];

  return (
    <div className="flex min-h-screen overflow-hidden bg-white text-gray-800 flex-1 -m-4 sm:-m-6 lg:-m-8">
      {/* Sidebar */}
      <Sidebar view="bilingual" setView={handleSetView} />

      {/* Main content body */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header view="bilingual" setView={handleSetView} showLogo={false} />

        <div className="p-6 md:p-8 space-y-6 max-w-3xl w-full mx-auto flex-1 flex flex-col justify-start pb-20">
          
          {/* Header titles */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">面对同辈压力</h1>
            <p className="text-sm md:text-base font-semibold text-[#d97706] italic">Đối mặt với áp lực đồng trang lứa</p>
          </div>

          {/* Banner Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xs border border-gray-150 h-56 md:h-64 w-full bg-gray-50 shrink-0">
            <Image
              src="/images/study_tablet.png"
              alt="Bilingual Study Banner"
              fill
              className="object-cover"
            />
          </div>

          {/* Audio controller - plays/pauses the audio block */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-6 justify-center">
              <button 
                onClick={() => setProgress(Math.max(0, progress - 10))}
                className="text-gray-500 hover:text-gray-900 transition-colors text-xl font-bold cursor-pointer"
              >
                ⏮
              </button>
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (!isPlaying) {
                    speakChinese("面对同辈压力，核心是建立自我坐标系。");
                  } else {
                    if (typeof window !== "undefined" && window.speechSynthesis !== undefined) {
                      window.speechSynthesis.cancel();
                    }
                  }
                }}
                className="w-10 h-10 bg-amber-400 text-gray-900 rounded-full flex items-center justify-center hover:bg-amber-500 transition-all shadow-xs active:scale-95 cursor-pointer font-bold"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button 
                onClick={() => setProgress(Math.min(100, progress + 10))}
                className="text-gray-500 hover:text-gray-900 transition-colors text-xl font-bold cursor-pointer"
              >
                ⏭
              </button>
            </div>
            
            {/* Timeline Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 select-none">0:12</span>
              <div className="flex-1 h-1.5 bg-gray-250 rounded-full relative cursor-pointer overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 select-none">0:45</span>
            </div>
          </div>

          {/* Tabs bar */}
          <div className="border-b border-gray-100 flex items-center gap-6 md:gap-8 font-bold text-xs uppercase tracking-wider text-gray-400 select-none">
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2 transition-all cursor-pointer ${
                    isActive ? "border-b-2 border-gray-900 text-gray-900" : "hover:text-gray-600"
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="space-y-6">
            
            {/* 1. Tab content: NỘI DUNG */}
            {activeTab === "content" && (
              <div className="space-y-6">
                {/* Paragraph container with orange border */}
                <div className="border border-[#f59e0b] rounded-xl p-5 md:p-6 bg-white shadow-2xs relative flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-base font-extrabold text-[#d97706] tracking-wide leading-relaxed">
                        面对同辈压力，核心是建立自我坐标系
                      </p>
                      <p className="text-xs font-bold text-gray-400 mt-1 italic">
                        Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình
                      </p>
                    </div>

                    <div className="border-t border-gray-50 pt-3 space-y-3">
                      <p className="text-sm font-bold text-gray-800 leading-relaxed">
                        管理信息 input、专注纵向成长，而非横向比较。
                      </p>
                      <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                        Quản lý lượng thông tin tiếp nhận, tập trung vào sự phát triển theo chiều dọc của bản thân, thay vì liên tục so sánh theo chiều ngang với người khác.
                      </p>
                    </div>

                    <div className="border-t border-gray-50 pt-3 space-y-3">
                      <p className="text-sm font-bold text-gray-800 leading-relaxed">
                        识别压力类型：同辈压力分
                      </p>
                      <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                        Nhận diện loại áp lực: Áp lực từ đồng trang lứa thường được chia thành:
                      </p>
                    </div>
                  </div>
                  
                  {/* Speaker Button on the right */}
                  <button
                    onClick={() => speakChinese("面对同辈压力，核心是建立自我坐标系。管理信息输入、专注纵向成长，而非横向比较。")}
                    className="w-10 h-10 border border-amber-200 hover:bg-amber-50 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-95 shrink-0 self-start mt-2"
                  >
                    🔊
                  </button>
                </div>

                {/* Vocabulary Table (rendered underneath contents) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900">Từ vựng trong bài</h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-semibold">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-black tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Từ vựng</th>
                          <th className="px-4 py-3">Từ loại</th>
                          <th className="px-4 py-3">Pinyin</th>
                          <th className="px-4 py-3">Nghĩa</th>
                          <th className="px-4 py-3">Ví dụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white text-gray-800">
                        {vocabData.map((vocab, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-extrabold text-amber-600 text-sm">{vocab.word}</td>
                            <td className="px-4 py-3 text-gray-500">{vocab.type}</td>
                            <td className="px-4 py-3 font-mono">{vocab.pinyin}</td>
                            <td className="px-4 py-3 text-gray-900">{vocab.meaning}</td>
                            <td className="px-4 py-3 text-gray-500 leading-normal">{vocab.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grammar Block */}
                <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-extrabold text-[#d97706]">Ngữ pháp nổi bật</h3>
                  <ul className="space-y-3.5 pl-4 list-disc text-xs text-gray-700 font-semibold leading-relaxed">
                    <li>
                      <span className="text-[#d97706] font-bold">而非 (ér fēi)</span>: mang ý nghĩa "mà không phải", "thay vì", dùng để làm rõ sự lựa chọn/tương phản.
                      <div className="bg-white/80 border border-amber-100 px-3 py-1.5 rounded-md mt-1 font-mono text-gray-600">
                        专注纵向成长，而非横向比较。 (Tập trung phát triển theo chiều dọc chứ không phải so sánh theo chiều ngang).
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2. Tab content: TỪ VỰNG */}
            {activeTab === "vocab" && (
              <div className="space-y-3">
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-semibold">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-black tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Từ vựng</th>
                        <th className="px-4 py-3">Từ loại</th>
                        <th className="px-4 py-3">Pinyin</th>
                        <th className="px-4 py-3">Nghĩa</th>
                        <th className="px-4 py-3">Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white text-gray-800">
                      {vocabData.map((vocab, index) => (
                        <tr key={index} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-extrabold text-amber-600 text-sm">{vocab.word}</td>
                          <td className="px-4 py-3 text-gray-500">{vocab.type}</td>
                          <td className="px-4 py-3 font-mono">{vocab.pinyin}</td>
                          <td className="px-4 py-3 text-gray-900">{vocab.meaning}</td>
                          <td className="px-4 py-3 text-gray-500 leading-normal">{vocab.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Tab content: NGỮ PHÁP */}
            {activeTab === "grammar" && (
              <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-[#d97706]">Cấu trúc ngữ pháp quan trọng</h3>
                <ul className="space-y-4 pl-4 list-disc text-xs text-gray-700 font-semibold leading-relaxed">
                  <li>
                    <span className="text-[#d97706] font-bold">而非 (ér fēi)</span>: dùng làm liên từ, mang ý nghĩa phủ định vế phía sau để khẳng định vế trước.
                    <div className="bg-white border border-amber-100 px-3 py-2 rounded-md mt-1.5 font-mono text-gray-600">
                      专注纵向成长，而非横向比较。 (Tập trung phát triển theo chiều dọc chứ không phải so sánh theo chiều ngang).
                    </div>
                  </li>
                  <li>
                    <span className="text-[#d97706] font-bold">核心是... (héxīn shì...)</span>: Cốt lõi là... dùng để xác định phần cốt tủy của giải pháp.
                    <div className="bg-white border border-amber-100 px-3 py-2 rounded-md mt-1.5 font-mono text-gray-600">
                      核心是建立自我坐标系。 (Cốt lõi là thiết lập hệ quy chiếu của riêng mình).
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {/* 4. Tab content: SHADOWING (Image 3) */}
            {activeTab === "shadowing" && (
              <div className="border border-[#f59e0b] rounded-xl p-6 bg-white shadow-2xs text-center space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Shadowing</h3>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between gap-4 max-w-md mx-auto">
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-[#d97706] tracking-wide leading-relaxed">
                      面对同辈压力，核心是建立自我坐标系
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1">
                      Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình
                    </p>
                  </div>
                  <button
                    onClick={() => speakChinese("面对同辈压力，核心是建立自我坐标系")}
                    className="w-9 h-9 border border-amber-250 hover:bg-amber-100 rounded-full flex items-center justify-center text-amber-600 cursor-pointer active:scale-90"
                  >
                    🔊
                  </button>
                </div>

                {/* Microphone Recording Component */}
                <div className="flex flex-col items-center gap-3">
                  {shadowState === "idle" && (
                    <button
                      onClick={() => setShadowState("recording")}
                      className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-800 active:scale-95 transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-4.08A7 7 0 0 0 19 10Z" />
                      </svg>
                    </button>
                  )}

                  {shadowState === "recording" && (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => setShadowState("done")}
                        className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 animate-pulse cursor-pointer"
                      >
                        <span className="w-4 h-4 bg-white rounded-xs" />
                      </button>
                      <p className="text-xs font-bold text-rose-600 tracking-wider">
                        ĐANG THU ÂM: {shadowSeconds}s / 3s
                      </p>
                    </div>
                  )}

                  {shadowState === "done" && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            speakChinese("面对同辈压力，核心是建立自我坐标系");
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          ▶ Nghe lại bài mẫu
                        </button>
                        <button
                          onClick={() => setShadowState("idle")}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          🔄 Thu lại
                        </button>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg flex items-center gap-3 text-emerald-800 font-extrabold text-xs">
                        <span className="text-lg">🎯</span>
                        <div>
                          <p>Điểm Shadowing: 92/100 (Xuất sắc)</p>
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Bạn phát âm rất chuẩn và ngữ điệu tự nhiên!</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {shadowState === "idle" && (
                    <span className="text-xs text-gray-400 font-bold">
                      Nhấn vào biểu tượng Microphone để bắt đầu luyện Shadowing
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 5. Tab content: BÀI TẬP */}
            {activeTab === "exercise" && (
              <div className="bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-xs space-y-6">
                {exerciseType === "select" ? (
                  <div className="text-center space-y-6 py-4">
                    <h3 className="text-lg font-black text-gray-900">Lựa chọn dạng bài</h3>
                    <div className="flex flex-col gap-4 max-w-xs mx-auto">
                      <button
                        onClick={() => setExerciseType("quiz")}
                        className="bg-[#f59e0b] hover:bg-amber-600 text-gray-950 font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all active:scale-98 text-sm cursor-pointer"
                      >
                        Trắc nghiệm
                      </button>
                      <button
                        onClick={() => setExerciseType("trans_zh_vi")}
                        className="bg-[#f59e0b] hover:bg-amber-600 text-gray-950 font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all active:scale-98 text-sm cursor-pointer"
                      >
                        Dịch Trung - Việt
                      </button>
                      <button
                        onClick={() => setExerciseType("trans_vi_zh")}
                        className="bg-[#f59e0b] hover:bg-amber-600 text-gray-950 font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all active:scale-98 text-sm cursor-pointer"
                      >
                        Dịch Việt - Trung
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <button
                      onClick={() => setExerciseType("select")}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
                    >
                      &larr; Quay lại dạng bài
                    </button>

                    {exerciseType === "quiz" && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                          <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                            Q1
                          </span>
                          <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
                            Từ &quot;同辈&quot; (tóngbèi) trong bài đọc có nghĩa là gì?
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: "A", val: "A. Người đi trước, tiền bối" },
                            { key: "B", val: "B. Người đồng trang lứa, bạn bè cùng tuổi" },
                            { key: "C", val: "C. Đối thủ cạnh tranh trực tiếp" },
                            { key: "D", val: "D. Người lãnh đạo, cấp trên" },
                          ].map((opt) => {
                            const isSelected = quizSelected === opt.key;
                            let btnStyle = "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50/20";

                            if (isSelected) {
                              if (opt.key === "B") {
                                btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500";
                              } else {
                                btnStyle = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500";
                              }
                            } else if (quizSelected && opt.key === "B") {
                              btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                            }

                            return (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  if (!quizSelected) setQuizSelected(opt.key);
                                }}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-xs cursor-pointer ${btnStyle}`}
                              >
                                <span>{opt.val}</span>
                              </button>
                            );
                          })}
                        </div>

                        {quizSelected && (
                          <div className={`p-4 rounded-xl border font-semibold text-xs leading-relaxed space-y-2 ${
                            quizSelected === "B"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                              : "bg-rose-50 border-rose-200 text-rose-900"
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold text-sm">
                              {quizSelected === "B" ? (
                                <span>🎉 Chính xác! Bạn đã chọn đúng ý nghĩa của từ 同辈.</span>
                              ) : (
                                <span>❌ Sai rồi! Đáp án đúng là B.</span>
                              )}
                            </div>
                            <button
                              onClick={() => setQuizSelected(null)}
                              className="text-amber-600 hover:text-amber-700 underline block cursor-pointer"
                            >
                              Làm lại
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {exerciseType === "trans_zh_vi" && (
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-900">Dịch câu sau sang tiếng Việt:</h4>
                        <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl font-bold text-md text-[#d97706]">
                          管理信息输入、专注纵向成长，而非横向比较。
                        </div>
                        <textarea
                          placeholder="Nhập bản dịch tiếng Việt của bạn..."
                          className="w-full h-24 border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => alert("Hệ thống ghi nhận bản dịch! Cốt lõi: Quản lý lượng thông tin đầu vào, tập trung vào tăng trưởng theo chiều dọc chứ không phải so sánh theo chiều ngang.")}
                          className="bg-gray-950 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-gray-800 transition-all cursor-pointer"
                        >
                          Kiểm tra kết quả
                        </button>
                      </div>
                    )}

                    {exerciseType === "trans_vi_zh" && (
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-sm text-gray-900">Dịch câu sau sang chữ Hán (Giản thể):</h4>
                        <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl font-bold text-sm text-gray-700">
                          Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình.
                        </div>
                        <input
                          type="text"
                          placeholder="Nhập câu tiếng Trung..."
                          className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => alert("Hệ thống ghi nhận bản dịch! Đáp án mẫu: 面对同辈压力，核心是建立自我坐标系。")}
                          className="bg-gray-950 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-gray-800 transition-all cursor-pointer"
                        >
                          Kiểm tra kết quả
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>

          {/* Bottom link to go back */}
          <div className="flex justify-start w-full pt-6 border-t border-gray-100">
            <Link
              href="/bilingual"
              className="text-xs font-black text-gray-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
            >
              &larr; Quay lại danh sách
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
