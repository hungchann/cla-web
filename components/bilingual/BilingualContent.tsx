"use client";

import React, { useEffect, useRef } from "react";
import { SubtitleRow } from "./SubtitleRow";

interface BilingualContentProps {
  srtData: any[];
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  onSpeakParagraph?: (chinese: string) => void;
  activeIndex?: number | null;
  onReplay?: (item: any, index: number) => void;
}

export function BilingualContent({
  srtData,
  isOpenPinyin,
  onWordPress,
  onSpeakParagraph,
  activeIndex = null,
  onReplay,
}: BilingualContentProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeIndex !== null && activeIndex !== undefined && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  if (srtData.length === 0) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-xs font-semibold">
        Không có phụ đề / nội dung hiển thị.
      </div>
    );
  }

  const handleReplayItem = (item: any, index: number) => {
    if (onReplay) {
      onReplay(item, index);
    } else if (onSpeakParagraph) {
      onSpeakParagraph(item.chinese);
    }
  };

  return (
    <div className="border border-amber-500/35 dark:border-amber-500/20 rounded-2xl p-4 md:p-6 bg-white dark:bg-zinc-900 shadow-2xs relative flex flex-col gap-3 max-h-[600px] overflow-y-auto scrollbar-thin">
      <div className="space-y-2 flex-1">
        {srtData.map((entry: any, index: number) => (
          <div key={entry.id || index} ref={(el) => { itemRefs.current[index] = el; }}>
            <SubtitleRow
              item={entry}
              index={index}
              activeIndex={activeIndex ?? null}
              isOpenPinyin={isOpenPinyin}
              onWordPress={onWordPress}
              colors={{}}
              onReplay={handleReplayItem}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
