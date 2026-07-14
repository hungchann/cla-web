import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: React.ReactNode;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

/**
 * PageHeader — dùng chung cho TẤT CẢ các trang trong app.
 * Đã được nâng cấp lên giao diện cao cấp: có bo góc 3xl, viền mỏng, gradient nền nhẹ và hiệu ứng phát sáng.
 */
export function PageHeader({
  title,
  description,
  icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800 p-6 md:p-8 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 dark:from-amber-950/10 dark:via-zinc-900/40 dark:to-zinc-900/10 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6",
        className
      )}
    >
      {/* Decorative Orbs */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 w-44 h-44 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-orange-500/5 dark:bg-orange-500/2 blur-2xl pointer-events-none" />

      <div className="flex items-start gap-4 z-10">
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 flex items-center justify-center text-3xl select-none shrink-0 shadow-inner">
            <span aria-hidden="true">{icon}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed max-w-2xl mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {action && (
        <div className="shrink-0 z-10 self-start sm:self-center mt-1 sm:mt-0">
          {action}
        </div>
      )}
    </div>
  );
}
