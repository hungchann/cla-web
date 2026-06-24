import { SubtitleEntry } from "@/lib/types/subtitle";
import { logger } from "@/services/logger";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSubtitleSync(params: {
  subtitles: SubtitleEntry[];
  timeToSeconds: (timeStr: string) => number;
  leadTimeSeconds?: number;
}) {
  const { subtitles, timeToSeconds, leadTimeSeconds = 0.1 } = params;

  const subtitleTimestampsRef = useRef<{ start: number; end: number; index: number }[]>([]);

  useEffect(() => {
    subtitleTimestampsRef.current = subtitles
      .map((sub, index) => {
        try {
          const start = sub.start ? timeToSeconds(sub.start) : 0;
          const end = sub.end ? timeToSeconds(sub.end) : Infinity;
          return { start, end, index };
        } catch (error) {
          logger.warn("Error parsing subtitle time", error);
          return { start: 0, end: Infinity, index };
        }
      })
      .sort((a, b) => a.start - b.start);
  }, [subtitles, timeToSeconds]);

  const binarySearchSubtitle = useCallback(
    (currentTimeSeconds: number, lookaheadSeconds: number = 0): number | null => {
      const timestamps = subtitleTimestampsRef.current;
      if (timestamps.length === 0) return null;

      const searchTime = currentTimeSeconds + lookaheadSeconds;
      let left = 0;
      let right = timestamps.length - 1;

      if (searchTime < timestamps[0].start) {
        return null;
      }
      if (searchTime > timestamps[right].end) {
        return null;
      }

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const { start, end, index } = timestamps[mid];

        if (searchTime >= start && searchTime <= end) {
          return index;
        }

        if (searchTime < start) {
          right = mid - 1;
        } else if (searchTime > end) {
          left = mid + 1;
        } else {
          break;
        }
      }

      return null;
    },
    [],
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const computeActiveIndex = useCallback(
    (currentSeconds: number) => {
      const idx = binarySearchSubtitle(currentSeconds, leadTimeSeconds);
      setActiveIndex(idx);
      return idx;
    },
    [binarySearchSubtitle, leadTimeSeconds],
  );

  return {
    subtitleTimestampsRef,
    binarySearchSubtitle,
    activeIndex,
    setActiveIndex,
    computeActiveIndex,
  };
}
