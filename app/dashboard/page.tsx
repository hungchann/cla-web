import Link from "next/link"
import { ArrowRight, BookOpen, Flame, GraduationCap, Headphones, Layers } from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Card } from "@/components/ui/card"

const learningAreas = [
  {
    title: "Khóa học",
    description: "Theo lộ trình từ sơ cấp đến trung cấp.",
    href: "/courses",
    icon: GraduationCap,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "Đọc song ngữ",
    description: "Đọc hiểu HSK và chạm vào từ để tra nghĩa.",
    href: "/bilingual",
    icon: BookOpen,
    accent: "bg-orange-100 text-orange-700",
  },
  {
    title: "AI luyện nói",
    description: "Luyện phát âm và phản xạ qua hội thoại.",
    href: "/speaking",
    icon: Headphones,
    accent: "bg-rose-100 text-rose-700",
  },
  {
    title: "Từ vựng",
    description: "Ghi nhớ từ mới bằng flashcard cá nhân.",
    href: "/flashcard",
    icon: Layers,
    accent: "bg-yellow-100 text-yellow-700",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageHeader
        title="Chào bạn, cùng học tiếng Trung nhé"
        description="Chọn một khu vực học tập để tiếp tục theo nhịp của riêng bạn."
        icon={<Flame className="size-6" />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {learningAreas.map((area) => {
          const Icon = area.icon
          return (
            <Link key={area.href} href={area.href} className="group">
              <Card className="flex h-full min-h-48 flex-col justify-between rounded-2xl border-amber-950/10 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900">
                <div className={`flex size-11 items-center justify-center rounded-2xl ${area.accent}`}>
                  <Icon className="size-5" />
                </div>
                <div className="mt-6">
                  <h2 className="text-lg font-black tracking-tight text-zinc-900 transition-colors group-hover:text-amber-700 dark:text-zinc-100 dark:group-hover:text-amber-400">
                    {area.title}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {area.description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-amber-700">
                  Bắt đầu học <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
