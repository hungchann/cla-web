"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { bilingualApi } from "@/api/bilingual";
import { updateHskLevel } from "@/api/profile";
import { getUser } from "@/api/apiService";

interface UserStats {
  mastered: number;
  learning: number;
  review: number;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<string>("");
  const [loadingLevel, setLoadingLevel] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const stats: UserStats = {
    mastered: 24,
    learning: 45,
    review: 12,
  };

  useEffect(() => {
    const user = tokenUtils.getUserData();
    if (user) {
      setUserData(user);
    } else {
      // Giả lập user để trải nghiệm demo mượt mà
      setUserData({
        first_name: "Học Viên",
        last_name: "CLA",
        email: "demo@cla-learning.com",
        avatar: null,
      });
    }
  }, []);

  useEffect(() => {
    const loadProfileAndLevels = async () => {
      const user = tokenUtils.getUserData();
      if (!user) return;
      setLoadingLevel(true);
      try {
        const fullUser = await getUser();
        if (fullUser?.profile?.self_assessed_hsk_level) {
          setCurrentLevel(fullUser.profile.self_assessed_hsk_level);
        }
        const allLevels = await bilingualApi.getLevels();
        setLevels(allLevels || []);
      } catch (err) {
        console.error("Lỗi lấy thông tin trình độ", err);
      } finally {
        setLoadingLevel(false);
      }
    };
    loadProfileAndLevels();
  }, []);

  const handleLevelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setIsUpdating(true);
    try {
      await updateHskLevel(val);
      setCurrentLevel(val);
    } catch (err) {
      console.error("Lỗi cập nhật HSK", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-8 py-6">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 p-8 shadow-xl shadow-amber-600/10">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col gap-2 md:max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 bg-amber-700/30 w-fit px-2.5 py-1 rounded-full select-none">
              Học tập mỗi ngày
            </span>
            {userData && userData.email !== "demo@cla-learning.com" && (
              <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                <span>🏆 Trình độ:</span>
                <select
                  value={currentLevel}
                  onChange={handleLevelChange}
                  disabled={isUpdating || loadingLevel}
                  className="bg-transparent text-amber-200 border-none outline-none font-bold cursor-pointer select-none"
                >
                  <option value="" className="bg-amber-600 text-white">Chưa chọn</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id} className="bg-amber-600 text-white font-semibold">
                      {lvl.title}
                    </option>
                  ))}
                </select>
                {isUpdating && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent"></span>}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mt-1">
            Chào mừng quay lại, {userData?.first_name || "Bạn học"}!
          </h1>
          <p className="text-lg text-amber-50 leading-relaxed">
            Tiếp tục lộ trình chinh phục tiếng Trung của bạn. Hôm nay bạn muốn cải thiện kỹ năng nào?
          </p>
        </div>
      </section>

      {/* Progress Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Đã thành thạo</p>
            <p className="text-2xl font-bold">{stats.mastered} từ</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Đang học</p>
            <p className="text-2xl font-bold">{stats.learning} từ</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cần ôn tập</p>
            <p className="text-2xl font-bold">{stats.review} từ</p>
          </div>
        </div>
      </section>

      {/* Main Learning Hub */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold tracking-tight">Khu Vực Học Tập</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Bilingual */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Đọc Song Ngữ</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Rèn luyện khả năng đọc hiểu với các bài viết song ngữ Trung - Việt, nhấn để tra Pinyin và nghĩa của từ tức thì.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/bilingual"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                Bắt đầu đọc
              </Link>
            </div>
          </div>

          {/* Card 2: Videos */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Học Qua Video</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Xem video bài giảng với phụ đề SRT chạy chữ song ngữ và làm các bài tập trắc nghiệm nhanh để nhớ kiến thức sâu sắc.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/video"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                Xem danh sách video
              </Link>
            </div>
          </div>

          {/* Card 3: Flashcards */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Thẻ Ghi Nhớ (Flashcard)</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Luyện nhớ từ vựng với phương pháp lặp lại ngắt quãng (SRS). Lật thẻ 3D trực quan và lưu trữ từ vựng vào sổ tay cá nhân.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/flashcard"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              >
                Ôn tập từ vựng
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
