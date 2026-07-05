"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

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
    id: "bilingual-pressure",
    title: "Đối mặt với áp lực đồng trang lứa",
    subtext: "面对同辈压力",
    duration: "10/5/2026",
    isBilingual: true,
  },
  {
    id: "office-chinese-4",
    level: "Sơ cấp",
    title: "Giao tiếp Tiếng Trung công sở cho người mới bắt đầu (Giản thể)",
    duration: "2 - 3 tháng",
  },
  {
    id: "marketing-traditional-3",
    level: "Trung cấp",
    title: "Tiếng Trung Marketing (Phồn thể)",
    duration: "2 - 3 tháng",
  },
];

export default function CoursesPage() {
  const view = "courses";
  const router = useRouter();

  const handleCourseClick = (courseId: string) => {
    // Navigate to dynamic course detail page
    router.push(`/courses/${courseId}`);
  };

  const handleSetView = (newView: string) => {
    if (newView === "home") {
      router.push("/dashboard");
    } else if (newView === "courses") {
      router.push("/courses");
    } else if (newView === "bilingual-list") {
      router.push("/bilingual");
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white text-gray-800 flex-1 -m-4 sm:-m-6 lg:-m-8">
      <Sidebar view={view} setView={handleSetView} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 md:p-8 space-y-12 max-w-6xl w-full mx-auto">
          <section className="space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">🇨🇳</span> Giản thể (Trung Quốc đại lục)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {simplifiedCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col text-left cursor-pointer w-full"
                >
                  <div className="relative h-44 w-full bg-gray-100">
                    <Image
                      src="/images/study_tablet.png"
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-md font-bold text-white shadow-xs bg-amber-500">
                      {course.level}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-200 text-[15px] leading-snug">
                      {course.title}
                    </h3>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-2 border-t border-gray-50">
                      <span>⏱️</span> {course.duration}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-6 pb-12">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="text-amber-500">🇹🇼</span> Phồn thể (Đài Loan, Hong Kong, Macao)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {traditionalCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col text-left cursor-pointer w-full"
                >
                  <div className="relative h-44 w-full bg-gray-100">
                    <Image
                      src="/images/study_tablet.png"
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {course.level && (
                      <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-md font-bold text-white shadow-xs bg-amber-500">
                        {course.level}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {course.isBilingual && (
                        <h4 className="text-amber-700 font-bold text-xs mb-1">
                          {course.subtext}
                        </h4>
                      )}
                      <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-200 text-[15px] leading-snug">
                        {course.title}
                      </h3>
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-2 border-t border-gray-50">
                      {course.isBilingual ? <span>📅</span> : <span>⏱️</span>} {course.duration}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
