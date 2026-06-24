import { SubtitleEntry } from "@/lib/types/subtitle";

/**
 * Parses SRT subtitle content into an array of SubtitleEntry objects.
 * Handles bilingual subtitles where lines represent Chinese, Pinyin (optional), and Vietnamese.
 */
export function parseSRTtoArray(srtContent: string): SubtitleEntry[] {
  if (!srtContent) return [];

  // Normalize line endings
  const normalized = srtContent.replaceAll("\r\n", "\n").replaceAll("\r", "\n");

  // Split by double newlines to separate subtitle blocks
  const blocks = normalized.split(/\n\s*\n/);
  const result: SubtitleEntry[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const id = Number.parseInt(lines[0], 10);
    if (Number.isNaN(id)) continue;

    const timeLine = lines[1];
    if (!timeLine.includes("-->")) continue;

    const [start, end] = timeLine.split("-->").map(t => t.trim());

    const textLines = lines.slice(2);
    let chinese = "";
    let pinyin = "";
    let vietnamese = "";

    if (textLines.length === 1) {
      chinese = textLines[0];
    } else if (textLines.length === 2) {
      chinese = textLines[0];
      vietnamese = textLines[1];
    } else if (textLines.length >= 3) {
      chinese = textLines[0];
      pinyin = textLines[1];
      vietnamese = textLines.slice(2).join(" ");
    }

    result.push({
      id,
      start,
      end,
      chinese,
      vietnamese,
      pinyin: pinyin || undefined,
    });
  }

  return result;
}
