"use client";

import { use, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Captions, ListChecks, Lock, Mic } from "lucide-react";

import { bilingualApi } from "@/api/bilingual";
import { BackButton } from "@/components/BackButton";
import { PageContainer } from "@/components/PageContainer";
import { usePremium } from "@/lib/hooks/usePremium";

const MOCK_VIDEO_DETAIL = {
  id: "v1",
  title: "看动漫学汉语：常用口语表达",
  title_trans: "Học tiếng Trung qua hoạt hình: Các cụm từ khẩu ngữ thông dụng",
};

const MODULES = [
  {
    key: "subtitles",
    title: "Phụ đề song ngữ",
    description: "Xem video với phụ đề chạy chữ, tra từ và nghe phát âm.",
    icon: Captions,
    premium: false,
  },
  {
    key: "quiz",
    title: "Chọn từ",
    description: "Luyện từ vựng qua câu hỏi trắc nghiệm gắn với video.",
    icon: ListChecks,
    premium: true,
  },
  {
    key: "shadowing",
    title: "Shadowing",
    description: "Ghi âm nhại theo từng câu phụ đề và chấm điểm phát âm.",
    icon: Mic,
    premium: true,
  },
] as const;

function VideoDetailHubContent({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { isPremium, isLoading } = usePremium();

  const { data: videoData } = useQuery({
    queryKey: ["video-detail", id],
    queryFn: async () => {
      try {
        const res = await bilingualApi.getVideoSection();
        return res.find((v: any) => String(v.id) === id) || MOCK_VIDEO_DETAIL;
      } catch {
        return MOCK_VIDEO_DETAIL;
      }
    },
  });

  const video = videoData || MOCK_VIDEO_DETAIL;
  const premiumLocked = !isLoading && !isPremium;

  return (
    <PageContainer>
      <BackButton href="/video" label="Danh sách video" />

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white">
          {video.title}
        </h1>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {video.title_trans}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const locked = module.premium && premiumLocked;
          return (
            <Link
              key={module.key}
              href={`/video/${id}/${module.key}`}
              className="group flex h-full flex-col justify-between rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-900"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      <Lock className="h-3 w-3" /> VIP
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-500">
                    {module.title}
                  </h2>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {module.description}
                  </p>
                </div>
              </div>

              <span className="mt-5 inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-500">
                Bắt đầu
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </PageContainer>
  );
}

export default function VideoDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        </div>
      }
    >
      <VideoDetailHubContent params={params} />
    </Suspense>
  );
}
