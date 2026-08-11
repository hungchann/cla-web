"use client";

import { Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { grammarApi } from "@/api/grammar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, PackageOpen } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";

function GrammarPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedModuleId = searchParams.get("module");
    const selectedTopicId = searchParams.get("topic");

    // 1. Fetch modules (Ngữ pháp HSK1, HSK2, ...)
    const { data: modules } = useQuery({
        queryKey: ["grammar-modules"],
        queryFn: grammarApi.getGrammarModules,
    });

    // Mặc định chọn module đầu tiên khi chưa có tham số
    useEffect(() => {
        if (modules && modules.length > 0 && !selectedModuleId) {
            router.replace(`/grammar?module=${encodeURIComponent(modules[0].id)}`);
        }
    }, [modules, selectedModuleId, router]);

    // 2. Fetch topics dưới module đang chọn
    const { data: topicsRaw, isLoading: topicsLoading } = useQuery({
        queryKey: ["grammar-topics", selectedModuleId],
        queryFn: () => grammarApi.getTopicOfGrammarItem(selectedModuleId),
        enabled: !!selectedModuleId,
    });

    // Chuẩn hoá danh sách chủ đề duy nhất
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

    // Mặc định chọn topic đầu tiên khi module đổi & chưa có topic
    useEffect(() => {
        if (topics && topics.length > 0 && !selectedTopicId) {
            router.replace(
                `/grammar?module=${encodeURIComponent(selectedModuleId || "")}&topic=${encodeURIComponent(topics[0].id)}`,
            );
        }
    }, [topics, selectedModuleId, selectedTopicId, router]);

    // 3. Fetch grammar items theo module & topic
    const { data: grammarItems, isLoading: itemsLoading } = useQuery({
        queryKey: ["grammar-items", selectedModuleId, selectedTopicId],
        queryFn: () => grammarApi.getGrammarDetailById(selectedModuleId, selectedTopicId),
        enabled: !!selectedModuleId && !!selectedTopicId,
    });

    const selectedTopicTitle = topics.find((t: any) => t.id === selectedTopicId)?.title || "Chủ đề";

    return (
        <PageContainer>
            <PageHeader
                title="Cấu Trúc Ngữ Pháp Tiếng Trung"
                description="Tổng hợp đầy đủ cấu trúc ngữ pháp quan trọng theo hệ thống bài giảng và chủ đề của Sun Chinese. Có ví dụ kèm Pinyin & nghĩa Việt rõ ràng."
                icon={<FileText className="w-7 h-7" />}
            />

            {/* Detail Items */}
            <Card id="details" className="scroll-mt-24 flex-1 min-w-0 flex flex-col rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm p-6 dark:border-zinc-800 dark:bg-zinc-900">
                {itemsLoading || topicsLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
                        <p className="text-xs font-bold text-zinc-400">Đang tải cấu trúc ngữ pháp...</p>
                    </div>
                ) : selectedTopicId ? (
                    <div className="flex-1 overflow-y-auto space-y-6">
                        {/* Active topic info */}
                        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                                {selectedTopicTitle}
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
                                        className="bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-3xs"
                                    >
                                        <div className="flex items-start justify-between gap-3 border-b border-amber-100/20 pb-3">
                                            <h3 className="text-md font-extrabold text-amber-900 dark:text-amber-450 leading-snug">
                                                {item.title}
                                            </h3>
                                            <Badge className="bg-amber-150 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-black px-2 py-0.5 rounded-full select-none border-none text-[10px]">
                                                Ngữ pháp
                                            </Badge>
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
                                <PackageOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                                <p className="mt-2 text-xs font-bold text-zinc-400">Không tìm thấy nội dung ngữ pháp cho chủ đề này.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                        <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-800" />
                        <p className="mt-2 text-xs font-bold text-zinc-400">Vui lòng chọn một chủ đề để xem nội dung.</p>
                    </div>
                )}
            </Card>

            {/* Embedded styles for rendered HTML */}
            <style jsx global>{`
        .grammar-html-renderer h1,
        .grammar-html-renderer h2,
        .grammar-html-renderer h3,
        .grammar-html-renderer h4 {
          font-weight: 800;
          color: #7c2d12;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .dark .grammar-html-renderer h1,
        .dark .grammar-html-renderer h2,
        .dark .grammar-html-renderer h3,
        .dark .grammar-html-renderer h4 {
          color: #fdba74;
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
          color: #ea580c;
          font-weight: 750;
        }
        .dark .grammar-html-renderer strong {
          color: #fed7aa;
        }
        .grammar-html-renderer blockquote {
          border-left: 4px solid #f97316;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          background-color: rgba(249, 115, 22, 0.05);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}</style>
        </PageContainer>
    );
}

export default function GrammarPage() {
    return (
        <Suspense fallback={
            <PageContainer className="gap-9">
                <PageHeader
                    title="Cấu Trúc Ngữ Pháp Tiếng Trung"
                    description="Tổng hợp đầy đủ cấu trúc ngữ pháp quan trọng theo hệ thống bài giảng và chủ đề."
                    icon={<FileText className="w-7 h-7" />}
                />
                <div className="animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-40" />
            </PageContainer>
        }>
            <GrammarPageContent />
        </Suspense>
    );
}
