"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  PanelLeftClose,
  PanelLeftOpen,
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
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { tokenUtils } from "@/lib/utils/tokenUtils"
import { SunChineseLogo } from "@/components/SunChineseLogo"
import { bilingualApi } from "@/api/bilingual"
import { fetchVideoGenres } from "@/api/video"
import { getBookGenres } from "@/api/stories"
import { grammarApi } from "@/api/grammar"
import { coursesApi } from "@/api/courses"
import type { CourseLesson } from "@/lib/types/course"
import { Suspense } from "react"

type RouteSidebar = {
  label: string
  groups: SidebarSubmenuGroup[]
}

/** Nút thu gọn/mở rộng sidebar — che chữ khi sidebar ở chế độ icon */
function CollapseToggle() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip="Thu gọn / mở rộng menu"
      className="rounded-xl text-zinc-500 hover:bg-sidebar-accent/50 hover:text-zinc-800 dark:hover:text-zinc-200"
    >
      {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
      <span className="font-bold text-sm">Thu gọn menu</span>
    </SidebarMenuButton>
  )
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
          { title: "Tất cả cấp độ", url: "/grammar" },
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

/** Sidebar động cho trang Ngữ pháp: Trình độ HSK + Chủ đề ngữ pháp. */
function GrammarNavMain() {
  return (
    <Suspense
      fallback={
        <SidebarGroup className="px-3 py-2">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Đang tải..." className="h-10 rounded-xl px-3 text-sm font-bold">
                <SlidersHorizontal className="size-4" />
                <span>Đang tải...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      <GrammarNavContent />
    </Suspense>
  )
}

function GrammarNavContent() {
  const pathname = usePathname() ?? ""
  const searchParams = useSearchParams()
  const isGrammar = pathname === "/grammar" || pathname.startsWith("/grammar/")

  const selectedModuleId = searchParams.get("module") || ""

  const { data: modules } = useQuery({
    queryKey: ["sidebar-grammar-modules"],
    queryFn: grammarApi.getGrammarModules,
    enabled: isGrammar,
    staleTime: 5 * 60 * 1000,
  })

  const { data: topicsRaw } = useQuery({
    queryKey: ["sidebar-grammar-topics", selectedModuleId],
    queryFn: () => grammarApi.getTopicOfGrammarItem(selectedModuleId),
    enabled: isGrammar && !!selectedModuleId,
    staleTime: 5 * 60 * 1000,
  })

  const topics = (() => {
    if (!topicsRaw) return []
    const normalized = topicsRaw
      .map((item: any) => {
        const topic = item?.topic_of_grammarModule_id ?? item?.topic_id ?? item
        return {
          id: String(topic?.id ?? ""),
          title: topic?.title ?? topic?.name ?? "",
        }
      })
      .filter((t: any) => t.title)

    const titleMap = new Map<string, any>()
    normalized.forEach((t: any) => {
      if (!titleMap.has(t.title)) titleMap.set(t.title, t)
    })
    return Array.from(titleMap.values())
  })()

  const groups: SidebarSubmenuGroup[] = [
    {
      title: "Trình độ HSK",
      icon: SlidersHorizontal,
      items: [
        { title: "Tất cả cấp độ", url: "/grammar" },
        ...(modules ?? []).map((mod: any) => ({
          title: String(mod?.title || "").replace(/^Ngữ pháp\s*/i, ""),
          url: `/grammar?module=${encodeURIComponent(mod.id)}`,
        })),
      ],
    },
    {
      title: "Chủ đề ngữ pháp",
      icon: ListFilter,
      items: topics.length > 0
        ? topics.map((topic: any) => ({
            title: topic.title,
            url: `/grammar?module=${encodeURIComponent(selectedModuleId)}&topic=${encodeURIComponent(topic.id)}`,
          }))
        : [{ title: "Chọn cấp độ HSK trước", url: "/grammar" }],
    },
  ]

  return <NavMain items={groups} />
}

const COURSE_LESSON_STEPS: Record<string, string> = {
  video_vocab: "learn-video-vocab",
  vocab_theory: "learn-vocab-theory",
  quiz_vocab: "learn-quiz-vocab",
  video_grammar: "learn-video-grammar",
  quiz_grammar: "learn-quiz-grammar",
  dictation: "learn-dictation",
  conversation: "learn-conversation",
  extra: "learn-extra",
}

const COURSE_LESSON_FALLBACKS = [
  ["video_vocab", "Video từ vựng"],
  ["vocab_theory", "Lý thuyết: Giải nghĩa từ vựng"],
  ["quiz_vocab", "Bài tập: từ vựng"],
  ["video_grammar", "Video ngữ pháp"],
  ["quiz_grammar", "Bài tập ngữ pháp"],
  ["dictation", "Bài tập: Nghe chép chính tả"],
  ["conversation", "Thực hành hội thoại"],
  ["extra", "Bài tập bổ sung"],
] as const

function CourseNavMain({ courseId }: { courseId: string }) {
  return (
    <Suspense
      fallback={
        <SidebarGroup className="px-3 py-2">
          <SidebarMenu className="gap-1"><SidebarMenuItem><SidebarMenuButton className="h-10 rounded-xl px-3 text-sm font-bold">Đang tải bài học...</SidebarMenuButton></SidebarMenuItem></SidebarMenu>
        </SidebarGroup>
      }
    >
      <CourseNavContent courseId={courseId} />
    </Suspense>
  )
}

function CourseNavContent({ courseId }: { courseId: string }) {
  const { data: chapters, isLoading } = useQuery({
    queryKey: ["sidebar-course-lessons", courseId],
    queryFn: () => coursesApi.getCourseChapters(courseId),
    staleTime: 5 * 60 * 1000,
  })

  const groups: SidebarSubmenuGroup[] = (chapters || []).map((chapter, index) => {
    const lessons = (chapter.lessons || []).filter(
      (lesson) => COURSE_LESSON_STEPS[lesson.lesson_type],
    )
    const items = lessons.length > 0
      ? lessons.map((lesson) => ({
          title: lesson.title,
          url: `/courses/${courseId}/learn?lesson=${lesson.id}`,
        }))
      : COURSE_LESSON_FALLBACKS.map(([type, title]) => ({
          title,
          url: `/courses/${courseId}/learn?step=${COURSE_LESSON_STEPS[type]}`,
        }))
    return {
      title: chapter.title || `Chương ${index + 1}`,
      icon: BookOpen,
      defaultOpen: index === 0,
      items,
    }
  })

  const fallbackGroup: SidebarSubmenuGroup = {
    title: isLoading ? "Đang tải chương..." : "Nội dung bài học",
    icon: BookOpen,
    items: COURSE_LESSON_FALLBACKS.map(([type, title]) => ({
      title,
      url: `/courses/${courseId}/learn?step=${COURSE_LESSON_STEPS[type]}`,
    })),
  }

  return <NavMain items={groups.length > 0 ? groups : [fallbackGroup]} />
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? "/dashboard"
  const routeSidebar = getRouteSidebar(pathname)
  const courseId = pathname.match(/^\/courses\/([^/]+)/)?.[1] ?? ""
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
      collapsible="icon"
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
        <SidebarMenu className="px-2 pb-2">
          <SidebarMenuItem>
            <CollapseToggle />
          </SidebarMenuItem>
        </SidebarMenu>
        {courseId ? (
          <CourseNavMain courseId={decodeURIComponent(courseId)} />
        ) : pathname === "/grammar" || pathname.startsWith("/grammar/") ? (
          <GrammarNavMain />
        ) : (
          <NavMain items={sidebarGroups} />
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
