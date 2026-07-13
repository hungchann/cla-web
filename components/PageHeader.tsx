import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

/**
 * PageHeader — dùng chung cho TẤT CẢ các trang trong app.
 * Chuẩn: h1 text-3xl font-bold, không có nền màu, nhất quán toàn app.
 */
export function PageHeader({
  title,
  description,
  icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 mt-1">
          {action}
        </div>
      )}
    </div>
  );
}
