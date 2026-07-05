"use client";

import { useQuery } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Link from "next/link";
import { getLatestBooks, getTrendingBooks, getRandomBooks } from "@/api/stories";

export default function StoriesPage() {
  // Query books data
  const { data: latestBooks, isLoading: latestLoading } = useQuery({
    queryKey: ["latest-books"],
    queryFn: getLatestBooks,
  });

  const { data: trendingBooks, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-books"],
    queryFn: getTrendingBooks,
  });

  const { data: recommendedBooks, isLoading: recommendedLoading } = useQuery({
    queryKey: ["recommended-books"],
    queryFn: getRandomBooks,
  });

  const getCoverUrl = (book: any) => {
    if (book?.image_cover?.filename_disk) {
      return `https://marutek.space/assets/${book.image_cover.filename_disk}`;
    }
    return null;
  };

  const isLoading = latestLoading || trendingLoading || recommendedLoading;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar activeView="stories" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Thư Viện Sách Song Ngữ" />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-8 max-w-6xl mx-auto w-full">
          {/* Header Description */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-6 rounded-3xl border border-amber-200/20 shadow-2xs space-y-1.5">
            <h2 className="text-xl font-extrabold text-amber-800 dark:text-amber-500">📚 Đọc Truyện & Sách Song Ngữ</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
              Nâng cao vốn từ vựng và ngữ cảnh ngữ pháp thông qua việc đọc sách dịch đối chiếu tiếng Trung - Việt. Tích hợp lưu trữ tiến trình tự động.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
              <p className="text-xs font-bold text-zinc-500">Đang tải danh mục tủ sách...</p>
            </div>
          ) : (
            <>
              {/* 1. Sách Thịnh Hành (Trending) */}
              {trendingBooks && trendingBooks.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    🔥 Đang Thịnh Hành
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {trendingBooks.map((book: any) => {
                      const cover = getCoverUrl(book);
                      return (
                        <Link
                          key={book.id}
                          href={`/stories/${book.id}`}
                          className="group flex flex-col gap-2 cursor-pointer"
                        >
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 relative shadow-xs group-hover:shadow-md group-hover:scale-[1.02] transition-all">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/20 dark:to-orange-950/20 flex items-center justify-center p-4 text-center">
                                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-500 line-clamp-3">
                                  {book.title}
                                </span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              Trending
                            </div>
                          </div>
                          
                          <div className="px-1">
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                              {book.author || "Khuyết danh"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 2. Sách Mới Cập Nhật */}
              {latestBooks && latestBooks.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    ✨ Tác Phẩm Mới Cập Nhật
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {latestBooks.slice(0, 10).map((book: any) => {
                      const cover = getCoverUrl(book);
                      return (
                        <Link
                          key={book.id}
                          href={`/stories/${book.id}`}
                          className="group flex flex-col gap-2 cursor-pointer"
                        >
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 relative shadow-xs group-hover:shadow-md group-hover:scale-[1.02] transition-all">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center p-4 text-center">
                                <span className="text-xs font-extrabold text-blue-800 dark:text-blue-500 line-clamp-3">
                                  {book.title}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="px-1">
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                              {book.author || "Khuyết danh"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. Gợi Ý Sách Hay */}
              {recommendedBooks && recommendedBooks.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    💡 Có Thể Bạn Sẽ Thích
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommendedBooks.map((book: any) => {
                      const cover = getCoverUrl(book);
                      return (
                        <Link
                          key={book.id}
                          href={`/stories/${book.id}`}
                          className="group flex flex-col gap-2 cursor-pointer"
                        >
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 relative shadow-xs group-hover:shadow-md group-hover:scale-[1.02] transition-all">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/20 dark:to-teal-950/20 flex items-center justify-center p-4 text-center">
                                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-500 line-clamp-3">
                                  {book.title}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="px-1">
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                              {book.author || "Khuyết danh"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
