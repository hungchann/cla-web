declare module "parse-srt" {
  interface Subtitle {
    id: string;
    start: string;
    end: string;
    text: string;
  }

  function parseSrt(srtContent: string): Subtitle[];
  export = parseSrt;
}
