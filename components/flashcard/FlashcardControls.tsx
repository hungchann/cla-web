import React from "react";
import { useThemeColors } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Undo2, X, RotateCw, Check } from "lucide-react";

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
        className="flex flex-wrap gap-4 items-center justify-center py-6 px-4 border-t border-solid w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      >
        {/* Previous Card */}
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold font-sans text-zinc-500"
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
          className="h-10 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-rose-250 dark:border-rose-950/30 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-rose-600 text-xs font-bold font-sans"
          onClick={() => onNext("learning")}
        >
          <X className="w-4 h-4" />
          <span>Chưa thuộc</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 rounded border border-rose-200/50 dark:border-rose-900/30 ml-1">← / 2</kbd>
        </Button>

        {/* Flip Card / Uncertain */}
        <Button
          variant="outline"
          className="h-10 px-5 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-amber-250 dark:border-amber-950/30 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-500 text-xs font-bold font-sans"
          onClick={onFlip}
        >
          <RotateCw className="w-4 h-4" />
          <span>Lật thẻ</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-200/50 dark:border-amber-900/30 ml-1">Space</kbd>
        </Button>

        {/* Know It */}
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-emerald-250 dark:border-emerald-950/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-emerald-600 text-xs font-bold font-sans"
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
