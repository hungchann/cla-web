declare module "srtjs" {
  interface TimeObject {
    text: string;
    time: Date;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  }

  interface SubtitleLine {
    counter: string;
    subtitle: string;
    start: TimeObject;
    end: TimeObject;
  }

  class Srt {
    constructor(srtContent: string);
    lines: SubtitleLine[];
    parse(): void;
    shift(delta: number, unit: "hours" | "minutes" | "seconds" | "milliseconds"): void;
    updateLineTime(n: number, newStartTime: Date, newEndTime: Date): void;
    updateSrtContent(): void;
    getSrtContent(): string;
  }

  export = Srt;
}
