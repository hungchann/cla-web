"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tokenUtils } from "@/lib/utils/tokenUtils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const NAV_ITEMS = [
  { name: "Khóa học", href: "/courses" },
  { name: "Song ngữ", href: "/bilingual" },
  { name: "Sách – Báo", href: "/stories" },
  { name: "AI luyện nói", href: "/speaking" },
  { name: "Từ vựng", href: "/flashcard" },
  { name: "Ngữ pháp", href: "/grammar" },
];

export default function Header() {
  const pathname = usePathname() ?? "";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = tokenUtils.getUserData();
    if (user) {
      setIsAuthenticated(true);
      setFirstName(user.first_name || "Bạn học");
    } else {
      setIsAuthenticated(false);
    }
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await tokenUtils.clearAllTokens();
    setIsAuthenticated(false);
    globalThis.location.replace("/sign-in");
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-zinc-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs h-14">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 select-none group shrink-0"
      >
        <div className="relative flex items-center justify-center w-9 h-9 bg-amber-500 rounded-full shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-transform duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-white"
          >
            <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
          </svg>
        </div>
        <div className="flex flex-col leading-none ml-1">
          <span className="text-sm font-black tracking-widest text-amber-500">SUN</span>
          <span className="text-[10px] font-bold text-zinc-400 tracking-wider">CHINESE</span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "text-amber-600 bg-amber-50"
                  : "text-zinc-500 hover:text-amber-600 hover:bg-amber-50/50"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Right Area */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-600 hidden sm:inline select-none">
              Chào, {firstName}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="font-bold rounded-full text-xs active:scale-95"
            >
              Đăng xuất
            </Button>
          </div>
        ) : (
          <Button
            asChild
            size="sm"
            className="bg-amber-500 text-white font-bold rounded-full hover:bg-amber-600 transition-colors shadow-xs text-xs active:scale-95"
          >
            <Link href="/sign-in">Đăng nhập</Link>
          </Button>
        )}

        {/* Mobile navigation menu using shadcn Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 text-zinc-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2 select-none">
                <div className="relative flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full shadow-md shadow-amber-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-white"
                  >
                    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
                  </svg>
                </div>
                <div className="flex flex-col leading-none ml-1">
                  <span className="text-xs font-black tracking-widest text-amber-500">SUN</span>
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider">CHINESE</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`justify-start font-semibold rounded-xl w-full text-sm ${
                      isActive ? "text-amber-600 bg-amber-50/70 hover:bg-amber-50" : "text-zinc-650 hover:text-amber-600"
                    }`}
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href={item.href}>{item.name}</Link>
                  </Button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
