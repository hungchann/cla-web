"use client";

import { Globe2, Map, Clock, Calendar, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const featuredCourses = [
  {
    id: "living-chinese",
    level: "Sơ cấp",
    title: "Giao tiếp Tiếng Trung đời sống cho người mới bắt đầu (Giản thể)",
    duration: "2 - 3 tháng",
  },
  {
    id: "office-chinese",
    level: "Sơ cấp",
    title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
    duration: "2 - 3 tháng",
  },
  {
    id: "marketing-traditional",
    level: "Trung cấp",
    title: "Tiếng Trung Marketing (Phồn thể)",
    duration: "2 - 3 tháng",
  },
];

const simplifiedCourses = [
  ...featuredCourses,
  {
    id: "office-chinese-2",
    level: "Sơ cấp",
    title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
    duration: "3 - 4 tháng",
  },
  {
    id: "office-chinese-3",
    level: "Sơ cấp",
    title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
    duration: "2 - 3 tháng",
  },
  {
    id: "marketing-traditional-2",
    level: "Trung cấp",
    title: "Tiếng Trung Marketing (Phồn thể)",
    duration: "2 - 3 tháng",
  },
];

const traditionalCourses = [
  {
    id: "marketing-traditional",
    level: "Trung cấp",
    title: "Tiếng Trung Marketing (Phồn thể)",
    duration: "2 - 3 tháng",
  },
  {
    id: "bilingual-pressure",
    title: "Đọc Song Ngữ: Đối Mặt Áp Lực Đồng Trang Lứa",
    duration: "Luyện đọc, Dịch nói HSK",
    subtext: "Học Qua Đọc Hiểu",
    isBilingual: true,
  },
  {
    id: "marketing-traditional-3",
    level: "Trung cấp",
    title: "Tiếng Trung Marketing (Phồn thể)",
    duration: "2 - 3 tháng",
  },
];

export default function CoursesPage() {
  const router = useRouter();

  const handleCourseClick = (courseId: string) => {
    if (courseId === "bilingual-pressure") {
      router.push("/bilingual/bilingual-pressure");
      return;
    }
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="flex-1 flex flex-col gap-8">
      <PageHeader
        title="Khóa Học Tiếng Trung"
        description="Hệ thống khóa học bài bản từ Giản thể đến Phồn thể. Chọn khóa học phù hợp với mục tiêu của bạn."
        icon={<GraduationCap className="w-7 h-7" />}
      />
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <Globe2 className="text-amber-500 w-6 h-6" /> Giản thể (Trung Quốc đại lục)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {simplifiedCourses.map((course) => (
            <Card
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="group relative flex flex-col justify-between overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-350 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-900 text-left cursor-pointer w-full hover:-translate-y-1"
            >
              <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/images/study_tablet.png"
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-3 left-3 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 border-none px-3 py-0.5 text-[10px] uppercase tracking-wider shadow-sm">
                  {course.level}
                </Badge>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors duration-200 text-base leading-snug tracking-tight">
                  {course.title}
                </h3>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Clock className="w-4 h-4 text-zinc-400" /> {course.duration}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6 pb-6">
        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <Map className="text-amber-500 w-6 h-6" /> Phồn thể (Đài Loan, Hong Kong, Macao)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {traditionalCourses.map((course) => (
            <Card
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="group relative flex flex-col justify-between overflow-hidden border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-350 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-900 text-left cursor-pointer w-full hover:-translate-y-1"
            >
              <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/images/study_tablet.png"
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {course.level && (
                  <Badge className="absolute top-3 left-3 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 border-none px-3 py-0.5 text-[10px] uppercase tracking-wider shadow-sm">
                    {course.level}
                  </Badge>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {course.isBilingual && (
                    <h4 className="text-amber-700 dark:text-amber-500 font-bold text-xs mb-1">
                      {course.subtext}
                    </h4>
                  )}
                  <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors duration-200 text-base leading-snug tracking-tight">
                    {course.title}
                  </h3>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  {course.isBilingual ? <Calendar className="w-4 h-4 text-zinc-400" /> : <Clock className="w-4 h-4 text-zinc-400" />} {course.duration}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
