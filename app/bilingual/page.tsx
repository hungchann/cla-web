"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useRouter } from "next/navigation";
import Image from "next/image";

const LIMIT = 6;

// Mock data phong phú matching Image 2 (Đối mặt với áp lực đồng trang lứa)
const MOCK_BILINGUAL_ITEMS = [
  {
    id: "bilingual-pressure",
    titleCN: "面对同辈压力",
    titleVN: "Đối mặt với áp lực đồng trang lứa",
    level: "HSK 1",
    date: "2026-06-10T08:00:00Z",
    image: { uri: "study_tablet.png" },
    genre: ["Văn hóa"],
  },
  {
    id: "bilingual-pressure-2",
    titleCN: "面对同辈压力",
    titleVN: "Đối mặt với áp lực đồng trang lứa",
    level: "HSK 1",
    date: "2026-06-10T08:00:00Z",
    image: { uri: "study_tablet.png" },
    genre: [],
  },
  {
    id: "bilingual-pressure-3",
    titleCN: "面对同辈压力",
    titleVN: "Đối mặt với áp lực đồng trang lứa",
    level: "HSK 1",
    date: "2026-06-10T08:00:00Z",
    image: { uri: "study_tablet.png" },
    genre: [],
  },
  {
    id: "bilingual-pressure-4",
    titleCN: "面对同辈压力",
    titleVN: "Đối mặt với áp lực đồng trang lứa",
    level: "HSK 1",
    date: "2026-06-10T08:00:00Z",
    image: { uri: "study_tablet.png" },
    genre: [],
  },
  {
    id: "bilingual-pressure-5",
    titleCN: "面对同辈压力",
    titleVN: "Đối mặt với áp lực đồng trang lứa",
    level: "HSK 1",
    date: "2026-06-10T08:00:00Z",
    image: { uri: "study_tablet.png" },
    genre: [],
  },
  {
    id: "bilingual-pressure-6",
    titleCN: "面对同辈压力",
    titleVN: "Đối mặt với áp lực đồng trang lứa",
    level: "HSK 1",
    date: "2026-06-10T08:00:00Z",
    image: { uri: "study_tablet.png" },
    genre: [],
  },
];

const HSK_LEVELS = ["Tất cả", "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"];
const TOPICS = [
  { id: "all", title: "Tất cả chủ đề" },
  { id: "culture", title: "Văn hóa" },
  { id: "life", title: "Đời sống" },
  { id: "education", title: "Giáo dục" },
  { id: "tech", title: "Công nghệ" },
];

export default function BilingualListPage() {
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [page, setPage] = useState(1);

  const offset = (page - 1) * LIMIT;

  const levelQueryParam = selectedLevel === "Tất cả" ? undefined : selectedLevel;
  // Giả lập map topic title cho Directus filter
  const topicObj = TOPICS.find((t) => t.id === selectedTopic);
  const topicTitleParam = selectedTopic === "all" ? undefined : topicObj?.title;

  // Query chính thức từ API Directus
  const { data, isLoading, error } = useQuery({
    queryKey: ["bilingual-list", page, selectedLevel, selectedTopic],
    queryFn: async () => {
      try {
        const res = await bilingualApi.getBilingualItemsPaged({
          limit: LIMIT,
          offset,
          level: levelQueryParam,
          topicTitle: topicTitleParam,
        });
        return res;
      } catch (err) {
        console.warn("API Error, fallback to mock data:", err);
        throw err; // Để React Query đưa vào trạng thái error và ta dùng mock data làm fallback
      }
    },
    retry: 1,
  });

  // Xác định danh sách hiển thị
  let displayItems = data?.items || [];
  let totalCount = data?.totalCount || MOCK_BILINGUAL_ITEMS.length;

  // Nếu API lỗi hoặc rỗng, dùng mock data có bộ lọc client
  if (displayItems.length === 0 || error) {
    const filteredMock = MOCK_BILINGUAL_ITEMS.filter((item) => {
      const matchLv = selectedLevel === "Tất cả" || item.level === selectedLevel;
      // Mock topic check đơn giản
      const matchTopic = true; 
      return matchLv && matchTopic;
    });
    totalCount = filteredMock.length;
    displayItems = filteredMock.slice(offset, offset + LIMIT);
  }

  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const getImageUrl = (uri: string | undefined) => {
    if (uri === "study_tablet.png") return "/images/study_tablet.png";
    if (!uri) return "/book-placeholder.jpg";
    return `https://marutek.space/assets/${uri}`;
  };

  const view = "bilingual-list";
  const router = useRouter();

  const handleSetView = (newView: string) => {
    if (newView === "home") {
      router.push("/dashboard");
    } else if (newView === "courses") {
      router.push("/courses");
    } else if (newView === "bilingual-list") {
      router.push("/bilingual");
    } else if (newView === "flashcard") {
      router.push("/flashcard");
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white text-gray-800 flex-1 -m-4 sm:-m-6 lg:-m-8">
      <Sidebar view={view} setView={handleSetView} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header view={view} setView={handleSetView} showLogo={false} />
        <div className="p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto flex-1 flex flex-col">
          {/* Header & Description */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Các bài mới nhất</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Nâng cao khả năng đọc dịch, củng cố vốn từ vựng HSK qua các chủ đề hấp dẫn. Nhấn vào chữ Hán bất kỳ để học pinyin & nghĩa.
            </p>
          </div>

          {/* Grid List */}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayItems.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {/* Fallback image using CSS gradient block for premium UI if image loading fails */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center font-bold text-4xl text-zinc-300 select-none group-hover:scale-105 transition-transform duration-500">
                      📖
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(item.image?.uri)}
                      alt={item.titleVN}
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                      onLoad={(e) => {
                        (e.target as HTMLElement).classList.remove("opacity-0");
                      }}
                      onError={(e) => {
                        // Ẩn ảnh nếu load lỗi để hiển thị gradient fallback ở sau
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    
                    {/* HSK Level badge */}
                    <span className="absolute left-3 bottom-3 inline-flex items-center rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                      {item.level || "HSK"}
                    </span>

                    {/* Văn hóa ribbon at top-left matching Image 2 */}
                    {item.genre && item.genre.includes("Văn hóa") && (
                      <span className="absolute top-2 left-2 text-xs font-bold bg-[#f59e0b] text-gray-900 px-2 py-0.5 rounded shadow-sm z-10">
                        Văn hóa
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {item.titleCN}
                      </h3>
                      <p className="text-sm font-medium text-gray-600 line-clamp-2">
                        {item.titleVN}
                      </p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                      <span className="text-xs text-zinc-400">
                        {new Date(item.date).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                      <Link
                        href={`/bilingual/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-755"
                      >
                        Xem chi tiết
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3 w-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* No Items Found */}
          {!isLoading && displayItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
              <span className="text-4xl">📭</span>
              <p className="mt-2 text-zinc-500">Không tìm thấy bài đọc nào phù hợp với bộ lọc.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 pb-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={`page-${i}`}
                  onClick={() => setPage(i + 1)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                    page === i + 1
                      ? "bg-amber-600 text-white shadow-md"
                      : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
