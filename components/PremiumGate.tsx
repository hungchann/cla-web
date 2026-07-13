"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface PremiumGateProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly feature?: string;
  readonly description?: string;
}

/**
 * PremiumGate — Dialog hiển thị khi user Free cố access tính năng Premium.
 * User vẫn thấy preview, nhưng interaction bị chặn.
 */
export function PremiumGate({
  isOpen,
  onClose,
  feature = "tính năng này",
  description,
}: PremiumGateProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-sm rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-2xl">
        {/* Icon badge */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>

        <AlertDialogHeader className="text-center space-y-2">
          <AlertDialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Tính năng Premium
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description ??
              `Để truy cập ${feature}, bạn cần nâng cấp lên tài khoản Premium. Mở khóa toàn bộ nội dung học tập không giới hạn.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Features list */}
        <div className="my-1 space-y-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-100 dark:border-amber-900/30">
          {[
            "Video bài giảng không giới hạn",
            "AI Luyện nói không giới hạn lượt",
            "Đọc toàn bộ sách & truyện song ngữ",
            "Bài đọc song ngữ nâng cao",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-amber-500/20"
          >
            <Link href="/pricing">
              ✨ Nâng cấp Premium ngay
            </Link>
          </Button>
          <AlertDialogCancel
            onClick={onClose}
            className="w-full border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700"
          >
            Để sau
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
