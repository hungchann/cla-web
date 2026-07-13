"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  readonly href?: string;
  readonly label?: string;
  readonly className?: string;
}

/**
 * BackButton — nút quay lại dùng chung cho các trang detail.
 * Nếu có `href` → dùng Link (ưu tiên). Không có → dùng router.back().
 */
export function BackButton({ href, label, className }: BackButtonProps) {
  const router = useRouter();

  const content = (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors duration-150 group">
      <ChevronLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
      {label ?? "Quay lại"}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={cn("w-fit", className)}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn("w-fit cursor-pointer", className)}
    >
      {content}
    </button>
  );
}
