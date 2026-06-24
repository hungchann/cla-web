declare module "chinese-to-pinyin" {
  interface PinyinOptions {
    toneToNumber?: boolean;
    removeTone?: boolean;
    keepRest?: boolean;
    nonZh?: string;
    separator?: string;
  }
  function pinyin(text: string, options?: PinyinOptions): string;
  export = pinyin;
}
