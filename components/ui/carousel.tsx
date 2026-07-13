"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CarouselProps {
  readonly children: React.ReactNode[];
  readonly className?: string;
  readonly showDots?: boolean;
  readonly autoPlay?: boolean;
  readonly autoPlayInterval?: number;
}

export function Carousel({
  children,
  className,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 4000,
}: CarouselProps) {
  const [current, setCurrent] = React.useState(0);
  const total = React.Children.count(children);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = React.useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  React.useEffect(() => {
    if (!autoPlay || total <= 1) return;
    timerRef.current = setInterval(next, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, autoPlayInterval, total, next]);

  if (total === 0) return null;

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Track */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {React.Children.map(children, (child, idx) => (
          <div key={`slide-${idx}`} className="w-full shrink-0">
            {child}
          </div>
        ))}
      </div>

      {/* Prev / Next Buttons */}
      {total > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            aria-label="Slide trước"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow-md hover:bg-white dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            aria-label="Slide sau"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow-md hover:bg-white dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {Array.from({ length: total }).map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Đến slide ${idx + 1}`}
              aria-current={idx === current ? "true" : undefined}
              className={cn(
                "rounded-full transition-all duration-300",
                idx === current
                  ? "w-5 h-2 bg-amber-500"
                  : "w-2 h-2 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
