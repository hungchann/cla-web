import React from "react";
import { useThemeColors } from "@/lib/theme";
import { Button } from "@/components/ui/button";

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
        className="flex flex-row justify-around items-center py-4 px-2 border-t border-solid w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      >
        {/* Previous Card */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full cursor-pointer transition-all active:scale-90"
          onClick={onPrevious}
          disabled={isFirst}
          style={{ color: isFirst ? colors.text.tertiary : colors.text.primary }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </Button>

        {/* Don't Know */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full cursor-pointer transition-all hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-90"
          onClick={() => onNext("learning")}
          style={{ color: colors.error }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </Button>

        {/* Flip Card / Uncertain */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full cursor-pointer transition-all hover:bg-amber-50 dark:hover:bg-amber-950/30 active:scale-90"
          onClick={onFlip}
          style={{ color: colors.primary }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </Button>

        {/* Know It */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full cursor-pointer transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-90"
          onClick={() => onNext("mastered")}
          style={{ color: colors.success }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </Button>
      </div>
    );
  },
);
FlashcardControls.displayName = "FlashcardControls";
