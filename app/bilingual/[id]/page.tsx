"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { translateWord } from "@/api/apiService";
import { segmentChineseText as apiSegmentChineseText } from "@/api/segment";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { parseSRTtoArray } from "@/services/subtitle";
import { speakChinese } from "@/lib/utils/speech";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const router = useRouter();

  const [isOpenPinyin, setIsOpenPinyin] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string; meaning: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [srtData, setSrtData] = useState<any[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"content" | "vocab" | "grammar" | "shadowing" | "exercise">("content");
  const [exerciseType, setExerciseType] = useState<"select" | "quiz" | "trans_zh_vi" | "trans_vi_zh">("select");

  // Audio Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  // Shadowing Micro State
  const [shadowState, setShadowState] = useState<"idle" | "recording" | "done">("idle");
  const [shadowSeconds, setShadowSeconds] = useState(0);

  // Quiz State
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  const { data: item } = useQuery({
    queryKey: ["bilingual-detail", id],
    queryFn: () => bilingualApi.getBilingualItemById(id),
  });

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
        console.warn("API segment failed, falling back to local segmentation:", err);
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

  const handleWordPress = async (word: string) => {
    speakChinese(word);

    setSelectedWord({ word, pinyin: "Đang tải...", meaning: "Đang dịch nghĩa..." });
    setIsTranslating(true);

    try {
      const res = await translateWord(word);
      const translated = res?.[0];
      if (translated) {
        setSelectedWord({
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


  const vocabData = [
    { word: "同辈", type: "Danh từ", pinyin: "tóngbèi", meaning: "Bạn đồng trang lứa", example: "他是我的同辈 (Anh ấy là bạn đồng trang lứa của tôi)" },
    { word: "压力", type: "Danh từ", pinyin: "yālì", meaning: "Áp lực", example: "面对同辈压力 (Đối mặt với áp lực đồng trang lứa)" },
    { word: "坐标系", type: "Danh từ", pinyin: "zuòbiāoxì", meaning: "Hệ tọa độ / Hệ quy chiếu", example: "建立自我坐标系 (Xây dựng hệ quy chiếu của riêng mình)" },
    { word: "纵向", type: "Tính từ", pinyin: "zòngxiàng", meaning: "Theo chiều dọc", example: "专注纵向成长 (Tập trung phát triển theo chiều dọc)" },
    { word: "横向", type: "Tính từ", pinyin: "héngxiàng", meaning: "Theo chiều ngang", example: "而非横向比较 (Thay vì so sánh theo chiều ngang)" },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 bg-transparent">
      <div className="p-6 md:p-8 space-y-6 max-w-3xl w-full mx-auto flex-1 flex flex-col justify-start pb-20">
          <BackButton href="/bilingual" label="Danh sách bài đọc" />
          
          {/* Header titles */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">面对同辈压力</h1>
            <p className="text-sm md:text-base font-bold text-amber-600 dark:text-amber-500 italic">Đối mặt với áp lực đồng trang lứa</p>
          </div>

          {/* Banner Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-xs border border-zinc-200/60 dark:border-zinc-800 h-56 md:h-64 w-full bg-zinc-100 dark:bg-zinc-900 shrink-0">
            <Image
              src="/images/study_tablet.png"
              alt="Bilingual Study Banner"
              fill
              className="object-cover"
            />
          </div>

          {/* Audio controller - plays/pauses the audio block */}
          <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 p-5 rounded-2xl flex flex-col items-center gap-3 shadow-3xs">
            <div className="flex items-center gap-6 justify-center">
              <button 
                onClick={() => setProgress(Math.max(0, progress - 10))}
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors text-xl font-bold cursor-pointer"
              >
                ⏮
              </button>
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (!isPlaying) {
                    speakChinese("面对同辈压力，核心 is 建立自我坐标系。");
                  } else {
                    if (typeof window !== "undefined" && window.speechSynthesis !== undefined) {
                      window.speechSynthesis.cancel();
                    }
                  }
                }}
                className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all shadow-xs active:scale-95 cursor-pointer font-bold border-none"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button 
                onClick={() => setProgress(Math.min(100, progress + 10))}
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors text-xl font-bold cursor-pointer"
              >
                ⏭
              </button>
            </div>
            
            {/* Timeline Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none">0:12</span>
              <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-full relative cursor-pointer overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none">0:45</span>
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
                <button
                  onClick={() => speakChinese(selectedWord.word)}
                  className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border-none cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5.075 10.812a1.25 1.25 0 0 1-1.25-1.25v-1.12a1.25 1.25 0 0 1 1.25-1.25h1.375a.75.75 0 0 0 .53-.22l3.47-3.47A.75.75 0 0 1 11.5 4v12a.75.75 0 0 1-1.3-.53l-3.47-3.47a.75.75 0 0 0-.53-.22H5.075Zm10.957-6.273a.75.75 0 0 1 1.06 0 8 8 0 0 1 0 11.322.75.75 0 1 1-1.06-1.06 6.5 6.5 0 0 0 0-9.193.75.75 0 0 1 0-1.069Z" clipRule="evenodd" />
                  </svg>
                  Nghe lại
                </button>
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2 transition-all cursor-pointer bg-transparent border-none ${
                    isActive ? "border-b-2 border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50" : "hover:text-zinc-600 dark:hover:text-zinc-350"
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
                <div className="border border-amber-500/35 dark:border-amber-500/20 rounded-2xl p-5 md:p-6 bg-white dark:bg-zinc-900 shadow-2xs relative flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-base font-black text-amber-700 dark:text-amber-500 tracking-wide leading-relaxed">
                        面对同辈压力，核心是建立自我坐标系
                      </p>
                      <p className="text-xs font-bold text-zinc-450 dark:text-zinc-500 mt-1 italic">
                        Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3.5 space-y-3">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        管理信息 input、专注纵向成长，而非横向比较。
                      </p>
                      <p className="text-xs font-semibold text-zinc-550 dark:text-zinc-400 leading-relaxed">
                        Quản lý lượng thông tin tiếp nhận, tập trung vào sự phát triển theo chiều dọc của bản thân, thay vì liên tục so sánh theo chiều ngang với người khác.
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3.5 space-y-3">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        识别压力类型：同辈压力分
                      </p>
                      <p className="text-xs font-semibold text-zinc-550 dark:text-zinc-400 leading-relaxed">
                        Nhận diện loại áp lực: Áp lực từ đồng trang lứa thường được chia thành:
                      </p>
                    </div>
                  </div>
                  
                  {/* Speaker Button on the right */}
                  <button
                    onClick={() => speakChinese("面对同辈压力，核心是建立自我坐标系。管理信息输入、专注纵向成长，而非横向比较。")}
                    className="w-10 h-10 border border-amber-200 hover:bg-amber-50 dark:border-zinc-700 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 cursor-pointer active:scale-95 shrink-0 self-start mt-2 bg-transparent"
                  >
                    🔊
                  </button>
                </div>

                {/* Vocabulary Table (rendered underneath contents) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">Từ vựng trong bài</h3>
                  <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-3xs">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800/60 text-left text-xs font-semibold">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-black tracking-wider uppercase border-b border-zinc-150 dark:border-zinc-800">
                        <tr>
                          <th className="px-4 py-3">Từ vựng</th>
                          <th className="px-4 py-3">Từ loại</th>
                          <th className="px-4 py-3">Pinyin</th>
                          <th className="px-4 py-3">Nghĩa</th>
                          <th className="px-4 py-3">Ví dụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                        {vocabData.map((vocab, index) => (
                          <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                            <td className="px-4 py-3 font-black text-amber-650 dark:text-amber-500 text-sm">{vocab.word}</td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{vocab.type}</td>
                            <td className="px-4 py-3 font-mono">{vocab.pinyin}</td>
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{vocab.meaning}</td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 leading-normal">{vocab.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grammar Block */}
                <div className="bg-amber-500/5 dark:bg-amber-500/2 border border-amber-500/10 dark:border-amber-500/5 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-black text-amber-700 dark:text-amber-500">Ngữ pháp nổi bật</h3>
                  <ul className="space-y-3.5 pl-4 list-disc text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                    <li>
                      <span className="text-amber-650 dark:text-amber-500 font-bold">而非 (ér fēi)</span>: mang ý nghĩa "mà không phải", "thay vì", dùng để làm rõ sự lựa chọn/tương phản.
                      <div className="bg-white dark:bg-zinc-900 border border-amber-500/15 dark:border-amber-500/5 px-3 py-2 rounded-xl mt-1.5 font-mono text-zinc-600 dark:text-zinc-400">
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
                <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-3xs">
                  <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800/60 text-left text-xs font-semibold">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-black tracking-wider uppercase border-b border-zinc-150 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Từ vựng</th>
                        <th className="px-4 py-3">Từ loại</th>
                        <th className="px-4 py-3">Pinyin</th>
                        <th className="px-4 py-3">Nghĩa</th>
                        <th className="px-4 py-3">Ví dụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                      {vocabData.map((vocab, index) => (
                        <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="px-4 py-3 font-black text-amber-650 dark:text-amber-500 text-sm">{vocab.word}</td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{vocab.type}</td>
                          <td className="px-4 py-3 font-mono">{vocab.pinyin}</td>
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{vocab.meaning}</td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 leading-normal">{vocab.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Tab content: NGỮ PHÁP */}
            {activeTab === "grammar" && (
              <div className="bg-amber-500/5 dark:bg-amber-500/2 border border-amber-500/10 dark:border-amber-500/5 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-amber-700 dark:text-amber-500">Cấu trúc ngữ pháp quan trọng</h3>
                <ul className="space-y-4 pl-4 list-disc text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                  <li>
                    <span className="text-amber-650 dark:text-amber-500 font-bold">而非 (ér fēi)</span>: dùng làm liên từ, mang ý nghĩa phủ định vế phía sau để khẳng định vế trước.
                    <div className="bg-white dark:bg-zinc-900 border border-amber-500/15 dark:border-amber-500/5 px-3 py-2 rounded-xl mt-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                      专注纵向成长，而非横向比较。 (Tập trung phát triển theo chiều dọc chứ không phải so sánh theo chiều ngang).
                    </div>
                  </li>
                  <li>
                    <span className="text-amber-650 dark:text-amber-500 font-bold">核心是... (héxīn shì...)</span>: Cốt lõi là... dùng để xác định phần cốt tủy của giải pháp.
                    <div className="bg-white dark:bg-zinc-900 border border-amber-500/15 dark:border-amber-500/5 px-3 py-2 rounded-xl mt-1.5 font-mono text-zinc-600 dark:text-zinc-400">
                      核心是建立自我坐标系。 (Cốt lõi là thiết lập hệ quy chiếu của riêng mình).
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {/* 4. Tab content: SHADOWING (Image 3) */}
            {activeTab === "shadowing" && (
              <div className="border border-amber-500/35 dark:border-amber-500/20 rounded-2xl p-6 bg-white dark:bg-zinc-900 shadow-2xs text-center space-y-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Shadowing</h3>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-4 max-w-md mx-auto">
                  <div className="text-left">
                    <p className="text-sm font-black text-amber-700 dark:text-amber-500 tracking-wide leading-relaxed">
                      面对同辈压力，核心是建立自我坐标系
                    </p>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-1">
                      Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình
                    </p>
                  </div>
                  <button
                    onClick={() => speakChinese("面对同辈压力，核心是建立自我坐标系")}
                    className="w-9 h-9 border border-amber-250 dark:border-zinc-700 hover:bg-amber-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 cursor-pointer active:scale-90 bg-transparent"
                  >
                    🔊
                  </button>
                </div>

                {/* Microphone Recording Component */}
                <div className="flex flex-col items-center gap-3">
                  {shadowState === "idle" && (
                    <button
                      onClick={() => setShadowState("recording")}
                      className="w-16 h-16 bg-zinc-900 dark:bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer border-none"
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
                        className="w-16 h-16 bg-[#e11d48] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 animate-pulse cursor-pointer border-none"
                      >
                        <span className="w-4 h-4 bg-white rounded-xs" />
                      </button>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-455 tracking-wider">
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
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer border-none"
                        >
                          ▶ Nghe lại bài mẫu
                        </button>
                        <button
                          onClick={() => setShadowState("idle")}
                          className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer border-none"
                        >
                          Thử lại
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Tab content: BÀI TẬP */}
            {activeTab === "exercise" && (
              <Card className="p-5 md:p-6 shadow-2xs space-y-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                {exerciseType === "select" ? (
                  <div className="text-center space-y-6 py-4">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">Lựa chọn dạng bài</h3>
                    <div className="flex flex-col gap-4 max-w-xs mx-auto">
                      <Button
                        onClick={() => setExerciseType("quiz")}
                        className="py-6 rounded-2xl text-sm font-extrabold"
                      >
                        Trắc nghiệm
                      </Button>
                      <Button
                        onClick={() => setExerciseType("trans_zh_vi")}
                        className="py-6 rounded-2xl text-sm font-extrabold"
                      >
                        Dịch Trung - Việt
                      </Button>
                      <Button
                        onClick={() => setExerciseType("trans_vi_zh")}
                        className="py-6 rounded-2xl text-sm font-extrabold"
                      >
                        Dịch Việt - Trung
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Button
                      variant="link"
                      onClick={() => setExerciseType("select")}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-650 flex items-center gap-1 p-0 h-auto"
                    >
                      &larr; Quay lại dạng bài
                    </Button>

                    {exerciseType === "quiz" && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm select-none border-amber-500/20 text-amber-600 dark:text-amber-500 bg-amber-500/5">
                            Q1
                          </Badge>
                          <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm md:text-base">
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
                            let btnStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:border-amber-300 dark:hover:border-amber-500";

                            if (isSelected) {
                              if (opt.key === "B") {
                                btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 ring-2 ring-emerald-500/30";
                              } else {
                                btnStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-455 ring-2 ring-rose-500/30";
                              }
                            } else if (quizSelected && opt.key === "B") {
                              btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-455";
                            }

                            return (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  if (!quizSelected) setQuizSelected(opt.key);
                                }}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-xs cursor-pointer ${btnStyle}`}
                              >
                                <span>{opt.val}</span>
                              </button>
                            );
                          })}
                        </div>

                        {quizSelected && (
                          <div className={`p-4 rounded-2xl border font-semibold text-xs leading-relaxed space-y-2 ${
                            quizSelected === "B"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-450"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-455"
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold text-sm">
                              {quizSelected === "B" ? (
                                <span>🎉 Chính xác! Bạn đã chọn đúng ý nghĩa của từ 同辈.</span>
                              ) : (
                                <span>❌ Sai rồi! Đáp án đúng là B.</span>
                              )}
                            </div>
                            <Button
                              variant="link"
                              onClick={() => setQuizSelected(null)}
                              className="text-amber-650 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 underline block cursor-pointer p-0 h-auto font-bold text-xs"
                            >
                              Làm lại
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {exerciseType === "trans_zh_vi" && (
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Dịch câu sau sang tiếng Việt:</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl font-bold text-md text-amber-700 dark:text-amber-500">
                          管理信息输入、专注纵向成长，而非横向比较。
                        </div>
                        <Textarea
                          placeholder="Nhập bản dịch tiếng Việt của bạn..."
                          className="w-full h-24 text-xs font-semibold"
                        />
                        <Button
                          onClick={() => alert("Hệ thống ghi nhận bản dịch! Cốt lõi: Quản lý lượng thông tin đầu vào, tập trung vào tăng trưởng theo chiều dọc chứ không phải so sánh theo chiều ngang.")}
                          className="font-bold text-xs px-5 py-2"
                        >
                          Kiểm tra kết quả
                        </Button>
                      </div>
                    )}

                    {exerciseType === "trans_vi_zh" && (
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Dịch câu sau sang chữ Hán (Giản thể):</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl font-bold text-sm text-zinc-700 dark:text-zinc-300">
                          Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình.
                        </div>
                        <Input
                          type="text"
                          placeholder="Nhập câu tiếng Trung..."
                          className="w-full text-xs font-semibold"
                        />
                        <Button
                          onClick={() => alert("Hệ thống ghi nhận bản dịch! Đáp án mẫu: 面对同辈压力，核心是建立自我坐标系。")}
                          className="font-bold text-xs px-5 py-2"
                        >
                          Kiểm tra kết quả
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
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
      </div>
  );
}
