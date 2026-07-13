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

  // Gói Premium & Voucher Seeding states
  const [isPremium, setIsPremium] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const checkPremium = () => {
      const user = tokenUtils.getUserData();
      if (user && (user.role === "Premium" || user.is_premium || localStorage.getItem("cla_premium_active") === "true")) {
        setIsPremium(true);
      }
    };
    checkPremium();
  }, []);

  const handleStripeCheckout = () => {
    alert("Đang kết nối tới Stripe Checkout...");
    localStorage.setItem("cla_premium_active", "true");
    setIsPremium(true);
    alert("Thanh toán giả lập Stripe thành công! Gói Premium đã được kích hoạt.");
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setVoucherStatus(null);
    
    // Giả lập kiểm tra voucher
    setTimeout(() => {
      const code = voucherCode.trim().toUpperCase();
      if (code === "CLA-SEED-2026" || code === "PREMIUM99") {
        setVoucherStatus({ type: "success", text: "🎉 Áp dụng mã thành công! Bạn nhận được 30 ngày Premium." });
        localStorage.setItem("cla_premium_active", "true");
        setIsPremium(true);
      } else {
        setVoucherStatus({ type: "error", text: "❌ Mã voucher không hợp lệ hoặc đã được sử dụng." });
      }
      setRedeeming(false);
    }, 1000);
  };

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
    <div className="flex-1 flex flex-col gap-8">
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
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500">Đã thành thạo</p>
            <p className="text-2xl font-bold">{stats.mastered} từ</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500">Đang học</p>
            <p className="text-2xl font-bold">{stats.learning} từ</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500">Cần ôn tập</p>
            <p className="text-2xl font-bold">{stats.review} từ</p>
          </div>
        </div>
      </section>

      {/* VIP/Premium & Voucher Seeding Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Premium Status Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-2xl bg-zinc-900 text-white p-6 shadow-lg border border-zinc-800 flex flex-col justify-between min-h-[160px]">
          <div className="absolute right-4 bottom-4 opacity-10 text-8xl select-none pointer-events-none">
            👑
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold tracking-tight text-white">Gói Tài Khoản của Bạn</h3>
              <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                isPremium ? "bg-amber-500 text-zinc-950 animate-pulse" : "bg-zinc-800 text-zinc-400"
              }`}>
                {isPremium ? "👑 Premium" : "Free"}
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
              {isPremium 
                ? "Xin chúc mừng! Bạn đã sở hữu tài khoản Premium. Mở khóa toàn bộ kho sách, video bài học và flashcard không giới hạn." 
                : "Nâng cấp lên gói Premium để học không giới hạn, xem đầy đủ video giải thích ngữ pháp, tra từ nhanh và nhận nhiều ưu đãi hơn."
              }
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-3">
            {isPremium ? (
              <span className="text-[11px] font-bold text-amber-500">Hạn dùng: Vô thời hạn (Vip Lifetime)</span>
            ) : (
              <>
                <span className="text-[11px] font-bold text-zinc-500">Gói 399k / Năm</span>
                <button
                  onClick={handleStripeCheckout}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4.5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer border-none"
                >
                  Nâng cấp Premium
                </button>
              </>
            )}
          </div>
        </div>

        {/* Voucher Seeding Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-zinc-900 mb-1.5 flex items-center gap-1.5">
              <span>🎟️</span> Nhập mã giới thiệu
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
              Nhập mã Voucher từ người seeding để nhận ngay 30 ngày Premium trải nghiệm miễn phí.
            </p>
          </div>
          
          <form onSubmit={handleRedeemVoucher} className="space-y-3">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Ví dụ: CLA-SEED-2026"
              disabled={redeeming}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-transparent focus:border-amber-500 focus:outline-none font-bold"
            />
            {voucherStatus && (
              <div className={`p-2 rounded-lg text-[10px] font-bold text-center ${
                voucherStatus.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-rose-500/10 text-rose-600"
              }`}>
                {voucherStatus.text}
              </div>
            )}
            <button
              type="submit"
              disabled={redeeming || !voucherCode.trim()}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer border-none disabled:opacity-50"
            >
              {redeeming ? "Đang xử lý..." : "Áp dụng"}
            </button>
          </form>
        </div>
      </section>

      {/* Main Learning Hub */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold tracking-tight">Khu Vực Học Tập</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Bilingual */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Đọc Song Ngữ</h3>
              <p className="text-sm text-zinc-500">
                Rèn luyện khả năng đọc hiểu với các bài viết song ngữ Trung - Việt, nhấn để tra Pinyin và nghĩa của từ tức thì.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/bilingual"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Bắt đầu đọc
              </Link>
            </div>
          </div>

          {/* Card 2: Videos */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Học Qua Video</h3>
              <p className="text-sm text-zinc-500">
                Xem video bài giảng với phụ đề SRT chạy chữ song ngữ và làm các bài tập trắc nghiệm nhanh để nhớ kiến thức sâu sắc.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/video"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Xem danh sách video
              </Link>
            </div>
          </div>

          {/* Card 3: Flashcards */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Thẻ Ghi Nhớ (Flashcard)</h3>
              <p className="text-sm text-zinc-500">
                Luyện nhớ từ vựng với phương pháp lặp lại ngắt quãng (SRS). Lật thẻ 3D trực quan và lưu trữ từ vựng vào sổ tay cá nhân.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/flashcard"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Ôn tập từ vựng
              </Link>
            </div>
          </div>

          {/* Card 4: Sách – Báo */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 text-2xl">
                📖
              </div>
              <h3 className="text-lg font-bold">Sách – Báo</h3>
              <p className="text-sm text-zinc-500">
                Khám phá thế giới truyện, sách báo song ngữ phong phú. Cải thiện khả năng đọc trôi chảy theo ngữ cảnh.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/stories"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Đọc tủ sách
              </Link>
            </div>
          </div>

          {/* Card 5: Ngữ Pháp */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20 text-2xl">
                📝
              </div>
              <h3 className="text-lg font-bold">Cấu Trúc Ngữ Pháp</h3>
              <p className="text-sm text-zinc-500">
                Hệ thống các cấu trúc ngữ pháp từ sơ cấp đến cao cấp. Rõ ràng, dễ học kèm nhiều ví dụ thực tế.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/grammar"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Học ngữ pháp
              </Link>
            </div>
          </div>

          {/* Card 6: AI Luyện Nói */}
          <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20 text-2xl">
                🎙️
              </div>
              <h3 className="text-lg font-bold">AI Luyện Nói</h3>
              <p className="text-sm text-zinc-500">
                Luyện nói giao tiếp phản xạ với AI, nhận phân tích phát âm và chấm điểm độ chính xác chi tiết.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/speaking"
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Luyện nói ngay
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
