"use client";

import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { fetchVideoGenres } from "@/api/video";
import { getAssetUrl } from "@/lib/utils/assets";
import Link from "next/link";
import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FilterPills } from "@/components/ui/filter-pills";
import { Video, ArrowRight, AlertCircle, PackageOpen } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Pagination } from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LIMIT = 6;

// Mock video data để phục vụ demo khi API rỗng
const MOCK_VIDEOS = [
  {
    id: "v1",
    title: "看动漫学汉语：常用口语表达",
    title_trans: "Học tiếng Trung qua hoạt hình: Các cụm từ khẩu ngữ thông dụng",
    YouTube_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_created: "2026-06-22T08:00:00Z",
    author: "Thầy Lý",
    Video_Source: "Local",
  },
  {
    id: "v2",
    title: "HSK 4 听力高频词汇解析",
    title_trans: "Phân tích từ vựng nghe hiểu tần suất cao trong HSK 4",
    YouTube_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_created: "2026-06-19T10:00:00Z",
    author: "Cô Vương",
    Video_Source: "Local",
  },
  {
    id: "v3",
    title: "五分钟学会用汉语點餐",
    title_trans: "5 phút học cách gọi món ăn bằng tiếng Trung",
    YouTube_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_created: "2026-06-16T15:30:00Z",
    author: "CLA Team",
    Video_Source: "Youtube",
  },
];

function VideoListPageContent() {
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedGenre = searchParams.get("genre");
  const selectedGenreId = requestedGenre || null;

  // Reset page to 1 when filter genre changes
  const [prevGenre, setPrevGenre] = useState(selectedGenreId);
  if (selectedGenreId !== prevGenre) {
    setPage(1);
    setPrevGenre(selectedGenreId);
  }

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ["video-sections"],
    queryFn: async () => {
      try {
        const res = await bilingualApi.getVideoSection();
        return res;
      } catch (err) {
        console.warn("API error, fallback to mock videos", err);
        throw err;
      }
    },
    retry: 1,
  });

  const { data: genres } = useQuery({
    queryKey: ["video-genres"],
    queryFn: async () => {
      try {
        const res = await fetchVideoGenres();
        return res;
      } catch (err) {
        console.warn("Failed to fetch video genres", err);
        return [];
      }
    },
    retry: 1,
  });

  const displayVideos = useMemo(() => {
    const list = videos && videos.length > 0 ? videos : MOCK_VIDEOS;
    if (!selectedGenreId) return list;
    return list.filter((video: any) => {
      const genreId = video.genre_id?.id ?? video.genre_id;
      return String(genreId) === String(selectedGenreId);
    });
  }, [videos, selectedGenreId]);

  const totalCount = displayVideos.length;
  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const paginatedVideos = useMemo(() => {
    const offset = (page - 1) * LIMIT;
    return displayVideos.slice(offset, offset + LIMIT);
  }, [displayVideos, page]);

  const genreOptions = useMemo(() => {
    const allOption = { id: "__all__", title: "📂 Tất cả" };
    const genreItems = (genres ?? []).map((g) => ({ id: String(g.id), title: `🏷️ ${g.title}` }));
    return [allOption, ...genreItems];
  }, [genres]);

  const selectedGenreValue = selectedGenreId ?? "__all__";

  const handleGenreChange = (val: string) => {
    setPage(1);
    router.push(val === "__all__" ? "/video" : `/video?genre=${encodeURIComponent(val)}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Học Tiếng Trung Qua Video"
        description="Xem các video bài giảng chất lượng với phụ đề chạy chữ song ngữ. Trả lời câu hỏi trắc nghiệm tương tác để ôn tập từ vựng ngay trong quá trình xem."
        icon={<Video className="w-7 h-7 text-amber-600" />}
      />

      <FilterPills
        options={genreOptions.map((g) => g.id)}
        value={selectedGenreValue}
        onChange={handleGenreChange}
        getId={(id) => id}
        getLabel={(id) => genreOptions.find((g) => g.id === id)?.title ?? id}
      />

      {/* Loading State */}
      {isLoading && paginatedVideos.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && displayVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 font-semibold">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
        </div>
      )}

      {/* Video Grid */}
      {!isLoading && paginatedVideos.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedVideos.map((video: any) => {
            // Lấy youtube ID để làm thumbnail hoặc video source
            let ytId = "dQw4w9WgXcQ";
            const urlObj = video.YouTube_URL || "";
            if (urlObj.includes("v=")) {
              ytId = urlObj.split("v=")[1]?.split("&")[0] || "dQw4w9WgXcQ";
            } else if (urlObj.includes("youtu.be/")) {
              ytId = urlObj.split("youtu.be/")[1]?.split("?")[0] || "dQw4w9WgXcQ";
            }

            let thumbnail = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
            if (video.image_cover?.filename_disk) {
              thumbnail = getAssetUrl(video.image_cover.filename_disk);
            }

            let authorName = "CLA Tutor";
            if (video.author && typeof video.author === "object" && video.author.name) {
              authorName = video.author.name;
            } else if (video.author_id && typeof video.author_id === "object" && video.author_id.name) {
              authorName = video.author_id.name;
            } else if (video.author) {
              authorName = video.author;
            }

            const isYoutube = video.Video_Source === "Youtube" || video.Video_Source === "YouTube" || (video.YouTube_URL && !video.video_file);

            return (
              <Link
                key={video.id}
                href={`/video/${video.id}`}
                className="group block"
              >
                <Card
                  className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-300 group-hover:shadow-lg group-hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-amber-900"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnail}
                      alt={video.title_trans}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onLoad={(e) => {
                        (e.target as HTMLElement).classList.remove("opacity-0");
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
                      }}
                    />

                    {/* Source Tag Badge */}
                    <Badge className="absolute left-3 bottom-3 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 border-none px-3 py-0.5 text-[10px] uppercase tracking-wider shadow-sm z-20">
                      {isYoutube ? "YouTube" : "Local Video"}
                    </Badge>

                    {/* Genre Badge */}
                    {video.genre_id?.title && (
                      <Badge className="absolute top-2 left-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-0.5 text-[10px] uppercase tracking-wider border-none shadow-sm z-20">
                        {video.genre_id.title}
                      </Badge>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-transform group-hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-base tracking-tight">
                        {video.title}
                      </h3>
                      <p className="text-sm font-semibold text-zinc-550 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {video.title_trans}
                      </p>
                    </div>
                    
                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">
                        {video.date_created ? new Date(video.date_created).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }) : authorName}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-500 group-hover:text-amber-700 dark:group-hover:text-amber-400"
                      >
                        Học ngay
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* No Items Found */}
      {!isLoading && !error && paginatedVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
          <PackageOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-zinc-500 font-medium">Không tìm thấy video nào phù hợp với bộ lọc.</p>
          {selectedGenreId && (
            <Button
              onClick={() => handleGenreChange("__all__")}
              className="mt-4 bg-amber-600 text-white hover:bg-amber-700 font-bold rounded-xl shadow-sm"
            >
              Xem tất cả video
            </Button>
          )}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-4 pb-6"
      />
    </PageContainer>
  );
}

export default function VideoListPage() {
  return (
    <Suspense fallback={
      <PageContainer className="gap-9">
        <PageHeader
          title="Video luyện tập"
          description="Luyện nghe tiếng Trung qua các video phụ đề song ngữ."
          icon={<Video className="w-7 h-7" />}
        />
        <div className="animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-40" />
      </PageContainer>
    }>
      <VideoListPageContent />
    </Suspense>
  );
}

