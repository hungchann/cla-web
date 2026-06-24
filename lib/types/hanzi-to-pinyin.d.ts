declare module "hanzi-to-pinyin" {
  interface PinyinOptions {
    toneType?: "num" | "symbol" | "none";
    caseType?: "lowercase" | "uppercase" | "capitalize";
    removeTone?: boolean;
    removeSpace?: boolean;
    vToU?: boolean;
  }

  export function toPinyin(text: string, options?: PinyinOptions): string;
}
