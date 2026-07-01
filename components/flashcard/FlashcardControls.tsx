import React from "react";
import { useThemeColors } from "@/lib/theme";

interface FlashcardControlsProps {
  onNext: (status: "mastered" | "uncertain" | "learning") => void;
  onPrevious: () => void;
  onFlip: () => void;
  currentIndex: number;
  isFirst: boolean;
}

export const FlashcardControls = React.memo<FlashcardControlsProps>(
  ({ onNext, onPrevious, onFlip, isFirst }) => {
    const { colors } = useThemeColors();

    return (
      <div
        className="flex flex-row justify-around items-center py-4 px-2 border-t border-solid w-full"
        style={{
          borderTopColor: colors.border.primary,
          backgroundColor: colors.background.primary,
        }}
      >
        {/* Previous Card */}
        <button
          className={`p-3 flex items-center justify-center border-none bg-transparent cursor-pointer transition-opacity ${isFirst ? "opacity-30 cursor-not-allowed" : "hover:opacity-85 active:opacity-70"}`}
          onClick={onPrevious}
          disabled={isFirst}
          style={{ color: isFirst ? colors.text.tertiary : colors.text.primary }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>

        {/* Don't Know */}
        <button 
          className="p-3 flex items-center justify-center border-none bg-transparent cursor-pointer hover:opacity-85 active:opacity-70" 
          onClick={() => onNext("learning")}
          style={{ color: colors.error }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Flip Card / Uncertain */}
        <button 
          className="p-3 flex items-center justify-center border-none bg-transparent cursor-pointer hover:opacity-85 active:opacity-70" 
          onClick={onFlip}
          style={{ color: colors.primary }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </button>

        {/* Know It */}
        <button 
          className="p-3 flex items-center justify-center border-none bg-transparent cursor-pointer hover:opacity-85 active:opacity-70" 
          onClick={() => onNext("mastered")}
          style={{ color: colors.success }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </button>
      </div>
    );
  },
);
FlashcardControls.displayName = "FlashcardControls";
