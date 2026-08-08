"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getLatestBooks, getTrendingBooks, getRandomBooks } from "@/api/stories";
import { getAssetUrl } from "@/lib/utils/assets";
import { PageHeader } from "@/components/PageHeader";
import { Lightbulb, Library } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";

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



  const isLoading = latestLoading || trendingLoading || recommendedLoading;

  return (
    <PageContainer>
      <PageHeader
        title="Đọc Truyện & Sách Song Ngữ"
        description="Nâng cao vốn từ vựng và ngữ cảnh ngữ pháp thông qua việc đọc sách dịch đối chiếu tiếng Trung - Việt. Tích hợp lưu trữ tiến trình tự động."
        icon={<Library className="w-7 h-7" />}
      />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
              <p className="text-xs font-bold text-zinc-500">Đang tải danh mục tủ sách...</p>
            </div>
          ) : (
            <>
              {/* 1. Sách Thịnh Hành (Trending) */}
              {trendingBooks && trendingBooks.length > 0 && (
                <section id="trending" className="scroll-mt-24 space-y-4">
                  <h3 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    🔥 Đang Thịnh Hành
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {trendingBooks.map((book: any) => {
                      const cover = getAssetUrl(book?.image?.filename_disk, null);
                      return (
                        <Link
                          key={book.id}
                          href={`/stories/${book.id}`}
                          className="group flex flex-col gap-2 cursor-pointer"
                        >
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-amber-950/10 dark:border-zinc-800/50 relative shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-300 group-hover:shadow-lg group-hover:shadow-amber-950/10">
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
                            <div className="absolute top-2 right-2 bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              Trending
                            </div>
                          </div>
                          
                          <div className="px-1">
                            <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-sm tracking-tight">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                              {book.author || book.author_trans || "Khuyết danh"}
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
                <section id="latest" className="scroll-mt-24 space-y-4">
                  <h3 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    ✨ Tác Phẩm Mới Cập Nhật
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {latestBooks.slice(0, 10).map((book: any) => {
                      const cover = getAssetUrl(book?.image?.filename_disk, null);
                      return (
                        <Link
                          key={book.id}
                          href={`/stories/${book.id}`}
                          className="group flex flex-col gap-2 cursor-pointer"
                        >
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-amber-950/10 dark:border-zinc-800/50 relative shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-300 group-hover:shadow-lg group-hover:shadow-amber-950/10">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-4 text-center">
                                <span className="text-xs font-extrabold text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                  {book.title}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="px-1">
                            <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors text-sm tracking-tight">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                              {book.author || book.author_trans || "Khuyết danh"}
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
                <section id="recommended" className="scroll-mt-24 space-y-4">
                  <h3 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 inline mr-1.5" /> Có Thể Bạn Sẽ Thích
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommendedBooks.map((book: any) => {
                      const cover = getAssetUrl(book?.image?.filename_disk, null);
                      return (
                        <Link
                          key={book.id}
                          href={`/stories/${book.id}`}
                          className="group flex flex-col gap-2 cursor-pointer"
                        >
                          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-amber-950/10 dark:border-zinc-800/50 relative shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-300 group-hover:shadow-lg group-hover:shadow-amber-950/10">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-4 text-center">
                                <span className="text-xs font-extrabold text-zinc-600 dark:text-zinc-400 line-clamp-3">
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
                              {book.author || book.author_trans || "Khuyết danh"}
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
    </PageContainer>
  );
}
