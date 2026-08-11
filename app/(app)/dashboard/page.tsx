import Link from "next/link"
import {
    ArrowRight,
    BookOpen,
    BookText,
    Facebook,
    Flame,
    GraduationCap,
    Headphones,
    Layers,
    Library,
    Mail,
    MapPin,
    Phone,
    Video,
    Youtube,
} from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Card } from "@/components/ui/card"

const learningAreas = [
    {
        title: "Khóa học",
        description: "Theo lộ trình từ sơ cấp đến trung cấp.",
        href: "/courses",
        icon: GraduationCap,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
    {
        title: "Đọc song ngữ",
        description: "Đọc hiểu HSK và chạm vào từ để tra nghĩa.",
        href: "/bilingual",
        icon: BookOpen,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
    {
        title: "Video",
        description: "Học qua video phụ đề song ngữ tương tác.",
        href: "/video",
        icon: Video,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
    {
        title: "Sách – Báo",
        description: "Đọc truyện song ngữ theo từng chương.",
        href: "/stories",
        icon: Library,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
    {
        title: "AI luyện nói",
        description: "Luyện phát âm và phản xạ qua hội thoại.",
        href: "/speaking",
        icon: Headphones,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
    {
        title: "Từ vựng",
        description: "Ghi nhớ từ mới bằng flashcard cá nhân.",
        href: "/flashcard",
        icon: Layers,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
    {
        title: "Ngữ pháp",
        description: "Hệ thống cấu trúc theo cấp độ HSK.",
        href: "/grammar",
        icon: BookText,
        accent: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
    },
]

const contactInfo = [
    { icon: Phone, label: "Hotline", value: "1900 000 000" },
    { icon: Mail, label: "Email", value: "support@sunChinese.vn" },
    { icon: MapPin, label: "Địa chỉ", value: "Hà Nội, Việt Nam" },
]

const socialLinks = [
    { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
    { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
]

export default function DashboardPage() {
    return (
        <div className="flex flex-1 flex-col gap-9 p-4 sm:p-6 lg:p-8">
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
                            <Card className="flex h-full min-h-48 flex-col justify-between rounded-2xl border border-amber-950/10 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10 dark:border-zinc-800 dark:bg-zinc-900">
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

            {/* Footer */}
            <footer className="mt-auto rounded-2xl border border-amber-950/10 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Contact */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Liên hệ
                        </h3>
                        <ul className="space-y-2">
                            {contactInfo.map((item) => {
                                const Icon = item.icon
                                return (
                                    <li key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        <Icon className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                                        <span className="font-bold text-zinc-500 dark:text-zinc-500">{item.label}:</span>
                                        {item.value}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Social */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Mạng xã hội
                        </h3>
                        <div className="flex gap-3">
                            {socialLinks.map((item) => {
                                const Icon = item.icon
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={item.label}
                                        className="flex size-10 items-center justify-center rounded-xl border border-amber-950/10 bg-amber-500/10 text-amber-600 transition-all hover:-translate-y-0.5 hover:bg-amber-500 hover:text-white dark:border-zinc-800 dark:text-amber-500"
                                    >
                                        <Icon className="size-5" />
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-4 text-center text-xs font-semibold text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                    © 2026 Sun Chinese. Học tiếng Trung hiệu quả mỗi ngày.
                </div>
            </footer>
        </div>
    )
}
