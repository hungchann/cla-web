"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bilingualApi } from "@/api/bilingual";
import Link from "next/link";

const LIMIT = 6;

// Mock data phong phú trong trường hợp API thật không hoạt động
const MOCK_BILINGUAL_ITEMS = [
  {
    id: "1",
    titleCN: "中国茶文化的历史",
    titleVN: "Lịch sử văn hóa trà Trung Quốc",
    level: "HSK 4",
    date: "2026-06-20T08:00:00Z",
    image: { uri: "f1eb175b-0145-426c-8438-fb1c801e06fa.jpg" },
    genre: [],
  },
  {
    id: "2",
    titleCN: "北京的胡同与四合院",
    titleVN: "Hồ đồng và Tứ hợp viện ở Bắc Kinh",
    level: "HSK 5",
    date: "2026-06-18T10:30:00Z",
    image: { uri: "c3d6998d-e0a5-48fa-8941-2cb2d0758410.jpg" },
    genre: [],
  },
  {
    id: "3",
    titleCN: "学习汉语的秘诀",
    titleVN: "Bí quyết học tiếng Trung Quốc",
    level: "HSK 3",
    date: "2026-06-15T14:20:00Z",
    image: { uri: "a43e8d2e-ba23-456c-be72-123456789abc.jpg" },
    genre: [],
  },
  {
    id: "4",
    titleCN: "中秋节的传说与习俗",
    titleVN: "Truyền thuyết và phong tục Tết Trung thu",
    level: "HSK 4",
    date: "2026-06-10T09:00:00Z",
    image: { uri: "b823cdd1-90a1-4328-89c2-555555555555.jpg" },
    genre: [],
  },
  {
    id: "5",
    titleCN: "高铁改变中国人的生活",
    titleVN: "Đường sắt cao tốc thay đổi cuộc sống người Trung Quốc",
    level: "HSK 6",
    date: "2026-06-05T16:45:00Z",
    image: { uri: "d834e912-701a-4bc1-9092-123abc456def.jpg" },
    genre: [],
  },
  {
    id: "6",
    titleCN: "熊猫——中国的国宝",
    titleVN: "Gấu trúc - Quốc bảo của Trung Quốc",
    level: "HSK 2",
    date: "2026-06-01T11:15:00Z",
    image: { uri: "e294bb8d-501b-4f92-aa21-000000000000.jpg" },
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
    if (!uri) return "/book-placeholder.jpg";
    return `https://marutek.space/assets/${uri}`;
  };

  return (
    <div className="flex-1 flex flex-col gap-6 py-6">
      {/* Header & Description */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Bài Đọc Song Ngữ Trung - Việt</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Nâng cao khả năng đọc dịch, củng cố vốn từ vựng HSK qua các chủ đề hấp dẫn. Nhấn vào chữ Hán bất kỳ để học pinyin & nghĩa.
        </p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
        {/* HSK Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2">Trình độ:</span>
          {HSK_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setSelectedLevel(lvl);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedLevel === lvl
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/10"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Topic Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">Chủ đề:</span>
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium focus:border-amber-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800"
          >
            {TOPICS.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
        </div>
      )}

      {/* Grid List */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
                <span className="absolute left-3 top-3 inline-flex items-center rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                  {item.level || "HSK"}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                    {item.titleCN}
                  </h3>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    {item.titleVN}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-4">
                  <span className="text-xs text-zinc-400">
                    {new Date(item.date).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/bilingual/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-2 text-zinc-500">Không tìm thấy bài đọc nào phù hợp với bộ lọc.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
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
                  : "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
