"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  BookText,
  Headphones,
  Languages,
  Library,
  ListFilter,
  Mic2,
  NotebookTabs,
  SlidersHorizontal,
  Sparkles,
  Video,
} from "lucide-react"

import { NavMain, type SidebarSubmenuGroup } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { tokenUtils } from "@/lib/utils/tokenUtils"

type RouteSidebar = {
  label: string
  groups: SidebarSubmenuGroup[]
}

const routeSidebars: Record<string, RouteSidebar> = {
  "/dashboard": {
    label: "Trang chủ",
    groups: [
      {
        title: "Học tập của bạn",
        icon: Sparkles,
        items: [
          { title: "Tổng quan", url: "/dashboard" },
          { title: "Khóa học đang học", url: "/courses" },
          { title: "Sổ tay từ vựng", url: "/flashcard" },
        ],
      },
    ],
  },
  "/courses": {
    label: "Khóa học",
    groups: [
      {
        title: "Cấp độ",
        icon: SlidersHorizontal,
        items: [
          { title: "Tất cả cấp độ", url: "/courses" },
          { title: "Sơ cấp", url: "/courses?level=Sơ%20cấp" },
          { title: "Trung cấp", url: "/courses?level=Trung%20cấp" },
        ],
      },
      {
        title: "Thể loại",
        icon: ListFilter,
        items: [
          { title: "Giản thể (Trung Quốc)", url: "/courses?script=simplified" },
          { title: "Phồn thể (Đài Loan)", url: "/courses?script=traditional" },
        ],
      },
    ],
  },
  "/bilingual": {
    label: "Song ngữ",
    groups: [
      {
        title: "Trình độ HSK",
        icon: Languages,
        items: [
          { title: "Tất cả bài đọc", url: "/bilingual" },
          ...[1, 2, 3, 4, 5, 6].map((level) => ({
            title: `HSK ${level}`,
            url: `/bilingual?level=HSK%20${level}`,
          })),
        ],
      },
      {
        title: "Luyện đọc",
        icon: BookOpen,
        items: [
          { title: "Bài đọc song ngữ", url: "/bilingual" },
          { title: "Từ đã lưu", url: "/flashcard" },
        ],
      },
    ],
  },
  "/stories": {
    label: "Sách – Báo",
    groups: [
      {
        title: "Khám phá",
        icon: Library,
        items: [
          { title: "Đang thịnh hành", url: "/stories#trending" },
          { title: "Mới cập nhật", url: "/stories#latest" },
          { title: "Dành cho bạn", url: "/stories#recommended" },
        ],
      },
    ],
  },
  "/speaking": {
    label: "AI luyện nói",
    groups: [
      {
        title: "Thực hành",
        icon: Mic2,
        items: [
          { title: "Chủ đề hội thoại", url: "/speaking" },
          { title: "Hội thoại đã lưu", url: "/speaking#history" },
        ],
      },
      {
        title: "Kỹ năng",
        icon: Headphones,
        items: [
          { title: "Luyện phát âm", url: "/speaking#pronunciation" },
          { title: "Phản xạ giao tiếp", url: "/speaking#conversation" },
        ],
      },
    ],
  },
  "/flashcard": {
    label: "Từ vựng",
    groups: [
      {
        title: "Sổ tay từ vựng",
        icon: NotebookTabs,
        items: [
          { title: "Tất cả bộ từ", url: "/flashcard" },
          { title: "Thêm từ mới", url: "/flashcard/add" },
          { title: "Ôn tập flashcard", url: "/flashcard/study" },
          { title: "Kết quả học tập", url: "/flashcard/results" },
        ],
      },
    ],
  },
  "/grammar": {
    label: "Ngữ pháp",
    groups: [
      {
        title: "Khám phá ngữ pháp",
        icon: BookText,
        items: [
          { title: "Cấp độ", url: "/grammar#modules" },
          { title: "Chủ đề ngữ pháp", url: "/grammar#topics" },
          { title: "Danh sách cấu trúc", url: "/grammar#details" },
        ],
      },
    ],
  },
  "/video": {
    label: "Bài tập",
    groups: [
      {
        title: "Video luyện tập",
        icon: Video,
        items: [
          { title: "Thư viện video", url: "/video" },
          { title: "Bài tập từ vựng", url: "/video?type=vocabulary" },
          { title: "Bài tập ngữ pháp", url: "/video?type=grammar" },
        ],
      },
    ],
  },
}

function getRouteSidebar(pathname: string): RouteSidebar {
  const matchingRoute = Object.keys(routeSidebars)
    .sort((left, right) => right.length - left.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`))

  return routeSidebars[matchingRoute ?? "/dashboard"]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? "/dashboard"
  const routeSidebar = getRouteSidebar(pathname)
  const [user, setUser] = React.useState({
    name: "Bạn học",
    email: "",
    avatar: "",
  })

  React.useEffect(() => {
    const loadUser = async () => {
      let userData = tokenUtils.getUserData()
      if (!userData && (tokenUtils.getAccessToken() || tokenUtils.getRefreshToken())) {
        try {
          const { getUserMe } = await import("@/api/apiService")
          userData = await getUserMe()
          if (userData) {
            await tokenUtils.saveTokens(
              tokenUtils.getAccessToken() || "",
              tokenUtils.getRefreshToken() || undefined,
              userData
            )
          }
        } catch (error) {
          console.error("Failed to load user info in sidebar", error)
        }
      }

      if (userData) {
        setUser({
          name: userData.first_name || "Bạn học",
          email: userData.email || "",
          avatar: "",
        })
      }
    }

    loadUser()
  }, [])

  return (
    <Sidebar
      collapsible="offcanvas"
      className="app-submenu-sidebar border-r-0 p-3"
      {...props}
    >
      <SidebarHeader className="px-3 pb-4 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-12 rounded-xl hover:bg-white/45">
              <Link href="/dashboard" aria-label="Về trang chủ Sun Chinese">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-md shadow-amber-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                    aria-hidden="true"
                  >
                    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left leading-none">
                  <span className="text-sm font-black tracking-[0.16em] text-amber-800">SUN</span>
                  <span className="mt-1 text-[9px] font-bold tracking-[0.18em] text-zinc-500">CHINESE</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-6 pb-1 pt-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
          {routeSidebar.label}
        </div>
        <NavMain label="Danh mục" items={routeSidebar.groups} />
      </SidebarContent>
      <SidebarFooter className="border-t border-zinc-500/10 p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
