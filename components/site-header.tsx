"use client"

import Link from "next/link"
import { PanelLeft } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

const primaryNavigation = [
  { title: "Khóa học", href: "/courses" },
  { title: "Song ngữ", href: "/bilingual" },
  { title: "Sách – Báo", href: "/stories" },
  { title: "AI luyện nói", href: "/speaking" },
  { title: "Từ vựng", href: "/flashcard" },
  { title: "Ngữ pháp", href: "/grammar" },
  { title: "Bài tập", href: "/video" },
]

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Primary app navigation. The sidebar is intentionally reserved for local menus. */
export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname() ?? ""

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-950/5 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Button
          className="size-9 shrink-0 rounded-xl text-zinc-700 hover:bg-amber-100/60 lg:hidden"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Mở menu danh mục"
        >
          <PanelLeft className="size-5" />
        </Button>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {primaryNavigation.map((item) => {
            const isActive = isActiveRoute(pathname, item.href)

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={`h-10 whitespace-nowrap rounded-xl px-3 text-sm font-bold xl:px-4 ${
                  isActive
                    ? "bg-amber-100/70 text-amber-700 hover:bg-amber-100"
                    : "text-zinc-500 hover:bg-amber-50 hover:text-zinc-900"
                }`}
              >
                <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                  {item.title}
                </Link>
              </Button>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end lg:flex-none">
          <Button
            asChild
            className="h-10 rounded-xl bg-amber-500 px-4 text-sm font-black text-amber-950 shadow-sm shadow-amber-500/25 hover:bg-amber-400 sm:px-5"
          >
            <Link href="/sign-in">Đăng nhập</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
