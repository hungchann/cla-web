import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLA – Chinese Learning App | Học Tiếng Trung Hiệu Quả",
  description:
    "Nền tảng học tiếng Trung toàn diện: bài đọc song ngữ, flashcard SRS, video bài giảng, AI luyện nói và ngữ pháp có hệ thống.",
};

const FEATURES = [
  {
    icon: "📖",
    title: "Đọc Song Ngữ",
    desc: "Nhấn vào bất kỳ chữ Hán nào để xem Pinyin & nghĩa tức thì. Học từ vựng theo ngữ cảnh thực tế.",
    color: "amber",
  },
  {
    icon: "🗂️",
    title: "Flashcard SRS",
    desc: "Ôn luyện từ vựng bằng phương pháp lặp lại ngắt quãng (Spaced Repetition). Không bao giờ quên từ đã học.",
    color: "blue",
  },
  {
    icon: "🎬",
    title: "Video Bài Giảng",
    desc: "Video với phụ đề song ngữ chạy chữ đồng bộ. Trả lời câu hỏi trắc nghiệm tương tác trong khi xem.",
    color: "rose",
  },
  {
    icon: "🎤",
    title: "AI Luyện Nói",
    desc: "Đối thoại trực tiếp với AI, nhận phân tích độ chính xác phát âm từng từ. Phản xạ tiếng Trung thật sự.",
    color: "violet",
  },
  {
    icon: "📝",
    title: "Ngữ Pháp Hệ Thống",
    desc: "Tổng hợp cấu trúc ngữ pháp đầy đủ từ sơ cấp đến nâng cao. Ví dụ kèm Pinyin & nghĩa tiếng Việt.",
    color: "emerald",
  },
  {
    icon: "📚",
    title: "Thư Viện Truyện",
    desc: "Đọc truyện và sách song ngữ Trung–Việt. Hệ thống tự động lưu tiến độ đọc cho bạn.",
    color: "orange",
  },
];

const STATS = [
  { value: "5,000+", label: "Từ vựng HSK 1–6" },
  { value: "200+", label: "Bài đọc song ngữ" },
  { value: "6", label: "Cấp độ HSK" },
  { value: "AI", label: "Luyện nói thông minh" },
];

const colorMap: Record<string, string> = {
  amber: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-600",
  blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-600",
  rose: "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600",
  violet: "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30 text-violet-600",
  emerald: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600",
  orange: "bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-600",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-100 dark:border-zinc-800 px-4 sm:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🇨🇳</span>
          <span className="font-black text-lg tracking-tight text-zinc-900 dark:text-white">CLA</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-500/20"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-4 sm:px-8 pt-20 pb-28 text-center bg-gradient-to-b from-amber-50/60 via-white to-white dark:from-amber-950/20 dark:via-zinc-950 dark:to-zinc-950">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
              <span className="animate-pulse">✨</span>
              Nền tảng học tiếng Trung toàn diện
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
              <Link
                href="/register"
                id="hero-cta-primary"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                🚀 Bắt đầu học miễn phí
              </Link>
              <Link
                href="/sign-in"
                id="hero-cta-secondary"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-base hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-500 transition-all"
              >
                Đăng nhập
              </Link>
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

        {/* ── STATS ── */}
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

        {/* ── FEATURES ── */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Mọi thứ bạn cần để học tiếng Trung
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              Hệ sinh thái học tập đầy đủ, thiết kế cho người học tiếng Trung từ cơ bản đến nâng cao.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const colorClass = colorMap[feature.color] ?? colorMap.amber;
              return (
                <div
                  key={feature.title}
                  className={`rounded-2xl border p-6 space-y-3 transition-shadow hover:shadow-md ${colorClass}`}
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-20 px-4 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <h2 className="text-3xl font-black text-white">Bắt đầu hành trình học tiếng Trung ngay hôm nay</h2>
            <p className="text-amber-100 text-sm leading-relaxed">
              Miễn phí hoàn toàn. Không cần thẻ tín dụng. Bắt đầu học từ HSK 1 đến HSK 6.
            </p>
            <Link
              href="/register"
              id="bottom-cta"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-amber-600 font-black text-base hover:bg-amber-50 transition-colors shadow-lg"
            >
              🎉 Tạo tài khoản miễn phí
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🇨🇳</span>
          <span className="font-black text-zinc-900 dark:text-white">CLA</span>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          © {new Date().getFullYear()} Chinese Learning App. Được xây dựng với ❤️ cho người học tiếng Trung.
        </p>
      </footer>
    </div>
  );
}
