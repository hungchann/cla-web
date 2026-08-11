import { Eye, EyeOff } from "lucide-react";

interface PinyinToggleProps {
  isOpen: boolean;
  onChange: (open: boolean) => void;
  className?: string;
}

export function PinyinToggle({ isOpen, onChange, className = "" }: PinyinToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={isOpen}
      aria-label={isOpen ? "Ẩn Pinyin" : "Hiện Pinyin"}
      onClick={() => onChange(!isOpen)}
      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isOpen
        ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-500"
        : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400"
      } ${className}`}
    >
      {isOpen ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {isOpen ? "Ẩn Pinyin" : "Hiện Pinyin"}
    </button>
  );
}
