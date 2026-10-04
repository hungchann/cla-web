import React from "react";
import { splitPinyinSyllables } from "@/lib/utils/pinyinSplit";

interface RubyTextProps {
  word: React.ReactNode;
  pinyin?: string;
  fontSize?: number;
  pinyinSize?: number;
  textColor?: string;
  pinyinColor?: string;
  bold?: boolean;
  className?: string;
  containerClassName?: string;
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const RubyText = ({
  word,
  pinyin,
  fontSize,
  pinyinSize,
  textColor,
  pinyinColor,
  bold = false,
  className = "",
  containerClassName = "",
  onPress,
}: RubyTextProps) => {
  const showPinyin = Boolean(pinyin) && /\p{Script=Latin}/u.test(pinyin as string);
  const chars = typeof word === "string" ? Array.from(word) : null;
  const syllables = showPinyin && chars ? splitPinyinSyllables(pinyin as string, chars.length) : null;

  const renderRuby = (text: React.ReactNode, syl?: string) => (
    <ruby
      className={`ruby-container select-text ${className}`}
      style={{
        color: textColor,
        fontWeight: bold ? "700" : "500",
        fontSize: fontSize ? `${fontSize}px` : undefined,
        lineHeight: "1.2",
      }}
    >
      {text}
      {syl ? (
        <rt
          className="ruby-pinyin select-none text-amber-600"
          style={{
            color: pinyinColor,
            fontSize: pinyinSize ? `${pinyinSize}px` : undefined,
            lineHeight: "1.2",
          }}
        >
          {syl}
        </rt>
      ) : null}
    </ruby>
  );

  const content =
    syllables && chars
      ? syllables.map((syl, i) => (
          <React.Fragment key={`${i}-${syl}`}>{renderRuby(chars[i], syl)}</React.Fragment>
        ))
      : renderRuby(word, showPinyin ? pinyin : undefined);

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`focus:outline-none hover:opacity-80 active:opacity-60 cursor-pointer bg-transparent border-none p-0 inline-flex align-bottom ${containerClassName}`}
      >
        {content}
      </button>
    );
  }

  return <span className={`inline-flex align-bottom ${containerClassName}`}>{content}</span>;
};

export default RubyText;
