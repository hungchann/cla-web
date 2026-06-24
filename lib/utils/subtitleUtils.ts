import { parseSRTtoArray } from "@/services/subtitle";
import { logger } from "@/services/logger";

// Convert time string to seconds - handle both comma and dot separators
export const timeToSeconds = (timeString: string): number => {
  if (!timeString || typeof timeString !== "string") {
    return 0;
  }

  try {
    // Handle both comma and dot separators for milliseconds
    const separator = timeString.includes(",") ? "," : ".";
    const [time, ms] = timeString.split(separator);
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  } catch (error) {
    logger.error("Error parsing time:", timeString, error);
    return 0;
  }
};

// Convert seconds to time string
export const secondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
};

// Get current subtitle based on video time - returns subtitle object
export const getCurrentSubtitle = (subtitles: any[], currentTimeInSeconds: number): any | null => {
  if (!subtitles || subtitles.length === 0) {
    return null;
  }

  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i];

    if (!subtitle.start || !subtitle.end) {
      logger.warn("Subtitle missing start or end time:", subtitle);
      continue;
    }

    try {
      const startTime = timeToSeconds(subtitle.start);
      const endTime = timeToSeconds(subtitle.end);

      if (currentTimeInSeconds >= startTime && currentTimeInSeconds <= endTime) {
        return subtitle; // Return the subtitle object instead of index
      }
    } catch (error) {
      logger.error("Error parsing subtitle time:", error);
      continue;
    }
  }
  return null;
};

// Get current subtitle index based on video time - returns index
export const getCurrentSubtitleIndex = (
  subtitles: any[],
  currentTimeInSeconds: number,
): number | null => {
  if (!subtitles || subtitles.length === 0) {
    return null;
  }

  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i];

    if (!subtitle.start || !subtitle.end) {
      logger.warn("Subtitle missing start or end time:", subtitle);
      continue;
    }

    try {
      const startTime = timeToSeconds(subtitle.start);
      const endTime = timeToSeconds(subtitle.end);

      if (currentTimeInSeconds >= startTime && currentTimeInSeconds <= endTime) {
        return i; // Return the index
      }
    } catch (error) {
      logger.error("Error parsing subtitle time:", error);
      continue;
    }
  }
  return null;
};

// Parse SRT file and return formatted subtitles
export const parseSRTFile = async (srtUrl: string) => {
  try {
    const response = await fetch(srtUrl);
    const srtContent = await response.text();
    return parseSRTtoArray(srtContent);
  } catch (error) {
    logger.error("Error parsing SRT file:", error);
    return [];
  }
};

// Format subtitle text for display
export const formatSubtitleText = (subtitle: any, showPinyin: boolean = false) => {
  const parts = [];

  if (subtitle.chinese) {
    parts.push(subtitle.chinese);
  }

  if (showPinyin && subtitle.pinyin) {
    parts.push(subtitle.pinyin);
  }

  if (subtitle.vietnamese) {
    parts.push(subtitle.vietnamese);
  }

  return parts.join("\n");
};

// Auto-scroll to current subtitle
export const scrollToSubtitle = (
  scrollViewRef: any,
  activeIndex: number,
  itemHeight: number = 100,
) => {
  if (scrollViewRef.current) {
    const yOffset = activeIndex * itemHeight;
    scrollViewRef.current.scrollTo({
      top: yOffset,
      behavior: "smooth",
    });
  }
};
