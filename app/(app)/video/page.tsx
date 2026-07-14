"use client";

import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import { fetchVideoGenres } from "@/api/video";
import Link from "next/link";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FilterPills } from "@/components/ui/filter-pills";
import { Video } from "lucide-react";

// Mock video data để phục vụ demo khi API rỗng
const MOCK_VIDEOS = [
  {
    id: "v1",
    title: "看动漫学汉语：常用口语表达",
    title_trans: "Học tiếng Trung qua hoạt hình: Các cụm từ khẩu ngữ thông dụng",
    YouTube_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_created: "2026-06-22T08:00:00Z",
    author: "Thầy Lý",
  },
  {
    id: "v2",
    title: "HSK 4 听力高频词汇解析",
    title_trans: "Phân tích từ vựng nghe hiểu tần suất cao trong HSK 4",
    YouTube_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_created: "2026-06-19T10:00:00Z",
    author: "Cô Vương",
  },
  {
    id: "v3",
    title: "五分钟学会用汉语點餐",
    title_trans: "5 phút học cách gọi món ăn bằng tiếng Trung",
    YouTube_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_created: "2026-06-16T15:30:00Z",
    author: "CLA Team",
  },
];

export default function VideoListPage() {
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);

  const { data: videos, isLoading } = useQuery({
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

  const genreOptions = useMemo(() => {
    const allOption = { id: "__all__", title: "📂 Tất cả" };
    const genreItems = (genres ?? []).map((g) => ({ id: String(g.id), title: `🏷️ ${g.title}` }));
    return [allOption, ...genreItems];
  }, [genres]);

  const selectedGenreValue = selectedGenreId ?? "__all__";

  const handleGenreChange = (val: string) => {
    setSelectedGenreId(val === "__all__" ? null : val);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <PageHeader
        title="Học Tiếng Trung Qua Video"
        description="Xem các video bài giảng chất lượng với phụ đề chạy chữ song ngữ. Trả lời câu hỏi trắc nghiệm tương tác để ôn tập từ vựng ngay trong quá trình xem."
        icon={<Video className="w-7 h-7" />}
      />

      <FilterPills
        options={genreOptions.map((g) => g.id)}
        value={selectedGenreValue}
        onChange={handleGenreChange}
        getId={(id) => id}
        getLabel={(id) => genreOptions.find((g) => g.id === id)?.title ?? id}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
        </div>
      )}

      {/* Video Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayVideos.map((video: any) => {
            // Lấy youtube ID để làm thumbnail
            let ytId = "dQw4w9WgXcQ";
            const urlObj = video.YouTube_URL || "";
            if (urlObj.includes("v=")) {
              ytId = urlObj.split("v=")[1]?.split("&")[0] || "dQw4w9WgXcQ";
            } else if (urlObj.includes("youtu.be/")) {
              ytId = urlObj.split("youtu.be/")[1]?.split("?")[0] || "dQw4w9WgXcQ";
            }

            let authorName = "CLA Tutor";
            if (video.author && typeof video.author === "object" && video.author.name) {
              authorName = video.author.name;
            } else if (video.author_id && typeof video.author_id === "object" && video.author_id.name) {
              authorName = video.author_id.name;
            } else if (video.author) {
              authorName = video.author;
            }

            return (
              <article
                key={video.id}
                className="group relative flex flex-col justify-between overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-350 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-900 hover:-translate-y-1"
              >
                {/* Thumbnail Youtube */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-150 dark:bg-zinc-800">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={video.title_trans}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110">
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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {video.title_trans}
                    </p>
                  </div>
                  
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-4 text-xs">
                    <span className="font-semibold text-zinc-500">{authorName}</span>
                    <Link
                      href={`/video/${video.id}`}
                      className="inline-flex items-center gap-1 font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                    >
                      Học ngay
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
