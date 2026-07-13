"use client";

import React, { useEffect, useState, useRef } from "react";
import { registerAIConsentPrompt, unregisterAIConsentPrompt } from "@/services/aiConsentGate";
import { acceptAIConsent } from "@/lib/ai/aiConsentStorage";
import { useThemeColors } from "@/lib/theme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AIConsentProviderProps {
  children: React.ReactNode;
}

export default function AIConsentProvider({ children }: Readonly<AIConsentProviderProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const { colors } = useThemeColors();

  useEffect(() => {
    // Đăng ký prompt handler với hệ thống kiểm soát consent
    registerAIConsentPrompt(() => {
      setIsOpen(true);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    });

    return () => {
      unregisterAIConsentPrompt();
    };
  }, []);

  const handleAccept = async () => {
    try {
      await acceptAIConsent();
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      }
    } catch (error) {
      console.error("[AIConsentProvider] Lỗi lưu chấp thuận:", error);
    } finally {
      setIsOpen(false);
    }
  };

  const handleDecline = () => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setIsOpen(false);
  };

  return (
    <>
      {children}

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="w-full max-w-md p-6 flex flex-col gap-5">
          <AlertDialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-11.825a.9.9 0 0 0-.693-1.428H12.24l.89-5.1a.9.9 0 0 0-1.57-.655L2.5 13.82a.9.9 0 0 0 .693 1.428H9.81v-.016Z" />
                </svg>
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-extrabold tracking-tight">Kích hoạt tính năng thông minh AI</AlertDialogTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Đồng ý chia sẻ dữ liệu để học tập tốt hơn</p>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-655 dark:text-zinc-300 font-medium">
              <p>
                Chào bạn! Để sử dụng các tính năng nâng cao trợ lực từ trí tuệ nhân tạo (AI):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Tra cứu từ điển đa nghĩa trực tiếp qua bài đọc & video.</li>
                <li>Phân tách ngữ pháp, cụm từ tiếng Trung thông minh (Segmentation).</li>
                <li>Chấm điểm phát âm chuẩn HSK khi luyện hội thoại & shadowing.</li>
              </ul>
              <p>
                Hệ thống cần gửi tạm thời văn bản hoặc file ghi âm phát âm của bạn đến máy chủ xử lý AI (OpenAI) thông qua cổng bảo mật Marutek.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                * Cam kết tuyệt đối: Không chia sẻ thông tin cá nhân và tài khoản đăng nhập của bạn. Dữ liệu chỉ phục vụ mục đích phân tích học tập tức thời.
              </p>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-2 select-none">
            <AlertDialogCancel
              onClick={handleDecline}
              className="flex-1 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850 px-4 py-3 text-sm font-bold transition-all text-zinc-750 dark:text-zinc-300 cursor-pointer active:scale-[0.98] text-center"
            >
              Để sau
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md shadow-amber-600/10 px-4 py-3 text-sm font-bold transition-all cursor-pointer active:scale-[0.98] text-center border-none"
            >
              Chấp nhận & Tiếp tục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
