"use client";

import Image from "next/image";
import logoImg from "@/assets/SUN_CHINESE-khongnen.png";

interface SunChineseLogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  textClassName?: string;
  subtextClassName?: string;
}

export function SunChineseLogo({
  className = "",
  showText = true,
  size = 40,
  textClassName = "text-amber-500",
  subtextClassName = "text-zinc-400 dark:text-zinc-500",
}: Readonly<SunChineseLogoProps>) {
  return (
    <div className={`flex items-center gap-2 select-none group shrink-0 ${className}`}>
      <div
        className="relative flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200"
        style={{ width: size, height: size }}
      >
        <Image
          src={logoImg}
          alt="Sun Chinese Logo"
          width={size}
          height={size}
          priority
          className="object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <span className={`text-sm font-black tracking-widest ${textClassName}`}>SUN</span>
          <span className={`text-[10px] font-bold tracking-wider mt-0.5 ${subtextClassName}`}>CHINESE</span>
        </div>
      )}
    </div>
  );
}
