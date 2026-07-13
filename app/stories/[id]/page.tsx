"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getBookLibraryById, saveReadingProgress, getReadingProgress } from "@/api/stories";
import { speakChinese } from "@/lib/utils/speech";

export default function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
  const [isOpenPinyin, setIsOpenPinyin] = useState(true);

  // Fetch book detail
  const { data: book, isLoading } = useQuery({
    queryKey: ["book-detail", id],
    queryFn: () => getBookLibraryById(id),
  });

  // Fetch user reading progress (to display current chapter/progress)
  const { data: progressList } = useQuery({
    queryKey: ["reading-progress"],
    queryFn: getReadingProgress,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: ({ chapterId, percentage }: { chapterId: number; percentage: number }) =>
      saveReadingProgress(id, chapterId, percentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-progress"] });
    },
  });

  // Automatically select the last read chapter if progress exists
  useEffect(() => {
    if (book && progressList && selectedChapterIndex === null) {
      const saved = progressList.find((p: any) => String(p.id) === id);
      if (saved && book.chapters_id) {
        // Find matching chapter index based on sort_id or default to 0
        const idx = book.chapters_id.findIndex((c: any) => c.sort_id === saved.current_chapter);
        if (idx !== -1) {
          setSelectedChapterIndex(idx);
        } else {
          setSelectedChapterIndex(0);
        }
      } else if (book.chapters_id && book.chapters_id.length > 0) {
        setSelectedChapterIndex(0);
      }
    }
  }, [book, progressList, id, selectedChapterIndex]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-zinc-500 font-bold">Không tìm thấy tác phẩm yêu cầu.</p>
            <Link href="/stories" className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-amber-600">
              Quay lại thư viện
            </Link>
          </div>
      </div>
    );
  }

  // Sort chapters by sort_id descending or ascending (we want ascending)
  const chapters = book.chapters_id ? [...book.chapters_id].sort((a: any, b: any) => a.sort_id - b.sort_id) : [];
  const currentChapter = selectedChapterIndex !== null ? chapters[selectedChapterIndex] : null;

  // Split content by newline to display lines nicely
  const getLines = (text: string) => {
    if (!text) return [];
    return text.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0);
  };

  const chineseLines = currentChapter ? getLines(currentChapter.book_content) : [];
  const vietnameseLines = currentChapter ? getLines(currentChapter.content) : [];

  const handleSelectChapter = (index: number) => {
    setSelectedChapterIndex(index);
    const chapter = chapters[index];
    if (chapter) {
      saveProgressMutation.mutate({
        chapterId: chapter.sort_id || index + 1,
        percentage: 100, // Completed reading this chapter
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
        <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cột trái: Nội dung chương đang đọc */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <Link
                href="/stories"
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                &larr; Quay lại Thư viện
              </Link>

              {currentChapter && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Hiện Pinyin</span>
                  <button
                    onClick={() => setIsOpenPinyin(!isOpenPinyin)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      isOpenPinyin ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        isOpenPinyin ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {currentChapter ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 md:p-8 shadow-xs space-y-6">
                {/* Chapter Title */}
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 text-center">
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                    {currentChapter.title}
                  </h2>
                </div>

                {/* Chapter Lines */}
                <div className="space-y-6">
                  {chineseLines.map((chi, idx) => {
                    const vie = vietnameseLines[idx] || "";
                    return (
                      <div
                        key={idx}
                        className="group flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        {/* Chinese Line */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                            {chi}
                          </p>
                          <button
                            onClick={() => speakChinese(chi)}
                            className="w-6 h-6 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900 flex items-center justify-center text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            🔊
                          </button>
                        </div>

                        {/* Vietnamese Translation */}
                        <p className="text-xs text-amber-700 dark:text-amber-500 font-bold leading-relaxed">
                          {vie}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Chapter Navigation Buttons */}
                <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  <button
                    onClick={() => handleSelectChapter(selectedChapterIndex! - 1)}
                    disabled={selectedChapterIndex === 0}
                    className="px-4 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
                  >
                    &larr; Chương trước
                  </button>
                  <button
                    onClick={() => handleSelectChapter(selectedChapterIndex! + 1)}
                    disabled={selectedChapterIndex === chapters.length - 1}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl disabled:opacity-40 cursor-pointer"
                  >
                    Chương tiếp &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-12 text-center text-zinc-400 font-bold">
                Chọn một chương từ danh sách bên phải để bắt đầu đọc.
              </div>
            )}
          </div>

          {/* Cột phải: Danh sách chương và thông tin sách */}
          <div className="space-y-6">
            {/* Book Metadata */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Thông tin tác phẩm</h3>
              <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <p><strong>Tác giả:</strong> {book.author || "Khuyết danh"}</p>
                {book.author_trans && <p><strong>Dịch giả:</strong> {book.author_trans}</p>}
                <p><strong>Lượt đọc:</strong> {book.view_count || 0}</p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-2">
                  <p className="font-bold text-zinc-600 dark:text-zinc-300 mb-1">Tóm tắt:</p>
                  <p className="leading-relaxed">{book.summary || "Chưa có tóm tắt chi tiết."}</p>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Danh sách chương ({chapters.length})</h3>
              
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {chapters.map((chap: any, idx: number) => {
                  const isActive = selectedChapterIndex === idx;
                  return (
                    <button
                      key={chap.sort_id || idx}
                      onClick={() => handleSelectChapter(idx)}
                      className={`w-full text-left text-xs font-bold p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      Chương {chap.sort_id || idx + 1}: {chap.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
    </div>
  );
}
