"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  view?: string;
  setView?: (view: string) => void;
  showLogo?: boolean;
}

export default function Header({ view, setView, showLogo = true }: Readonly<HeaderProps>) {
  const pathname = usePathname();

  // Hide the global layout header on pages that render their own Sidebar/Header layout
  const isGlobalHeader = !view && !setView;
  if (isGlobalHeader && (pathname?.includes("/learn") || pathname?.includes("/courses") || pathname?.includes("/bilingual"))) {
    return null;
  }

  const navItems = [
    { name: "Khóa học", href: "/courses", target: "courses" },
    { name: "Song ngữ", href: "/bilingual", target: "bilingual-list" },
    { name: "Sách – Báo", href: "/bilingual", target: "bilingual-list" },
    { name: "AI luyện nói", href: "/courses/living-chinese/learn?step=learn-conversation", target: "learn-conversation" },
    { name: "Từ vựng", href: "/flashcard", target: "home" },
    { name: "Ngữ pháp", href: "/courses/living-chinese/learn?step=learn-video-grammar", target: "learn-video-grammar" },
    { name: "Bài tập", href: "/courses/living-chinese/learn?step=learn-quiz-vocab", target: "learn-quiz-vocab" },
  ];

  const currentPath = pathname || "";
  const isCoursesActive = view ? view.startsWith("course") : currentPath.startsWith("/courses");
  const isBilingualActive = view ? view.startsWith("bilingual") : currentPath.startsWith("/bilingual");
  const isVideoActive = view ? view === "video" : currentPath.startsWith("/video");
  const isFlashcardActive = view ? view === "flashcard" : currentPath.startsWith("/flashcard");
  const isDashboardActive = view ? view === "home" : currentPath === "/dashboard";

  let logoButton = <div />;
  if (showLogo) {
    if (setView) {
      logoButton = (
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 select-none group cursor-pointer text-left"
        >
          <LogoContent />
        </button>
      );
    } else {
      logoButton = (
        <Link
          href="/dashboard"
          className="flex items-center gap-2 select-none group cursor-pointer text-left"
        >
          <LogoContent />
        </Link>
      );
    }
  }

  return (
    <header className="w-full bg-[#fefefe] border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      {/* Logo */}
      {logoButton}

      {/* Nav Menu */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => {
          let isActive = false;
          if (item.name === "Khóa học") isActive = isCoursesActive;
          else if (item.name === "Song ngữ") isActive = isBilingualActive;
          else if (item.name === "Sách – Báo") isActive = false;
          else if (item.name === "AI luyện nói") isActive = view === "learn-conversation";
          else if (item.name === "Từ vựng") isActive = isFlashcardActive;
          else if (item.name === "Ngữ pháp") isActive = view === "learn-video-grammar" || view === "learn-quiz-grammar";
          else if (item.name === "Bài tập") isActive = view === "learn-quiz-vocab";

          if (setView && item.target) {
            return (
              <button
                key={item.name}
                onClick={() => setView(item.target)}
                className={`text-sm font-semibold transition-colors duration-200 cursor-pointer pb-1 ${
                  isActive
                    ? "text-amber-505 border-b-2 border-amber-500"
                    : "text-gray-600 hover:text-amber-500"
                }`}
              >
                {item.name}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold transition-colors duration-200 cursor-pointer pb-1 ${
                isActive
                  ? "text-amber-500 border-b-2 border-amber-500"
                  : "text-gray-600 hover:text-amber-500"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Login Button */}
      <button className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-full hover:bg-amber-600 transition-colors duration-200 shadow-sm cursor-pointer active:scale-95 text-sm">
        Đăng nhập
      </button>
    </header>
  );
}

function LogoContent() {
  return (
    <>
      <div className="relative flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-transform duration-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 text-white"
        >
          <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
        </svg>
      </div>
      <div className="flex flex-col leading-none ml-2">
        <span className="text-sm font-black tracking-widest text-[#f59e0b]">SUN</span>
        <span className="text-xs font-bold text-gray-500 tracking-wider">CHINESE</span>
      </div>
    </>
  );
}
