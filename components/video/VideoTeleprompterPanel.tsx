"use client";

import { VideoTeleprompter } from "./VideoTeleprompter";
import { SubtitleSegment } from "@/lib/types/video";

interface VideoTeleprompterPanelProps {
  items: SubtitleSegment[];
  activeIndex: number | null;
  isOpenPinyin: boolean;
  onWordPress: (word: string) => void;
  onReplayPress: (item: SubtitleSegment, index: number) => void;
  onSpeak: (text: string) => void;
}

export function VideoTeleprompterPanel({
  items,
  activeIndex,
  isOpenPinyin,
  onWordPress,
  onReplayPress,
  onSpeak,
}: Readonly<VideoTeleprompterPanelProps>) {
  return (
    <VideoTeleprompter
      items={items}
      activeIndex={activeIndex}
      isOpenPinyin={isOpenPinyin}
      onWordPress={onWordPress}
      onReplayPress={onReplayPress}
      onSpeak={onSpeak}
    />
  );
}
