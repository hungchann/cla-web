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
    const [expandedLessons, setExpandedLessons] = useState<Record<string | number, boolean>>({
        1: true,
    });

    const [course, setCourse] = useState<CourseItem | null>(null);
    const [chapters, setChapters] = useState<CourseChapter[]>(defaultSyllabusLessons);

    useEffect(() => {
        let isMounted = true;
        coursesApi.getCourseById(id).then((res) => {
            if (isMounted && res) {
                setCourse(res);
                if (res.chapters && res.chapters.length > 0) {
                    setChapters(res.chapters);
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
        if (sub.lesson_type === "reading" && sub.resource_id) {
            router.push(`/bilingual/${sub.resource_id}`);
            return;
        }
        handleSubtopicClick(sub.id);
    };

    const courseTitle = course?.title || "Khóa học Tiếng Trung";

    return (
        <div className="flex flex-col flex-1 pb-16 bg-transparent -m-4 sm:-m-6 lg:-m-8">
            <main className="max-w-5xl w-full mx-auto px-4 py-8 space-y-8 flex-1">
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
                                    Mỗi chương bao gồm các phần: video từ vựng, bài tập từ vựng, video ngữ pháp, bài tập ngữ pháp, nghe chép chính tả, thực hành hội thoại, bài tập bổ sung.
                                </p>
                            </div>
                        </Card>

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50/50 dark:bg-amber-950/10 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 shadow-3xs">
                            <div className="w-full md:w-1/2 space-y-2">
                                <div className="flex justify-between text-xs font-black text-amber-700 dark:text-amber-400">
                                    <span>Tiến độ học tập</span>
                                    <span>40%</span>
                                </div>
                                <Progress value={40} className="h-2.5 bg-amber-100 dark:bg-amber-950 [&>div]:bg-amber-500" />
                            </div>
                            <Button
                                onClick={() => {
                                    const firstLesson = chapters.flatMap((c) => c.lessons || [])[0];
                                    if (firstLesson) handleSubtopicClick(firstLesson.id);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-5 rounded-2xl text-sm shadow-xs transition-colors cursor-pointer active:scale-95 shadow-amber-500/10 flex items-center gap-2"
                            >
                                Học tiếp <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {chapters.map((chapter: CourseChapter) => {
                                const chapterId = chapter.id;
                                const isExpanded = !!expandedLessons[chapterId];
                                const lessonsList = chapter.lessons || [];
                                return (
                                    <Card
                                        key={chapterId}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl border-zinc-200/60 dark:border-zinc-800 shadow-2xs overflow-hidden"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleLesson(chapterId)}
                                            className="w-full flex items-center justify-between p-5 font-black text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-left cursor-pointer border-none bg-transparent"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-[15px]">{chapter.title}</span>
                                                {chapter.tag && (
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 px-2">
                                                        {chapter.tag}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-zinc-400 dark:text-zinc-500">
                                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                                                {lessonsList.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                        {lessonsList.map((sub: CourseLesson) => (
                                                            <Button
                                                                key={sub.id}
                                                                variant="outline"
                                                                onClick={() => handleLessonClick(sub)}
                                                                className="flex justify-between p-3.5 h-auto text-zinc-800 dark:text-zinc-200 hover:text-amber-900 dark:hover:text-amber-400 font-bold rounded-2xl border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 cursor-pointer w-full text-left"
                                                            >
                                                                <span className="text-xs">{sub.title}</span>
                                                                <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-zinc-400 dark:text-zinc-500 italic font-semibold">
                                                        Bài học chưa được mở khóa hoặc đang cập nhật nội dung.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                )}

                {activeTab === "info" && (
                    <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450 space-y-4 shadow-2xs">
                        <h3 className="font-black text-zinc-900 dark:text-white text-lg">Mô tả chi tiết khóa học</h3>
                        <p className="text-sm leading-relaxed font-semibold">
                            {course?.description || "Đang cập nhật mô tả khóa học..."}
                        </p>
                    </section>
                )}
            </main>
        </div>
    );
}
