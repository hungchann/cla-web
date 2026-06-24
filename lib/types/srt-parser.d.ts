declare module "srt-parser" {
  interface Subtitle {
    id: string;
    startTime: string;
    endTime: string;
    text: string;
  }

  class SrtParser {
    fromSrt(srtContent: string): Subtitle[];
    toSrt(subtitles: Subtitle[]): string;
  }

  export = SrtParser;
}
