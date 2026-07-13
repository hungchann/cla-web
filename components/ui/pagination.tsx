import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly siblingCount?: number;
  readonly className?: string;
}

function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | "left-ellipsis" | "right-ellipsis")[] {
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  const range: (number | "left-ellipsis" | "right-ellipsis")[] = [];

  // Always show first page
  range.push(1);

  if (showLeftEllipsis) {
    range.push("left-ellipsis");
  } else {
    for (let i = 2; i < leftSiblingIndex; i++) range.push(i);
  }

  // Push middle range (excluding first and last page to prevent duplication)
  const start = Math.max(leftSiblingIndex, 2);
  const end = Math.min(rightSiblingIndex, totalPages - 1);
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (showRightEllipsis) {
    range.push("right-ellipsis");
  } else {
    for (let i = rightSiblingIndex + 1; i < totalPages; i++) range.push(i);
  }

  // Always show last page
  if (totalPages > 1) range.push(totalPages);

  return range;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPaginationRange(currentPage, totalPages, siblingCount);

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng phân trang"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* Prev */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Trang trước"
        className="h-9 w-9 rounded-lg"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {pages.map((page) =>
        page === "left-ellipsis" || page === "right-ellipsis" ? (
          <span
            key={page}
            className="flex h-9 w-9 items-center justify-center text-zinc-400"
            aria-hidden
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? "page" : undefined}
            aria-label={`Trang ${page}`}
            className={cn(
              "h-9 w-9 rounded-lg text-sm font-semibold",
              currentPage === page &&
                "bg-amber-600 text-white hover:bg-amber-700 border-amber-600"
            )}
          >
            {page}
          </Button>
        )
      )}

      {/* Next */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
        className="h-9 w-9 rounded-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
