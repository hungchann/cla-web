import React, { useState } from "react";
import { useThemeColors } from "@/lib/theme";
import { RubyText } from "../RubyText";

export default function VideoDetailedVocabExercise() {
  const { colors } = useThemeColors();
  const [selected, setSelected] = useState<number | null>(null);

  const options = [
    { id: 1, hanzi: "老的", pinyin: "Lǎo de" },
    { id: 2, hanzi: "丰富", pinyin: "Fēngfù" },
    { id: 3, hanzi: "苹果", pinyin: "Píngguǒ" },
    { id: 4, hanzi: "青春 của", pinyin: "Qīngchūn de" },
  ];

  return (
    <div 
      className="flex flex-col w-full h-full min-h-screen font-sans"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header */}
      <header 
        className="h-14 flex items-center justify-between px-4 border-b border-solid"
        style={{ borderBottomColor: colors.border.primary }}
      >
        <button 
          onClick={() => {}} 
          className="p-1 cursor-pointer bg-transparent border-none"
          style={{ color: colors.text.secondary }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span 
          className="text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          Bài tập chi tiết
        </span>
        <button 
          className="p-1 cursor-pointer bg-transparent border-none"
          style={{ color: colors.text.secondary }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-60">
        <div className="flex flex-row justify-between items-center mt-4 mb-5">
          <span 
            className="text-base font-bold"
            style={{ color: colors.text.primary }}
          >
            Từ vựng video
          </span>
          <span 
            className="text-xs font-semibold"
            style={{ color: colors.text.secondary }}
          >
            1/20
          </span>
        </div>

        {/* Question Block */}
        <div 
          className="p-4 rounded-xl mb-6 flex flex-row gap-2"
          style={{ backgroundColor: colors.background.tertiary }}
        >
          <span 
            className="text-lg font-bold"
            style={{ color: colors.text.primary }}
          >
            1.
          </span>
          <div className="flex-1 flex flex-col">
            <p 
              className="text-lg font-normal"
              style={{ color: colors.text.primary }}
            >
              中国是一个拥有悠久历史和 (_____) 文化的国家。
            </p>
            <p 
              className="text-base italic mt-2"
              style={{ color: colors.text.secondary }}
            >
              Zhōngguó shì yīgè yǒngyǒu yōujiǔ lìshǐ hé (_____) wénhuà de guójiā.
            </p>
          </div>
        </div>
      </div>

      {/* Options Panel (Sticky Bottom) */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 rounded-t-3xl shadow-xl flex flex-col gap-2.5 max-w-md mx-auto"
        style={{ backgroundColor: colors.background.tertiary }}
      >
        {options.map((item) => {
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className="w-full py-3.5 px-4 rounded-xl border border-solid flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{ 
                backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                borderColor: isSelected ? colors.primary : "transparent",
                borderWidth: "1px",
              }}
            >
              <RubyText
                word={item.hanzi}
                pinyin={item.pinyin}
                textColor={isSelected ? colors.text.inverse : colors.text.primary}
                pinyinColor={isSelected ? colors.text.inverse : colors.text.secondary}
                bold
                fontSize={20}
                pinyinSize={12}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
