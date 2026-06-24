// ============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO TÍNH NĂNG SHADOWING (LUYỆN PHÁT ÂM)
// ============================================================================

// Cấu trúc dữ liệu cho một dòng phụ đề (SRT line)
export interface SRTLine {
  id: number; // Unique identifier for the line
  start: string; // Thời điểm bắt đầu (SRT format: "HH:MM:SS,mmm")
  end: string; // Thời điểm kết thúc (SRT format: "HH:MM:SS,mmm")
  text: string; // Văn bản của dòng phụ đề
  chinese?: string; // Văn bản tiếng Trung (nếu có)
  vietnamese?: string; // Văn bản tiếng Việt (nếu có)
  segmentedWords?: { word: string; pinyin: string }[]; // Tách từ + pinyin nếu có
}

// Word-level analysis from iFLYTEK API
export interface WordAnalysis {
  word: string;
  status: "correct" | "mispronounced" | "missing" | "extra";
  accuracy: number;
  startTime?: number;
  endTime?: number;
}

// iFLYTEK Audio Processing Result (Updated to match plan requirements)
export interface AudioProcessingResult {
  transcript?: string;
  pronunciation_assessment?: {
    accuracy_score: number;
    fluency_score: number;
    completeness_score: number;
    pronunciation_score: number;
  };
  wordDetails?: WordAnalysis[];
  isRejected?: boolean;
  duration?: number;
  error?: string; // Error message if processing failed
}

// Tùy chọn xử lý âm thanh cho shadowing (simplified)
export interface AudioProcessingOptions {
  language?: string; // Ngôn ngữ (mặc định: zh-CN - Tiếng Trung giản thể)
  referenceText?: string; // Văn bản tham chiếu để đánh giá phát âm
  maxRetries?: number; // Số lần thử lại tối đa nếu thất bại
}

// Cấu hình cho tính năng shadowing (simplified)
export interface ShadowingConfig {
  minDuration?: number; // Thời lượng tối thiểu cho một đoạn ghi âm (giây)
  maxDuration?: number; // Thời lượng tối đa cho một đoạn ghi âm (giây)
  maxFileSize?: number; // Kích thước file tối đa (bytes)
  allowedFormats?: string[]; // Các định dạng file được phép (.mp3, .m4a, .wav, v.v.)
}

// Unified Audio Source Interface for Video and Audio sources
export interface AudioSource {
  type: "video" | "audio";
  uri: string;
  extractAudio(): Promise<ArrayBuffer>;
  getDuration(): Promise<number>;
}

// Source Adapter Types
export interface VideoAdapter extends AudioSource {
  type: "video";
}

export interface AudioAdapter extends AudioSource {
  type: "audio";
}

// ============================================================================
// SENTENCE-BY-SENTENCE SHADOWING TYPES
// ============================================================================

// Result for a single sentence shadowing
export interface SentenceResult {
  sentence: SRTLine;
  result: AudioProcessingResult;
  isCompleted: boolean;
  isProcessing: boolean;
  error?: string;
}

// Sentence shadowing state
export interface SentenceShadowingState {
  currentSentenceIndex: number;
  sentenceResults: SentenceResult[];
  isRecording: boolean;
  hasRecorded: boolean;
  isProcessing: boolean;
  totalSentences: number;
  completedSentences: number;
}

// Sentence navigation props
export interface SentenceNavigationProps {
  currentIndex: number;
  totalSentences: number;
  completedSentences: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToSentence: (index: number) => void;
  disabled?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS FOR SRT TIME HANDLING
// ============================================================================

/**
 * Convert SRT time string to milliseconds
 * @param timeString SRT format: "HH:MM:SS,mmm"
 * @returns Time in milliseconds
 */
export function srtTimeToMs(timeString: string): number {
  const match = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return 0;

  const hours = parseInt(match[1]) * 3600000;
  const minutes = parseInt(match[2]) * 60000;
  const seconds = parseInt(match[3]) * 1000;
  const milliseconds = parseInt(match[4]);

  return hours + minutes + seconds + milliseconds;
}

/**
 * Convert milliseconds to SRT time string
 * @param ms Time in milliseconds
 * @returns SRT format: "HH:MM:SS,mmm"
 */
export function msToSrtTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
}

/**
 * Parse SRT content and return SRTLine array
 * @param content Raw SRT file content
 * @returns Array of SRTLine objects
 */
export function parseSRTContent(content: string): SRTLine[] {
  const blocks = content.split("\n\n").filter((block) => block.trim());

  return blocks
    .map((block, index) => {
      const lines = block.split("\n");
      if (lines.length < 3) return null;

      const timeMatch = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/,
      );
      if (!timeMatch) return null;

      return {
        id: index + 1,
        start: timeMatch[1] + ":" + timeMatch[2] + ":" + timeMatch[3] + "," + timeMatch[4],
        end: timeMatch[5] + ":" + timeMatch[6] + ":" + timeMatch[7] + "," + timeMatch[8],
        text: lines.slice(2).join(" ").trim(),
        chinese: lines.slice(2).join(" ").trim(),
        segmentedWords: [],
      } as SRTLine;
    })
    .filter(Boolean) as SRTLine[];
}
