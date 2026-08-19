import React from "react";
import { Button } from "@/components/ui/button";
import { Undo2, X, RotateCw, Check, Volume2 } from "lucide-react";

interface FlashcardControlsProps {
  onNext: (status: "mastered" | "uncertain" | "learning") => void;
  onPrevious: () => void;
  onFlip?: () => void;
  onPronounce?: () => void;
  currentIndex?: number;
  isFirst: boolean;
  mode?: "flashcard" | "quiz";
}

export const FlashcardControls = React.memo<FlashcardControlsProps>(
  ({ onNext, onPrevious, onFlip, onPronounce, isFirst, mode = "flashcard" }) => {
    const handleMiddleAction = () => {
      if (mode === "quiz") {
        if (onPronounce) {
          onPronounce();
        } else if (onFlip) {
          onFlip();
        }
      } else if (onFlip) {
        onFlip();
      }
    };

    return (
      <div
        className="flex flex-wrap gap-2.5 sm:gap-4 items-center justify-center py-4 sm:py-6 px-4 border-t border-solid w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      >
        {/* Previous Card */}
        <Button
          variant="outline"
          className="h-10 px-3.5 sm:px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold font-sans text-zinc-600 dark:text-zinc-400"
          onClick={onPrevious}
          disabled={isFirst}
        >
          <Undo2 className="w-4 h-4" />
          <span>Quay lại</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-500 rounded border border-zinc-200/60 dark:border-zinc-700 ml-1">↓</kbd>
        </Button>

        {/* Don't Know */}
        <Button
          variant="outline"
          className="h-10 px-3.5 sm:px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 border-rose-200 dark:border-rose-950/40 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold font-sans"
          onClick={() => onNext("learning")}
        >
          <X className="w-4 h-4" />
          <span>Chưa thuộc</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 rounded border border-rose-200/50 dark:border-rose-900/30 ml-1">← / 2</kbd>
        </Button>

        {/* Flip Card (Flashcard Mode) or Pronounce (Quiz Mode) */}
        {mode === "quiz" ? (
          <Button
            variant="outline"
            className="h-10 px-4 sm:px-5 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 border-amber-300 dark:border-amber-950/40 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-bold font-sans"
            onClick={handleMiddleAction}
          >
            <Volume2 className="w-4 h-4" />
            <span>Phát âm</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50 dark:border-amber-900/30 ml-1">Space</kbd>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-10 px-4 sm:px-5 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 border-amber-300 dark:border-amber-950/40 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-bold font-sans"
            onClick={handleMiddleAction}
          >
            <RotateCw className="w-4 h-4" />
            <span>Lật thẻ</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50 dark:border-amber-900/30 ml-1">Space</kbd>
          </Button>
        )}

        {/* Know It */}
        <Button
          variant="outline"
          className="h-10 px-3.5 sm:px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 border-emerald-300 dark:border-emerald-950/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-sans"
          onClick={() => onNext("mastered")}
        >
          <Check className="w-4 h-4" />
          <span>Đã thuộc</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-200/50 dark:border-emerald-900/30 ml-1">→</kbd>
        </Button>
      </div>
    );
  },
);

FlashcardControls.displayName = "FlashcardControls";
export default FlashcardControls;
