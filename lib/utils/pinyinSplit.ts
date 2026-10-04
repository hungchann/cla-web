const TONE_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜếềńňḿ]/;
const MAIN_VOWEL = /[aoeāáǎàēéěèōóǒò]/;
const VOWEL = /[aeiouüvê]/;

export function splitPinyinSyllables(pinyin: string, charCount: number): string[] | null {
  if (!pinyin || charCount < 2) return null;

  const spaced = pinyin.trim().split(/\s+/).filter(Boolean);
  if (spaced.length === charCount) return spaced;

  const text = pinyin.replace(/[\s'’·‧.]+/g, "");
  if (!TONE_MARK.test(text)) return null;

  const pieces: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (!TONE_MARK.test(text[i])) continue;

    let k = i - 1;
    while (k >= start && VOWEL.test(text[k])) k--;
    while (k >= start && !VOWEL.test(text[k])) k--;
    const syllStart = Math.max(k + 1, start);

    const gap = text.slice(start, syllStart);
    if (gap) pieces.push(gap);

    let end = i + 1;
    if (MAIN_VOWEL.test(text[i])) {
      while (end < text.length && VOWEL.test(text[end]) && !TONE_MARK.test(text[end])) end++;
    }
    if (text[end] === "n" && text[end + 1] === "g") end += 2;
    else if (text[end] === "n" || text[end] === "r") {
      const after = text[end + 1];
      if (!after || !VOWEL.test(after)) end += 1;
    }

    pieces.push(text.slice(syllStart, end));
    start = end;
    i = end - 1;
  }

  const tail = text.slice(start);
  const need = charCount - pieces.length;
  if (need === 0 && !tail) return pieces;
  if (need === 1 && tail) return [...pieces, tail];

  // ponytail: syllable chưa tách được (nhiều âm tiết trung tính liền nhau / sai số ký tự)
  // → trả null để RubyText hiển thị pinyin gộp như trước, không vỡ giao diện.
  return null;
}

export default splitPinyinSyllables;
