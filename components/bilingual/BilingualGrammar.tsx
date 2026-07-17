"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface BilingualGrammarProps {
  grammarList: any[];
  isLoading: boolean;
}

export function BilingualGrammar({
  grammarList,
  isLoading,
}: BilingualGrammarProps) {
  const normalizeGrammarContent = (content?: string | null) => {
    if (!content) return "";
    const normalized = String(content)
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    if (typeof window === "undefined") return normalized;

    const container = document.createElement("div");
    container.innerHTML = normalized;
    return container.innerHTML;
  };

  return (
    <div className="bg-amber-500/5 dark:bg-amber-500/2 border border-amber-500/10 dark:border-amber-500/5 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-black text-amber-700 dark:text-amber-500">
        Cấu trúc ngữ pháp quan trọng
      </h3>
      {isLoading ? (
        <p className="text-xs text-zinc-400 font-semibold">Đang tải ngữ pháp...</p>
      ) : grammarList.length === 0 ? (
        <p className="text-xs text-zinc-500 font-semibold">
          Bài học này chưa được cập nhật cấu trúc ngữ pháp.
        </p>
      ) : (
        <div className="space-y-4">
          {grammarList.map((g: any, index: number) => {
            const grammarHtml = normalizeGrammarContent(g.content);
            return (
              <div
                key={g.id || index}
                className="rounded-xl border border-amber-200/70 bg-white/70 p-3 dark:border-amber-900/40 dark:bg-zinc-950/60"
              >
                <div className="flex items-start gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                      {g.title}
                    </p>
                    {g.description && (
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 italic">
                        {g.description}
                      </p>
                    )}
                    {grammarHtml && (
                      <div
                        className="grammar-html-renderer text-xs md:text-sm font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: grammarHtml }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
