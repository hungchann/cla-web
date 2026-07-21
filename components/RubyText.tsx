import React from "react";

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
  const content = (
    <ruby
      className={`ruby-container select-text ${className}`}
      style={{
        color: textColor,
        fontWeight: bold ? "700" : "500",
        fontSize: fontSize ? `${fontSize}px` : undefined,
        lineHeight: "1.2",
      }}
    >
      {word}
      {pinyin ? (
        <rt
          className="ruby-pinyin select-none text-amber-600"
          style={{
            color: pinyinColor,
            fontSize: pinyinSize ? `${pinyinSize}px` : undefined,
            lineHeight: "1.2",
          }}
        >
          {pinyin}
        </rt>
      ) : null}
    </ruby>
  );

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
