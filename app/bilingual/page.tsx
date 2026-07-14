"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { getAssetUrl } from "@/lib/utils/assets";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FilterPills } from "@/components/ui/filter-pills";
import { Pagination } from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, AlertCircle, PackageOpen } from "lucide-react";

const LIMIT = 6;

const HSK_LEVELS = ["Tất cả", "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"];

export default function BilingualListPage() {
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [page, setPage] = useState(1);

  const offset = (page - 1) * LIMIT;
  const levelQueryParam = selectedLevel === "Tất cả" ? undefined : selectedLevel;

  // Query chính thức từ API Directus
  const { data, isLoading, error } = useQuery({
    queryKey: ["bilingual-list", page, selectedLevel],
    queryFn: async () => {
      const res = await bilingualApi.getBilingualItemsPaged({
        limit: LIMIT,
        offset,
        level: levelQueryParam,
      });
      return res;
    },
    retry: 1,
  });

  const displayItems = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  // Reset page when filter changes
  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setPage(1);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <PageHeader
        title="Đọc Song Ngữ"
        description="Nâng cao khả năng đọc dịch, củng cố vốn từ vựng HSK qua các chủ đề hấp dẫn. Nhấn vào chữ Hán bất kỳ để học pinyin & nghĩa."
        icon={<BookOpen className="w-7 h-7 text-amber-600" />}
      />

      <FilterPills
        options={HSK_LEVELS}
        value={selectedLevel}
        onChange={handleLevelChange}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && displayItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 font-semibold">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
        </div>
      )}

      {/* Grid List */}
      {!isLoading && displayItems.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item: any) => (
            <Card
              key={item.id}
              className="group relative flex flex-col justify-between overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-350 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-900 hover:-translate-y-1"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {/* Fallback gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center font-bold text-4xl text-zinc-300 dark:text-zinc-700 select-none group-hover:scale-105 transition-transform duration-500">
                  <BookOpen className="w-10 h-10 text-amber-500" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAssetUrl(item.image?.uri) || ""}
                  alt={item.titleVN}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                  onLoad={(e) => {
                    (e.target as HTMLElement).classList.remove("opacity-0");
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                
                {/* HSK Level badge */}
                <Badge className="absolute left-3 bottom-3 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 border-none px-3 py-0.5 text-[10px] uppercase tracking-wider shadow-sm">
                  {item.level || "HSK"}
                </Badge>

                {/* Genre ribbon */}
                {item.genre?.some((g: any) => (typeof g === "string" && g === "Văn hóa") || (g?.genre_of_section_id?.title === "Văn hóa")) && (
                  <Badge className="absolute top-2 left-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-0.5 text-[10px] uppercase tracking-wider border-none shadow-sm z-10">
                    Văn hóa
                  </Badge>
                )}
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="flex flex-col gap-2">
                  <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-base tracking-tight">
                    {item.titleCN}
                  </h3>
                  <p className="text-sm font-semibold text-zinc-550 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.titleVN}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">
                    {new Date(item.date).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC"
                    })}
                  </span>
                  <Link
                    href={`/bilingual/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
                  >
                    Xem chi tiết
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Items Found */}
      {!isLoading && !error && displayItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
          <PackageOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-zinc-500">Không tìm thấy bài đọc nào phù hợp với bộ lọc.</p>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-4 pb-6"
      />
    </div>
  );
}
