"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
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
import { SunChineseLogo } from "@/components/SunChineseLogo"
import { bilingualApi } from "@/api/bilingual"
import { fetchVideoGenres } from "@/api/video"
import { getBookGenres } from "@/api/stories"

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
    label: "Video",
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
  const { data: bilingualGenres } = useQuery({
    queryKey: ["sidebar-bilingual-genres"],
    queryFn: bilingualApi.getTopics,
    enabled: pathname === "/bilingual" || pathname.startsWith("/bilingual/"),
    staleTime: 5 * 60 * 1000,
  })
  const { data: videoGenres } = useQuery({
    queryKey: ["sidebar-video-genres"],
    queryFn: fetchVideoGenres,
    enabled: pathname === "/video" || pathname.startsWith("/video/"),
    staleTime: 5 * 60 * 1000,
  })
  const { data: storyGenres } = useQuery({
    queryKey: ["sidebar-story-genres"],
    queryFn: getBookGenres,
    enabled: pathname === "/stories" || pathname.startsWith("/stories/"),
    staleTime: 5 * 60 * 1000,
  })
  const [user, setUser] = React.useState({
    name: "Bạn học",
    email: "",
    avatar: "",
  })

  const sidebarGroups = React.useMemo(() => {
    if (pathname === "/bilingual" || pathname.startsWith("/bilingual/")) {
      const genreItems = (bilingualGenres ?? []).map((genre: { title: string }) => ({
        title: genre.title,
        url: `/bilingual?genre=${encodeURIComponent(genre.title)}`,
      }))
      const genreGroup = {
        title: "Thể loại",
        icon: ListFilter,
        items: [
          { title: "Tất cả thể loại", url: "/bilingual" },
          ...genreItems,
        ],
      }
      return routeSidebar.groups.flatMap((group) =>
        group.title === "Trình độ HSK" ? [group, genreGroup] : [group],
      )
    }

    if (pathname === "/stories" || pathname.startsWith("/stories/")) {
      return routeSidebar.groups.concat({
        title: "Thể loại",
        icon: ListFilter,
        items: [
          { title: "Tất cả sách", url: "/stories" },
          ...(storyGenres ?? []).map((genre: { id: string; title: string }) => ({
            title: genre.title,
            url: `/stories?genre=${encodeURIComponent(genre.id)}`,
          })),
        ],
      })
    }

    if (pathname === "/video" || pathname.startsWith("/video/")) {
      return routeSidebar.groups.concat({
        title: "Thể loại",
        icon: ListFilter,
        items: [
          { title: "Tất cả video", url: "/video" },
          ...(videoGenres ?? []).map((genre: { id: string; title: string }) => ({
            title: genre.title,
            url: `/video?genre=${encodeURIComponent(genre.id)}`,
          })),
        ],
      })
    }

    return routeSidebar.groups
  }, [bilingualGenres, pathname, routeSidebar.groups, storyGenres, videoGenres])

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
      className="app-submenu-sidebar border-r-0"
      {...props}
    >
      <SidebarHeader className="px-3 pb-4 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-12 rounded-xl hover:bg-sidebar-accent/50">
              <Link href="/dashboard" aria-label="Về trang chủ Sun Chinese">
                <SunChineseLogo
                  size={36}
                  textClassName="text-amber-800 dark:text-amber-500 font-black tracking-[0.16em]"
                  subtextClassName="text-zinc-500 dark:text-zinc-400 font-bold tracking-[0.18em]"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-6 pb-1 pt-2 text-xs font-black uppercase tracking-[0.16em] text-sidebar-foreground/60">
          {routeSidebar.label}
        </div>
        <NavMain label="Danh mục" items={sidebarGroups} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
