"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { bilingualApi } from "@/api/bilingual";
import { updateHskLevel } from "@/api/profile";
import { getUser } from "@/api/apiService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Premium & Voucher states
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
      const hasToken = !!tokenUtils.getAccessToken() || !!tokenUtils.getRefreshToken();
      if (!hasToken) return;
      setLoadingLevel(true);
      try {
        const fullUser = await getUser();
        if (fullUser?.user) {
          setUserData(fullUser.user);
        }
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
        <Card className="flex items-center gap-4 p-5 shadow-xs border-zinc-200 dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Đã thành thạo</p>
            <p className="text-2xl font-black text-zinc-850 dark:text-zinc-100">{stats.mastered} từ</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5 shadow-xs border-zinc-200 dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Đang học</p>
            <p className="text-2xl font-black text-zinc-850 dark:text-zinc-100">{stats.learning} từ</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5 shadow-xs border-zinc-200 dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cần ôn tập</p>
            <p className="text-2xl font-black text-zinc-850 dark:text-zinc-100">{stats.review} từ</p>
          </div>
        </Card>
      </section>

      {/* VIP/Premium & Voucher Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Premium Status Card */}
        <Card className="md:col-span-2 relative overflow-hidden bg-zinc-955 dark:bg-zinc-900 border-zinc-850 p-6 flex flex-col justify-between min-h-[180px] text-white">
          <div className="absolute right-4 bottom-4 opacity-10 text-8xl select-none pointer-events-none">
            👑
          </div>
          <CardHeader className="p-0 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-white">Gói Tài Khoản của Bạn</CardTitle>
            <Badge variant={isPremium ? "default" : "secondary"} className={isPremium ? "bg-amber-500 text-zinc-950 animate-pulse border-none font-bold" : "bg-zinc-800 text-zinc-400 border-none font-bold"}>
              {isPremium ? "👑 Premium" : "Free"}
            </Badge>
          </CardHeader>
          <CardContent className="p-0 mt-3 text-zinc-400 text-xs leading-relaxed max-w-md">
            {isPremium 
              ? "Xin chúc mừng! Bạn đã sở hữu tài khoản Premium. Mở khóa toàn bộ kho sách, video bài học và flashcard không giới hạn." 
              : "Nâng cấp lên gói Premium để học không giới hạn, xem đầy đủ video giải thích ngữ pháp, tra từ nhanh và nhận nhiều ưu đãi hơn."
            }
          </CardContent>
          <CardFooter className="p-0 mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between flex-wrap gap-3">
            {isPremium ? (
              <span className="text-[11px] font-bold text-amber-500">Hạn dùng: Vô thời hạn (Vip Lifetime)</span>
            ) : (
              <>
                <span className="text-[11px] font-bold text-zinc-400">Gói 399k / Năm</span>
                <Button
                  onClick={handleStripeCheckout}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-955 font-bold rounded-xl active:scale-[0.98] cursor-pointer border-none"
                >
                  Nâng cấp Premium
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* Voucher Card */}
        <Card className="p-6 flex flex-col justify-between border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/40">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-50">
              <span>🎟️</span> Nhập mã giới thiệu
            </CardTitle>
            <CardDescription className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Nhập mã Voucher từ người seeding để nhận ngay 30 ngày Premium trải nghiệm miễn phí.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <form onSubmit={handleRedeemVoucher} className="space-y-3">
              <Input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Ví dụ: CLA-SEED-2026"
                disabled={redeeming}
                className="w-full h-9.5 text-xs font-bold"
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
              <Button
                type="submit"
                disabled={redeeming || !voucherCode.trim()}
                className="w-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white disabled:opacity-50 h-9.5"
              >
                {redeeming ? "Đang xử lý..." : "Áp dụng"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Main Learning Hub */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold tracking-tight">Khu Vực Học Tập</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Bilingual */}
          <Card className="group relative flex flex-col justify-between p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Đọc Song Ngữ</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Rèn luyện khả năng đọc hiểu với các bài viết song ngữ Trung - Việt, nhấn để tra Pinyin và nghĩa của từ tức thì.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild className="w-full font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white h-10">
                <Link href="/bilingual">Bắt đầu đọc</Link>
              </Button>
            </div>
          </Card>

          {/* Card 2: Videos */}
          <Card className="group relative flex flex-col justify-between p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-500/20 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Học Qua Video</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Xem video bài giảng với phụ đề SRT chạy chữ song ngữ và làm các bài tập trắc nghiệm nhanh để nhớ kiến thức sâu sắc.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild className="w-full font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white h-10">
                <Link href="/video">Xem danh sách video</Link>
              </Button>
            </div>
          </Card>

          {/* Card 3: Flashcards */}
          <Card className="group relative flex flex-col justify-between p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Thẻ Ghi Nhớ (Flashcard)</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Luyện nhớ từ vựng với phương pháp lặp lại ngắt quãng (SRS). Lật thẻ 3D trực quan và lưu trữ từ vựng vào sổ tay cá nhân.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild className="w-full font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white h-10">
                <Link href="/flashcard">Ôn tập từ vựng</Link>
              </Button>
            </div>
          </Card>

          {/* Card 4: Sách – Báo */}
          <Card className="group relative flex flex-col justify-between p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 text-2xl shrink-0">
                📖
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Sách – Báo</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Khám phá thế giới truyện, sách báo song ngữ phong phú. Cải thiện khả năng đọc trôi chảy theo ngữ cảnh.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild className="w-full font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white h-10">
                <Link href="/stories">Đọc tủ sách</Link>
              </Button>
            </div>
          </Card>

          {/* Card 5: Ngữ Pháp */}
          <Card className="group relative flex flex-col justify-between p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20 text-2xl shrink-0">
                📝
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Cấu Trúc Ngữ Pháp</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Hệ thống các cấu trúc ngữ pháp từ sơ cấp đến cao cấp. Rõ ràng, dễ học kèm nhiều ví dụ thực tế.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild className="w-full font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white h-10">
                <Link href="/grammar">Học ngữ pháp</Link>
              </Button>
            </div>
          </Card>

          {/* Card 6: AI Luyện Nói */}
          <Card className="group relative flex flex-col justify-between p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20 text-2xl shrink-0">
                🎙️
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">AI Luyện Nói</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Luyện nói giao tiếp phản xạ với AI, nhận phân tích phát âm và chấm điểm độ chính xác chi tiết.
              </p>
            </div>
            <div className="mt-6">
              <Button asChild className="w-full font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white h-10">
                <Link href="/speaking">Luyện nói ngay</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
