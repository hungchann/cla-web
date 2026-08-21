export interface SubtitleEntry {
  id: number;
  start: string;
  end: string;
  chinese: string;
  vietnamese: string;
  pinyin?: string;
  rawText?: string;
  segmentedWords?: { word: string; pinyin: string }[];
}

export interface ParsedSubtitle {
  id: number;
  start: string;
  end: string;
  text: string;
}

