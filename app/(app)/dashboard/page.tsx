import Link from "next/link"
import {
    ArrowRight,
    BookOpen,
    BookText,
    Flame,
    GraduationCap,
    Headphones,
    Layers,
    Library,
    Mail,
    MapPin,
    Phone,
    Video,
} from "lucide-react"

import { PageHeader } from "@/components/PageHeader"
import { Card } from "@/components/ui/card"
import { BannersCarousel } from "@/components/BannersCarousel"

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
            <path d="M13.5 21v-7h2.5l.5-3h-3V9.05c0-.87.24-1.55 1.6-1.55H16.6V4.85c-.29-.04-1.28-.13-2.43-.13-2.4 0-4.05 1.47-4.05 4.16V11H7.5v3H10v7h3.5Z" />
        </svg>
    )
}

function YoutubeIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
            <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42a2.5 2.5 0 0 0-1.76 1.77A26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81ZM10 15V9l5.2 3L10 15Z" />
        </svg>
    )
}

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
    { icon: FacebookIcon, label: "Facebook", href: "https://facebook.com" },
    { icon: YoutubeIcon, label: "YouTube", href: "https://youtube.com" },
]

export default function DashboardPage() {
    return (
        <div className="flex flex-1 flex-col gap-9 p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Chào bạn, cùng học tiếng Trung nhé"
                description="Chọn một khu vực học tập để tiếp tục theo nhịp của riêng bạn."
                icon={<Flame className="size-6" />}
            />

            <BannersCarousel />

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
