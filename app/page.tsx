import Link from "next/link";
import { Metadata } from "next";

// Lucide Icons
import {
  BookOpen,
  Layers,
  Video,
  Mic,
  FileText,
  Library,
  Sparkles,
  ArrowRight,
  Heart
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "CLA – Chinese Learning App | Học Tiếng Trung Hiệu Quả",
  description:
    "Nền tảng học tiếng Trung toàn diện: bài đọc song ngữ, flashcard SRS, video bài giảng, AI luyện nói và ngữ pháp có hệ thống.",
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "Đọc Song Ngữ",
    desc: "Nhấn vào bất kỳ chữ Hán nào để xem Pinyin & nghĩa tức thì. Học từ vựng theo ngữ cảnh thực tế.",
  },
  {
    icon: Layers,
    title: "Flashcard SRS",
    desc: "Ôn luyện từ vựng bằng phương pháp lặp lại ngắt quãng (Spaced Repetition). Không bao giờ quên từ đã học.",
  },
  {
    icon: Video,
    title: "Video Bài Giảng",
    desc: "Video với phụ đề song ngữ chạy chữ đồng bộ. Trả lời câu hỏi trắc nghiệm tương tác trong khi xem.",
  },
  {
    icon: Mic,
    title: "AI Luyện Nói",
    desc: "Đối thoại trực tiếp với AI, nhận phân tích độ chính xác phát âm từng từ. Phản xạ tiếng Trung thật sự.",
  },
  {
    icon: FileText,
    title: "Ngữ Pháp Hệ Thống",
    desc: "Tổng hợp cấu trúc ngữ pháp đầy đủ từ sơ cấp đến nâng cao. Ví dụ kèm Pinyin & nghĩa tiếng Việt.",
  },
  {
    icon: Library,
    title: "Thư Viện Truyện",
    desc: "Đọc truyện và sách song ngữ Trung–Việt. Hệ thống tự động lưu tiến độ đọc cho bạn.",
  },
];

const STATS = [
  { value: "5,000+", label: "Từ vựng HSK 1–6" },
  { value: "200+", label: "Bài đọc song ngữ" },
  { value: "6", label: "Cấp độ HSK" },
  { value: "AI", label: "Luyện nói thông minh" },
];

// SUN CHINESE Logo Component
function SunChineseLogo({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div className={`flex items-center gap-2 select-none group shrink-0 ${className}`}>
      <div className="relative flex items-center justify-center w-9 h-9 bg-amber-500 rounded-full shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-transform duration-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-white"
        >
          <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
        </svg>
      </div>
      <div className="flex flex-col leading-none text-left">
        <span className="text-sm font-black tracking-widest text-amber-500">SUN</span>
        <span className="text-[10px] font-bold text-zinc-400 tracking-wider">CHINESE</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 px-4 sm:px-8 h-14 flex items-center justify-between">
        <Link href="/">
          <SunChineseLogo />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5"
          >
            Đăng nhập
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs text-xs"
          >
            <Link href="/register">Bắt đầu miễn phí</Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 sm:px-8 pt-20 pb-28 text-center bg-gradient-to-b from-amber-50/60 via-white to-white dark:from-amber-950/10 dark:via-zinc-950 dark:to-zinc-950">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-650 dark:text-amber-400" />
              <span>Nền tảng học tiếng Trung toàn diện</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              Học tiếng Trung{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                hiệu quả
              </span>
              <br />
              theo cách của bạn
            </h1>

            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Từ bài đọc song ngữ, flashcard SRS, video bài giảng đến AI luyện nói và ngữ pháp hệ thống — tất cả trong một nền tảng.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer h-12 px-8"
              >
                <Link href="/register" id="hero-cta-primary" className="flex items-center gap-1.5">
                  Bắt đầu học miễn phí <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-base hover:border-amber-450 hover:text-amber-600 dark:hover:text-amber-500 transition-all cursor-pointer h-12 px-8"
              >
                <Link href="/sign-in" id="hero-cta-secondary">
                  Đăng nhập
                </Link>
              </Button>
            </div>

            {/* Sample characters decoration */}
            <div className="flex justify-center gap-6 pt-6 text-4xl font-bold opacity-20 dark:opacity-10 select-none">
              <span className="text-amber-500">学</span>
              <span className="text-orange-500">习</span>
              <span className="text-amber-600">中</span>
              <span className="text-orange-600">文</span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-3xl font-black text-amber-600 dark:text-amber-500">{stat.value}</div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Mọi thứ bạn cần để học tiếng Trung
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
              Hệ sinh thái học tập đầy đủ, thiết kế cho người học tiếng Trung từ cơ bản đến nâng cao.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group relative flex flex-col justify-between p-6 border-zinc-200/60 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-900 bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-350 hover:shadow-md"
                >
                  <CardContent className="p-0 space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 shrink-0 transition-transform group-hover:scale-105 duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">{feature.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 px-4 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <h2 className="text-3xl font-black text-white">Bắt đầu hành trình học tiếng Trung ngay hôm nay</h2>
            <p className="text-amber-100 text-sm leading-relaxed">
              Miễn phí hoàn toàn. Không cần thẻ tín dụng. Bắt đầu học từ HSK 1 đến HSK 6.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-white hover:bg-amber-50 text-amber-600 hover:text-amber-700 font-black text-base shadow-lg cursor-pointer h-12 px-8"
            >
              <Link href="/register" id="bottom-cta" className="flex items-center gap-1.5">
                Tạo tài khoản miễn phí
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-8 text-center bg-zinc-50/50 dark:bg-zinc-950">
        <div className="flex justify-center mb-3">
          <SunChineseLogo />
        </div>
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-650 flex items-center justify-center gap-1.5">
          <span>© {new Date().getFullYear()} Sun Chinese. Được xây dựng với</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span>cho người học tiếng Trung.</span>
        </p>
      </footer>
    </div>
  );
}
