"use client";

import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { coursesApi } from "@/api/courses";
import { CourseItem, CourseChapter, CourseLesson } from "@/lib/types/course";

const defaultSyllabusLessons = [
    {
        id: 1,
        title: "Bài 1: Phát âm - Chào hỏi cơ bản (1)",
        lessons: [
            { id: "learn-video-vocab", title: "Video từ vựng", lesson_type: "video_vocab" },
            { id: "learn-vocab-theory", title: "Lý thuyết: Giải nghĩa từ vựng", lesson_type: "vocab_theory" },
            { id: "learn-quiz-vocab", title: "Bài tập: từ vựng", lesson_type: "quiz_vocab" },
            { id: "learn-video-grammar", title: "Video ngữ pháp", lesson_type: "video_grammar" },
            { id: "learn-quiz-grammar", title: "Bài tập ngữ pháp", lesson_type: "quiz_grammar" },
            { id: "learn-dictation", title: "Bài tập: Nghe chép chính tả", lesson_type: "dictation" },
            { id: "learn-conversation", title: "Thực hành hội thoại", lesson_type: "conversation" },
            { id: "learn-extra", title: "Bài tập bổ sung", lesson_type: "extra" },
        ],
    },
    { id: 2, title: "Bài 2: Phát âm - Chào hỏi cơ bản (2)", lessons: [] },
    { id: 3, title: "Bài 3: Phát âm - Giới thiệu bản thân (3)", lessons: [] },
    { id: 4, title: "Bài 4: Giới thiệu tuổi tác", tag: "Học thử miễn phí", lessons: [] },
];

export default function CourseDetailPage({
    params,
}: Readonly<{
    params: Promise<{ id: string }>;
}>) {
    const { id } = use(params);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"info" | "syllabus">("syllabus");
    const [expandedLessons, setExpandedLessons] = useState<Record<string | number, boolean>>({});

    const [course, setCourse] = useState<CourseItem | null>(null);
    const [chapters, setChapters] = useState<CourseChapter[]>(defaultSyllabusLessons);

    useEffect(() => {
        let isMounted = true;
        coursesApi.getCourseById(id).then((res) => {
            if (isMounted && res) {
                setCourse(res);
                if (res.chapters && res.chapters.length > 0) {
                    setChapters(res.chapters);
                    setExpandedLessons({ [res.chapters[0].id]: true });
                }
            }
        });
        return () => {
            isMounted = false;
        };
    }, [id]);

    const toggleLesson = (num: string | number) => {
        setExpandedLessons((prev) => ({ ...prev, [num]: !prev[num] }));
    };

    const handleSubtopicClick = (subtopicId: string | number) => {
        router.push(`/courses/${id}/learn?lesson=${subtopicId}`);
    };

    const handleLessonClick = (sub: CourseLesson) => {
        handleSubtopicClick(sub.id);
    };

    const courseTitle = course?.title || "Khóa học Tiếng Trung";

    return (
        <div className="flex flex-col flex-1 pb-16 bg-transparent">
            <main className="max-w-5xl w-full mx-auto py-8 space-y-8 flex-1">
                <BackButton href="/courses" label="Danh sách khóa học" />

                {/* Info Banner */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950 rounded-3xl border-zinc-200/60 dark:border-zinc-800 flex flex-col md:flex-row shadow-sm">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 w-44 h-44 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

                    <div className="p-6 md:p-8 flex-1 space-y-4 z-10">
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white leading-snug">
                            {courseTitle}
                        </h1>
                        {course?.description && (
                            <p className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                                {course.description}
                            </p>
                        )}
                    </div>
                    <div className="relative w-full md:w-80 h-52 md:h-auto bg-zinc-50 dark:bg-zinc-900 shrink-0 border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-800">
                        {course?.image_url ? (
                            <Image
                                src={course.image_url}
                                alt="Syllabus Study Desk"
                                fill
                                sizes="(max-width: 768px) 100vw, 300px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-400 text-sm font-bold">
                                No image
                            </div>
                        )}
                    </div>
                </Card>

                {/* Tabs */}
                <section className="border-b border-zinc-200 dark:border-zinc-800 flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("info")}
                        className={`rounded-none border-b-2 font-extrabold px-1 pb-3 pt-0 h-auto hover:bg-transparent ${activeTab === "info"
                            ? "border-amber-500 text-amber-600 dark:text-amber-500"
                            : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
                            }`}
                    >
                        Thông tin khóa học
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab("syllabus")}
                        className={`rounded-none border-b-2 font-extrabold px-1 pb-3 pt-0 h-auto hover:bg-transparent ${activeTab === "syllabus"
                            ? "border-amber-500 text-amber-600 dark:text-amber-500"
                            : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
                            }`}
                    >
                        Nội dung bài học
                    </Button>
                </section>

                {/* Tab content */}
                {activeTab === "syllabus" && (
                    <section className="space-y-8">
                        <Card className="bg-white dark:bg-zinc-900 rounded-2xl border-zinc-200/60 dark:border-zinc-800 p-6 flex flex-col md:flex-row gap-6 shadow-2xs">
                            <div className="relative w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                                {course?.image_url ? (
                                    <Image
                                        src={course.image_url}
                                        alt="Student studying in Cafe"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 224px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-zinc-400 text-sm font-bold">No image</div>
                                )}
                            </div>
                            <div className="space-y-3 flex-1">
                                <h3 className="font-black text-zinc-900 dark:text-white text-lg">Nội dung bài học</h3>
                                <p className="text-zinc-650 dark:text-zinc-400 text-sm md:text-base leading-relaxed font-semibold">
                                    {course?.description || "Khóa học hướng đến đối tượng người Việt mới bắt đầu học tiếng Trung."}
                                    <br />
                                    Gồm {chapters.length} chương.
                                    <br />
                                    Mỗi chương bao gồm các phần: video từ vựng, lý thuyết giải nghĩa từ vựng, bài tập từ vựng, video ngữ pháp, bài tập ngữ pháp, nghe chép chính tả, thực hành hội thoại, bài tập bổ sung.
                                </p>
                            </div>
                        </Card>

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50/50 dark:bg-amber-950/10 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 shadow-3xs">
                            <div className="w-full md:w-1/2 space-y-2">
                                <div className="flex justify-between text-xs font-black text-amber-700 dark:text-amber-400">
                                    <span>Tiến độ học tập</span>
                                    <span>0 / {chapters.reduce((acc, c) => acc + (c.lessons?.length || 0), 0)} Bài</span>
                                </div>
                                <Progress value={0} className="h-2.5 bg-amber-200/60 dark:bg-amber-950" />
                            </div>
                            <Button
                                onClick={() => handleSubtopicClick(chapters[0]?.lessons?.[0]?.id || 1)}
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer text-sm w-full md:w-auto justify-center active:scale-95"
                            >
                                Bắt đầu học bài 1 <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* List of chapters */}
                        <div className="space-y-4">
                            {chapters.map((chapter) => {
                                const isExpanded = !!expandedLessons[chapter.id];
                                return (
                                    <div
                                        key={chapter.id}
                                        className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
                                    >
                                        <button
                                            onClick={() => toggleLesson(chapter.id)}
                                            className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-amber-500 shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-zinc-400 shrink-0" />
                                                )}
                                                <div className="space-y-1">
                                                    <span className="font-extrabold text-zinc-900 dark:text-white text-base block">
                                                        {chapter.title}
                                                    </span>
                                                    {chapter.title_trans && (
                                                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium block">
                                                            {chapter.title_trans}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {chapter.tag && (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100 border-none font-bold shrink-0 text-xs">
                                                    {chapter.tag}
                                                </Badge>
                                            )}
                                        </button>

                                        {isExpanded && chapter.lessons && chapter.lessons.length > 0 && (
                                            <div className="border-t border-zinc-100 dark:border-zinc-800/60 divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-950/20">
                                                {chapter.lessons.map((sub) => (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => handleLessonClick(sub)}
                                                        className="w-full py-3.5 px-6 pl-12 text-left flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors group cursor-pointer"
                                                    >
                                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                            {sub.title}
                                                        </span>
                                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                            Vào học <ChevronRight className="w-3.5 h-3.5" />
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {activeTab === "info" && (
                    <Card className="bg-white dark:bg-zinc-900 rounded-2xl border-zinc-200/60 dark:border-zinc-800 p-8 shadow-2xs space-y-4">
                        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">Giới thiệu khóa học</h2>
                        <p className="text-sm md:text-base text-zinc-650 dark:text-zinc-400 font-semibold leading-relaxed">
                            {course?.description || "Khóa học được thiết kế chuyên biệt cho người Việt Nam..."}
                        </p>
                    </Card>
                )}
            </main>
        </div>
    );
}
