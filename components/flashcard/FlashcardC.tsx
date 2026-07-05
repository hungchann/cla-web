import React from "react";
import { useTheme, useThemeColors } from "@/lib/theme";

interface FlashcardCardProps {
  isFlipped: boolean;
  onFlip: () => void;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
}

export const FlashcardCard = React.memo<FlashcardCardProps>(
  ({ isFlipped, onFlip, frontContent, backContent }) => {
    const { colors } = useThemeColors();
    const { actualTheme } = useTheme();
    const isDark = actualTheme === "dark";

    const cardBgColor = isDark ? colors.background.secondary : colors.secondary;
    const cardBorderColor = isDark ? colors.primary : "transparent";
    const cardBorderWidth = isDark ? "1.5px" : "0px";

    const backBgColor = isDark ? colors.background.card : colors.background.tertiary;
    const backBorderColor = isDark ? colors.border.secondary : "transparent";
    const backBorderWidth = isDark ? "1px" : "0px";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onFlip();
      }
    };

    return (
      <div 
        role="button"
        tabIndex={0}
        className="w-full h-full flex items-center justify-center cursor-pointer select-none focus:outline-none bg-transparent border-none p-0 text-left items-stretch"
        style={{ perspective: "1000px" }}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
      >
        <div 
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 w-full h-full rounded-[24px] shadow-lg flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              backgroundColor: cardBgColor,
              borderColor: cardBorderColor,
              borderWidth: cardBorderWidth,
              borderStyle: isDark ? "solid" : "none",
              zIndex: isFlipped ? 0 : 1,
            }}
          >
            <div className="flex-1 w-full h-full">
              {frontContent}
            </div>
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 w-full h-full rounded-[24px] shadow-lg flex flex-col overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: backBgColor,
              borderColor: backBorderColor,
              borderWidth: backBorderWidth,
              borderStyle: isDark ? "solid" : "none",
              zIndex: isFlipped ? 1 : 0,
            }}
          >
            <div className="flex-1 w-full h-full">
              {backContent}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
FlashcardCard.displayName = "FlashcardCard";
