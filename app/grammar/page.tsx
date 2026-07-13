"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { grammarApi } from "@/api/grammar";

export default function GrammarPage() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(null);

  // 1. Fetch modules (Sơ cấp, Trung cấp, ...)
  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["grammar-modules"],
    queryFn: grammarApi.getGrammarModules,
  });

  // Set default selected module when loaded
  useEffect(() => {
    if (modules && modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // 2. Fetch topics under selected module
  const { data: topicsRaw, isLoading: topicsLoading } = useQuery({
    queryKey: ["grammar-topics", selectedModuleId],
    queryFn: () => grammarApi.getTopicOfGrammarItem(selectedModuleId),
    enabled: !!selectedModuleId,
  });

  // Process unique topics list
  const topics = (() => {
    if (!topicsRaw) return [];
    const normalized = topicsRaw
      .map((item: any) => {
        const topic = item?.topic_of_grammarModule_id ?? item?.topic_id ?? item;
        return {
          id: String(topic?.id ?? ""),
          title: topic?.title ?? topic?.name ?? "",
        };
      })
      .filter((t: any) => t.title);

    const titleMap = new Map<string, any>();
    normalized.forEach((t: any) => {
      if (!titleMap.has(t.title)) {
        titleMap.set(t.title, t);
      }
    });
    return Array.from(titleMap.values());
  })();

  // Set default selected topic when module changes or topics load
  useEffect(() => {
    if (topics && topics.length > 0) {
      // Find if current selected topic exists in the new list, otherwise pick the first
      const exists = topics.some(t => t.id === selectedTopicId);
      if (!exists) {
        setSelectedTopicId(topics[0].id);
        setSelectedTopicTitle(topics[0].title);
      }
    } else {
      setSelectedTopicId(null);
      setSelectedTopicTitle(null);
    }
  }, [topics, selectedModuleId]);

  // 3. Fetch grammar items under selected module & topic
  const { data: grammarItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["grammar-items", selectedModuleId, selectedTopicId],
    queryFn: () => grammarApi.getGrammarDetailById(selectedModuleId, selectedTopicId),
    enabled: !!selectedModuleId && !!selectedTopicId,
  });

  return (
    <div className="flex-1 flex flex-col gap-6">
          {/* Header intro */}
          <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent p-6 rounded-3xl border border-violet-200/20 shadow-2xs space-y-1.5 shrink-0">
            <h1 className="text-2xl font-extrabold text-violet-850 dark:text-violet-500">📝 Cấu trúc Ngữ pháp Tiếng Trung</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
              Tổng hợp đầy đủ cấu trúc ngữ pháp quan trọng theo hệ thống bài giảng và chủ đề của Sun Chinese. Có ví dụ kèm Pinyin & nghĩa Việt rõ ràng.
            </p>
          </div>

          {/* Module Selector Pill Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-4 shrink-0">
            {modulesLoading ? (
              <div className="h-6 w-32 bg-zinc-200 animate-pulse rounded-lg"></div>
            ) : (
              modules?.map((mod: any) => {
                const isActive = selectedModuleId === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? "bg-violet-600 text-white shadow-md shadow-violet-650/20"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:text-violet-600"
                    }`}
                  >
                    {mod.title}
                  </button>
                );
              })
            )}
          </div>

          {/* Split Pane: Subcategories Topics (Left) vs Detail Items (Right) */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[400px]">
            {/* Left pane: Topics / Subcategories */}
            <div className="w-full md:w-64 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
              <h2 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2">
                Chủ đề ngữ pháp
              </h2>

              <div className="flex-1 overflow-y-auto space-y-1">
                {topicsLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="h-8 bg-zinc-150 animate-pulse rounded-md"></div>
                    ))}
                  </div>
                ) : topics.length > 0 ? (
                  topics.map((topic) => {
                    const isActive = selectedTopicId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopicId(topic.id);
                          setSelectedTopicTitle(topic.title);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400"
                            : "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {topic.title}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-400 text-center py-10 font-bold">
                    Không có chủ đề nào.
                  </p>
                )}
              </div>
            </div>

            {/* Right pane: Detailed list of Grammar items */}
            <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-2xs">
              {itemsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
                  <p className="text-xs font-bold text-zinc-400">Đang tải cấu trúc ngữ pháp...</p>
                </div>
              ) : selectedTopicId ? (
                <div className="flex-1 overflow-y-auto space-y-6">
                  {/* Active topic info */}
                  <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                      {selectedTopicTitle || "Chủ đề"}
                    </h2>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                      Danh sách các điểm ngữ pháp nổi bật
                    </p>
                  </div>

                  {grammarItems && grammarItems.length > 0 ? (
                    <div className="space-y-8">
                      {grammarItems.map((item: any) => (
                        <article
                          key={item.id}
                          className="bg-violet-50/20 dark:bg-violet-950/5 border border-violet-100/50 dark:border-violet-900/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-3xs"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-violet-100/20 pb-3">
                            <h3 className="text-md font-extrabold text-violet-900 dark:text-violet-400 leading-snug">
                              {item.title}
                            </h3>
                            <span className="text-[10px] bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-black px-2 py-0.5 rounded-full select-none shrink-0">
                              Ngữ pháp
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs font-medium text-zinc-650 dark:text-zinc-350 leading-relaxed italic">
                              {item.description}
                            </p>
                          )}

                          {/* HTML detailed explanation */}
                          <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-850 dark:text-zinc-200">
                            <div
                              dangerouslySetInnerHTML={{ __html: item.content }}
                              className="text-xs md:text-sm font-medium space-y-3 leading-relaxed grammar-html-renderer"
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <span className="text-3xl">📭</span>
                      <p className="mt-2 text-xs font-bold text-zinc-400">Không tìm thấy nội dung ngữ pháp cho chủ đề này.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-4xl">📝</span>
                  <p className="mt-2 text-xs font-bold text-zinc-400">Vui lòng chọn một chủ đề bên trái để xem nội dung.</p>
                </div>
              )}
          </div>
        </div>

      {/* Embedded styles for rendered HTML */}
      <style jsx global>{`
        .grammar-html-renderer h1,
        .grammar-html-renderer h2,
        .grammar-html-renderer h3,
        .grammar-html-renderer h4 {
          font-weight: 800;
          color: #4c1d95;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .dark .grammar-html-renderer h1,
        .dark .grammar-html-renderer h2,
        .dark .grammar-html-renderer h3,
        .dark .grammar-html-renderer h4 {
          color: #a78bfa;
        }
        .grammar-html-renderer p {
          margin-bottom: 0.75rem;
        }
        .grammar-html-renderer ul,
        .grammar-html-renderer ol {
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
          list-style-type: disc;
        }
        .grammar-html-renderer li {
          margin-bottom: 0.25rem;
        }
        .grammar-html-renderer strong {
          color: #7c3aed;
          font-weight: 700;
        }
        .dark .grammar-html-renderer strong {
          color: #ddd6fe;
        }
        .grammar-html-renderer blockquote {
          border-left: 4px solid #8b5cf6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          background-color: rgba(139, 92, 246, 0.05);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
