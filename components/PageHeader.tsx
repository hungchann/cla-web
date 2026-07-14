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
 * PageHeader — tiêu đề route dùng chung trong app shell.
 * Giữ phần nội dung nhẹ, không tạo thêm một "card shell" bên trong shell chính.
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
        "relative flex flex-col gap-4 border-b border-amber-950/10 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-400/15 text-amber-700 shadow-sm shadow-amber-500/10">
            <span aria-hidden="true">{icon}</span>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black tracking-tight text-zinc-950 md:text-3xl dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {action && (
        <div className="mt-1 shrink-0 self-start sm:self-auto">
          {action}
        </div>
      )}
    </div>
  );
}
