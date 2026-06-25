"use client";

import Link from "next/link";

interface HeaderProps {
  view: string;
  setView: (view: string) => void;
  showLogo?: boolean;
}

export default function Header({ view, setView, showLogo = true }: HeaderProps) {
  const navItems = [
    { name: "Khóa học", target: "courses" },
    { name: "Song ngữ", target: "bilingual-list" },
    { name: "Sách - Báo", target: "home" },
    { name: "AI luyện nói", target: "home" },
    { name: "Từ vựng", target: "home" },
    { name: "Ngữ pháp", target: "home" },
    { name: "Bài tập", target: "home" },
  ];

  const isCoursesActive = view.startsWith("course");
  const isBilingualActive = view.startsWith("bilingual");

  return (
    <header className="w-full bg-[#fefefe] border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
      {/* Logo */}
      {showLogo ? (
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 select-none group cursor-pointer text-left"
        >
          <div className="relative flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-transform duration-200">
            {/* Smiling Sun SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 text-white"
            >
              <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-widest text-[#f59e0b]">SUN</span>
            <span className="text-xs font-bold text-gray-500 tracking-wider">CHINESE</span>
          </div>
        </button>
      ) : (
        <div />
      )}

      {/* Nav Menu */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => {
          let isActive = false;
          if (item.target === "courses") {
            isActive = isCoursesActive;
          } else if (item.target === "bilingual-list") {
            isActive = isBilingualActive;
          } else {
            isActive = view === item.target;
          }
          return (
            <button
              key={item.name}
              onClick={() => setView(item.target)}
              className={`text-sm font-semibold transition-colors duration-200 cursor-pointer pb-1 ${
                isActive
                  ? "text-amber-500 border-b-2 border-amber-500"
                  : "text-gray-600 hover:text-amber-500"
              }`}
            >
              {item.name}
            </button>
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
