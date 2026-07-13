"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FilterPillsProps {
  readonly options: string[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
  readonly getId?: (option: string) => string;
  readonly getLabel?: (option: string) => string;
}

export function FilterPills({
  options,
  value,
  onChange,
  className,
  getId = (o) => o,
  getLabel = (o) => o,
}: FilterPillsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Bộ lọc"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const id = getId(option);
        const label = getLabel(option);
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none cursor-pointer border",
              isActive
                ? "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/20"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-500"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
