"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { SubtitleRow } from "@/components/bilingual/SubtitleRow";
import { parseSRTtoArray } from "@/services/subtitle";
import { useThemeColors } from "@/lib/theme";
import { speakChinese, stopSpeech } from "@/lib/utils/speech";
import Link from "next/link";

// Mock SRT nội dung chi tiết bài đọc để phục vụ demo khi API rỗng
const MOCK_SRT_CONTENT: Record<string, string> = {
  "1": `1
00:00:01,000 --> 00:00:05,000
中国茶文化的历史
Trung Quốc trà văn hóa đích lịch sử
Lịch sử văn hóa trà Trung Quốc

2
00:00:05,500 --> 00:00:10,000
茶是中国人生活中不可缺少的一部分。
Trà thị Trung Quốc nhân sinh hoạt trung bất khả khuyết thiểu đích nhất bộ phân.
Trà là một phần không thể thiếu trong cuộc sống của người Trung Quốc.

3
00:00:10,500 --> 00:00:16,000
早在三千年前，中国人就开始种植茶树。
Tảo tại tam thiên niên tiền, Trung Quốc nhân tựu khai thủy chủng thực trà thụ.
Từ ba ngàn năm trước, người Trung Quốc đã bắt đầu trồng cây trà.

4
00:00:16,500 --> 00:00:22,000
唐代是茶文化发展的黄金时期，陆羽写了《茶经》。
Đường đại thị trà văn hóa phát triển đích hoàng kim thời kỳ, Lục Vũ tả liễu "Trà Kinh".
Thời Đường là thời kỳ hoàng kim của sự phát triển văn hóa trà, Lục Vũ đã viết cuốn "Trà Kinh".`,
  "2": `1
00:00:01,000 --> 00:00:05,000
北京的胡同与四合院
Bắc Kinh đích hồ đồng dữ tứ hợp viện
Hồ đồng và Tứ hợp viện ở Bắc Kinh

2
00:00:05,500 --> 00:00:10,000
胡同是北京特有的传统街道。
Hồ đồng thị Bắc Kinh đặc hữu đích truyền thống nhai đạo.
Hồ đồng là những con phố truyền thống đặc trưng của Bắc Kinh.

3
00:00:10,500 --> 00:00:15,000
四合院是胡同里的传统住宅。
Tứ hợp viện thị hồ đồng lý đích truyền thống trú trạch.
Tứ hợp viện là nhà ở truyền thống trong các hồ đồng.`,
};

// Giả lập từ vựng phân tích sẵn để click tra cứu
const MOCK_DICTIONARY: Record<string, { pinyin: string; meaning: string }> = {
  "中国": { pinyin: "Zhōngguó", meaning: "Trung Quốc" },
  "茶": { pinyin: "chá", meaning: "Trà" },
  "文化": { pinyin: "wénhuà", meaning: "Văn hóa" },
  "历史": { pinyin: "lìshǐ", meaning: "Lịch sử" },
  "不可缺少": { pinyin: "bùkě quēshǎo", meaning: "Không thể thiếu" },
  "生活": { pinyin: "shēnghuó", meaning: "Cuộc sống" },
  "开始": { pinyin: "kāishǐ", meaning: "Bắt đầu" },
  "种植": { pinyin: "zhòngzhí", meaning: "Trồng trọt, trồng trọt cây cối" },
  "茶树": { pinyin: "cháshù", meaning: "Cây trà" },
  "黄金时期": { pinyin: "huángjīn shíqī", meaning: "Thời kỳ hoàng kim" },
  "发展": { pinyin: "fāzhǎn", meaning: "Phát triển" },
  "北京": { pinyin: "Běijīng", meaning: "Bắc Kinh" },
  "胡同": { pinyin: "hútòng", meaning: "Hồ đồng (ngõ hẻm ở Bắc Kinh)" },
  "四合院": { pinyin: "sìhéyuàn", meaning: "Tứ hợp viện (nhà xây bốn phía quanh sân)" },
  "传统": { pinyin: "chuántǒng", meaning: "Truyền thống" },
  "住宅": { pinyin: "zhùzhái", meaning: "Nhà ở, trú trạch" },
};

export default function BilingualDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = use(params);
  const { colors } = useThemeColors();

  const [isOpenPinyin, setIsOpenPinyin] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ word: string; pinyin: string; meaning: string } | null>(null);
  const [srtData, setSrtData] = useState<any[]>([]);

  // Query gọi Directus API
  const { data: item, isLoading } = useQuery({
    queryKey: ["bilingual-detail", id],
    queryFn: async () => {
      try {
        const res = await bilingualApi.getBilingualItemById(id);
        return res;
      } catch (err) {
        console.warn("API error, fallback to mock details", err);
        return null;
      }
    },
  });

  // Tải & Parse phụ đề
  useEffect(() => {
    const loadSubtitle = async () => {
      if (item?.SubRip_Subtitle?.filename_disk) {
        try {
          const srtUrl = `https://marutek.space/assets/${item.SubRip_Subtitle.filename_disk}`;
          const res = await fetch(srtUrl);
          const srtText = await res.text();
          const parsed = parseSRTtoArray(srtText);
          if (parsed && parsed.length > 0) {
            // Segment từ vựng cơ bản phục vụ click
            const enriched = parsed.map((p) => ({
              ...p,
              segmentedWords: segmentChineseText(p.chinese),
            }));
            setSrtData(enriched);
            return;
          }
        } catch (e) {
          console.error("Error loading remote subtitle:", e);
        }
      }

      // Fallback sang Mock SRT
      const mockSrt = MOCK_SRT_CONTENT[id] || MOCK_SRT_CONTENT["1"];
      const parsed = parseSRTtoArray(mockSrt);
      const enriched = parsed.map((p) => ({
        ...p,
        segmentedWords: segmentChineseText(p.chinese),
      }));
      setSrtData(enriched);
    };

    loadSubtitle();
  }, [item, id]);

  // Phân đoạn chữ Hán giả lập sang các từ rời để click
  const segmentChineseText = (text: string) => {
    // Thuật toán tách từ đơn giản hoặc mock so khớp từ điển
    const words: { word: string; pinyin: string }[] = [];
    let i = 0;
    while (i < text.length) {
      let matched = false;
      // Thử matching từ 4 ký tự giảm dần
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
        // Tách ký tự đơn
        const singleChar = text[i];
        words.push({ word: singleChar, pinyin: "" });
        i++;
      }
    }
    return words;
  };

  const handleWordPress = (word: string) => {
    const dict = MOCK_DICTIONARY[word];
    if (dict) {
      setSelectedWord({ word, pinyin: dict.pinyin, meaning: dict.meaning });
      speakChinese(word);
    } else {
      setSelectedWord({ word, pinyin: "Chưa cập nhật", meaning: "Nhấp để nghe phát âm" });
      speakChinese(word);
    }
  };

  const handleReplay = (subItem: any, index: number) => {
    setActiveIndex(index);
    speakChinese(subItem.chinese);
  };

  const handleSpeakAll = () => {
    if (srtData.length === 0) return;
    stopSpeech();
    let currentIdx = 0;
    
    const speakNext = () => {
      if (currentIdx >= srtData.length) {
        setActiveIndex(null);
        return;
      }
      const line = srtData[currentIdx];
      setActiveIndex(currentIdx);
      speakChinese(line.chinese);
      
      // Giả lập thời gian chuyển dòng (tính theo độ dài chữ Hán)
      const duration = Math.max(3000, line.chinese.length * 400);
      setTimeout(() => {
        currentIdx++;
        speakNext();
      }, duration);
    };

    speakNext();
  };

  const handleStopSpeech = () => {
    stopSpeech();
    setActiveIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  const titleCN = item?.title || "Bài Đọc Song Ngữ";
  const titleVN = item?.title_trans || "Chi tiết bài học";
  const level = item?.level || "HSK";

  return (
    <div className="flex-1 flex flex-col gap-6 py-6 max-w-5xl mx-auto w-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Link
          href="/bilingual"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Quay lại danh sách
        </Link>
        
        <span className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-md">
          {level}
        </span>
      </div>

      {/* Title block */}
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">{titleCN}</h1>
        <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">{titleVN}</p>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSpeakAll}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-md shadow-amber-600/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
            </svg>
            Đọc tự động
          </button>
          
          <button
            onClick={handleStopSpeech}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-4 py-2 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-all"
          >
            Dừng đọc
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">Hiển thị Phiên âm (Pinyin):</span>
          <button
            onClick={() => setIsOpenPinyin(!isOpenPinyin)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOpenPinyin ? "bg-amber-600" : "bg-zinc-250 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isOpenPinyin ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Bilingual Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Subtitle line-by-line parser */}
        <div className="md:col-span-2 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-h-[400px]">
          {srtData.length > 0 ? (
            srtData.map((item, index) => (
              <SubtitleRow
                key={item.id}
                item={item}
                index={index}
                activeIndex={activeIndex}
                isOpenPinyin={isOpenPinyin}
                onWordPress={handleWordPress}
                colors={colors}
                onReplay={handleReplay}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl"
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              Không có dữ liệu văn bản srt.
            </div>
          )}
        </div>

        {/* Right column: Quick Dictionary / Translation Panel */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="sticky top-24 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-md font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              Tra cứu nhanh
            </h2>
            
            {selectedWord ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-500">
                    {selectedWord.word}
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">
                    {selectedWord.pinyin}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ý nghĩa:</h4>
                  <p className="mt-1 text-md font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedWord.meaning}
                  </p>
                </div>
                <button
                  onClick={() => speakChinese(selectedWord.word)}
                  className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5.075 10.812a1.25 1.25 0 0 1-1.25-1.25v-1.12a1.25 1.25 0 0 1 1.25-1.25h1.375a.75.75 0 0 0 .53-.22l3.47-3.47A.75.75 0 0 1 11.5 4v12a.75.75 0 0 1-1.3-.53l-3.47-3.47a.75.75 0 0 0-.53-.22H5.075Zm10.957-6.273a.75.75 0 0 1 1.06 0 8 8 0 0 1 0 11.322.75.75 0 1 1-1.06-1.06 6.5 6.5 0 0 0 0-9.193.75.75 0 0 1 0-1.069Z" clipRule="evenodd" />
                  </svg>
                  Nghe lại
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center justify-center text-center text-zinc-400 py-10">
                <span className="text-3xl mb-2">👆</span>
                <p className="text-xs">
                  Bấm vào chữ Hán bất kỳ trong bài đọc để tra cứu Pinyin và nghĩa Việt của từ đó ngay lập tức.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
