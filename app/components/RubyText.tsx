import React from "react";

interface RubyTextProps {
  char: string;
  pinyin: string;
  className?: string;
  pinyinClassName?: string;
}

export default function RubyText({
  char,
  pinyin,
  className = "text-xl font-semibold text-gray-900",
  pinyinClassName = "text-[11px] text-amber-600 font-medium block"
}: RubyTextProps) {
  return (
    <ruby className={`${className} ruby-align`}>
      {char}
      <rt className={`${pinyinClassName} select-none text-center pb-0.5`}>{pinyin}</rt>
    </ruby>
  );
}
