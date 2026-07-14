"use client";

import Image from "next/image";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const syllabusLessons = [
  {
    num: 1,
    title: "Bài 1: Phát âm - Chào hỏi cơ bản (1)",
    subtopics: [
      { name: "Video từ vựng", id: "learn-video-vocab" },
      { name: "Bài tập: từ vựng", id: "learn-quiz-vocab" },
      { name: "Video ngữ pháp", id: "learn-video-grammar" },
      { name: "Bài tập ngữ pháp", id: "learn-quiz-grammar" },
      { name: "Bài tập: Nghe chép chính tả", id: "learn-dictation" },
      { name: "Thực hành hội thoại", id: "learn-conversation" },
      { name: "Bài tập bổ sung", id: "learn-extra" },
    ],
  },
  { num: 2, title: "Bài 2: Phát âm - Chào hỏi cơ bản (2)", subtopics: [] },
  { num: 3, title: "Bài 3: Phát âm - Giới thiệu bản thân (3)", subtopics: [] },
  { num: 4, title: "Bài 4: Giới thiệu tuổi tác", tag: "Học thử miễn phí", subtopics: [] },
];

export default function CourseDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "syllabus" | "reviews">("syllabus");
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({
    1: true,
  });

  const toggleLesson = (num: number) => {
    setExpandedLessons((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const handleSubtopicClick = (subtopicId: string) => {
    router.push(`/courses/${id}/learn?step=${subtopicId}`);
  };

  let courseTitle = "Khóa giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)";
  if (id === "office-chinese") {
    courseTitle = "Khóa giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)";
  } else if (id === "marketing-traditional") {
    courseTitle = "Tiếng Trung Marketing (Phồn thể)";
  }

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
            <ul className="space-y-3 pl-5 list-disc text-sm md:text-base text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
              <li>Dành cho người mới bắt đầu học Tiếng Trung hoặc học nhưng bị mất gốc</li>
              <li>
                Muốn học giao tiếp Tiếng Trung để đi du lịch, công tác nhưng không có nhiều thời
                gian lên lớp học
              </li>
              <li>Học các chủ điểm giao tiếp từ con số 0</li>
            </ul>
          </div>
          <div className="relative w-full md:w-80 h-52 md:h-auto bg-zinc-50 dark:bg-zinc-900 shrink-0 border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-800">
            <Image
              src="/images/study_tablet.png"
              alt="Syllabus Study Desk"
              fill
              className="object-cover"
            />
          </div>
        </Card>

        {/* Tabs */}
        <section className="border-b border-zinc-200 dark:border-zinc-800 flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("info")}
            className={`rounded-none border-b-2 font-extrabold px-1 pb-3 pt-0 h-auto hover:bg-transparent ${
              activeTab === "info"
                ? "border-amber-500 text-amber-600 dark:text-amber-500"
                : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
            }`}
          >
            Thông tin khóa học
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("syllabus")}
            className={`rounded-none border-b-2 font-extrabold px-1 pb-3 pt-0 h-auto hover:bg-transparent ${
              activeTab === "syllabus"
                ? "border-amber-500 text-amber-600 dark:text-amber-500"
                : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
            }`}
          >
            Nội dung bài học
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("reviews")}
            className={`rounded-none border-b-2 font-extrabold px-1 pb-3 pt-0 h-auto hover:bg-transparent ${
              activeTab === "reviews"
                ? "border-amber-500 text-amber-600 dark:text-amber-500"
                : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
            }`}
          >
            Đánh giá của học viên
          </Button>
        </section>

        {/* Tab content */}
        {activeTab === "syllabus" && (
          <section className="space-y-8">
            <Card className="bg-white dark:bg-zinc-900 rounded-2xl border-zinc-200/60 dark:border-zinc-800 p-6 flex flex-col md:flex-row gap-6 shadow-2xs">
              <div className="relative w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/images/student_cafe.png"
                  alt="Student studying in Cafe"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-black text-zinc-900 dark:text-white text-lg">Nội dung bài học</h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm md:text-base leading-relaxed font-semibold">
                  Khóa học hướng đến đối tượng người Việt mới bắt đầu học tiếng Trung.
                  <br />
                  Gồm 15 bài học chính thức.
                  <br />
                  Mỗi bài học bao gồm 7 phần: video giải thích từ vựng, bài tập từ vựng, video ngữ
                  pháp, bài tập ngữ pháp, bài tập nghe chép chính tả, thực hành hội thoại, bài tập bổ
                  sung.
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
                onClick={() => handleSubtopicClick("learn-video-vocab")}
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-5 rounded-2xl text-sm shadow-xs transition-colors cursor-pointer active:scale-95 shadow-amber-500/10 flex items-center gap-2"
              >
                Học tiếp <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {syllabusLessons.map((lesson) => {
                const isExpanded = !!expandedLessons[lesson.num];
                return (
                  <Card
                    key={lesson.num}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border-zinc-200/60 dark:border-zinc-800 shadow-2xs overflow-hidden"
                  >
                    <button
                      onClick={() => toggleLesson(lesson.num)}
                      className="w-full flex items-center justify-between p-5 font-black text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-left cursor-pointer border-none bg-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[15px]">{lesson.title}</span>
                        {lesson.tag && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 px-2">
                            {lesson.tag}
                          </Badge>
                        )}
                      </div>
                      <div className="text-zinc-400 dark:text-zinc-500">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                        {lesson.subtopics.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {lesson.subtopics.map((sub) => (
                              <Button
                                key={sub.id}
                                variant="outline"
                                onClick={() => handleSubtopicClick(sub.id)}
                                className="flex justify-between p-3.5 h-auto text-zinc-800 dark:text-zinc-200 hover:text-amber-900 dark:hover:text-amber-400 font-bold rounded-2xl border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 cursor-pointer w-full text-left"
                              >
                                <span className="text-xs">{sub.name}</span>
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
              Đây là khóa học đàm thoại toàn diện được thiết kế đặc biệt cho người Việt Nam học
              tiếng Trung từ cơ bản. Các nội dung bám sát thực tế cuộc sống, công sở và đi lại.
            </p>
          </section>
        )}

        {activeTab === "reviews" && (
          <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200/60 dark:border-zinc-800 space-y-4 shadow-2xs">
            <h3 className="font-black text-zinc-900 dark:text-white text-lg">Đánh giá tiêu biểu</h3>
            <div className="border-l-4 border-amber-500 pl-4 space-y-1">
              <p className="text-sm italic text-zinc-650 dark:text-zinc-350 font-semibold leading-relaxed">
                &quot;Khóa học rất thực tế, bài học từ vựng có video ngắn rất dễ nhớ. Phần luyện nói
                chấm điểm pinyin cực kỳ hay!&quot;
              </p>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">- Nguyễn Văn A (Học viên)</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
