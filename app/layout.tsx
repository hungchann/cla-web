import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./query-provider";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CLA - Chinese Learning App",
  description: "Học tiếng Trung hiệu quả thông qua bài đọc song ngữ, flashcards và video phụ đề.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300">
        <QueryProvider>
          {/* Main Navigation Header */}
          <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Logo */}
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 font-bold text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
                    華
                  </span>
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                    CLA Web
                  </span>
                </Link>
                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/bilingual"
                    className="text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500 transition-colors"
                  >
                    Song ngữ
                  </Link>
                  <Link
                    href="/video"
                    className="text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500 transition-colors"
                  >
                    Video học
                  </Link>
                  <Link
                    href="/flashcard"
                    className="text-sm font-medium text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500 transition-colors"
                  >
                    Flashcards
                  </Link>
                </nav>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                {/* User Status / Premium badge */}
                <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500 ring-1 ring-inset ring-amber-500/20">
                  Premium
                </span>
                
                {/* Simple Mobile Menu Toggle */}
                <div className="flex md:hidden">
                  <button className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile Nav Link List for quick accessibility */}
            <div className="md:hidden flex items-center justify-around border-t border-zinc-100 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/95 py-2.5 px-4 text-xs font-medium">
              <Link href="/dashboard" className="text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500">
                Dashboard
              </Link>
              <Link href="/bilingual" className="text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500">
                Song ngữ
              </Link>
              <Link href="/video" className="text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500">
                Video
              </Link>
              <Link href="/flashcard" className="text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-500">
                Flashcard
              </Link>
            </div>
          </header>

          {/* Main Layout Container */}
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
