"use client";

import Image from "next/image";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col flex-1 pb-16 bg-[#fafafa] -m-4 sm:-m-6 lg:-m-8">
      <main className="max-w-5xl w-full mx-auto px-4 py-8 space-y-8 flex-1">
        {/* Info Banner */}
        <section className="bg-white rounded-2xl border-2 border-[#f59e0b] overflow-hidden flex flex-col md:flex-row shadow-xs">
          <div className="p-6 md:p-8 flex-1 space-y-4">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">
              {courseTitle}
            </h1>
            <ul className="space-y-3.5 pl-5 list-disc text-sm md:text-base text-gray-700 font-medium">
              <li>Dành cho người mới bắt đầu học Tiếng Trung hoặc học nhưng bị mất gốc</li>
              <li>
                Muốn học giao tiếp Tiếng Trung để đi du lịch, công tác nhưng không có nhiều thời
                gian lên lớp học
              </li>
              <li>Học các chủ điểm giao tiếp từ con số 0</li>
            </ul>
          </div>
          <div className="relative w-full md:w-80 h-52 md:h-auto bg-gray-50 shrink-0 border-t md:border-t-0 md:border-l border-gray-100">
            <Image
              src="/images/study_tablet.png"
              alt="Syllabus Study Desk"
              fill
              className="object-cover"
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-gray-200">
          <div className="flex gap-8 text-sm md:text-base font-bold">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 px-1 transition-colors cursor-pointer ${
                activeTab === "info"
                  ? "border-b-3 border-[#f59e0b] text-[#f59e0b]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Thông tin khóa học
            </button>
            <button
              onClick={() => setActiveTab("syllabus")}
              className={`pb-3 px-1 transition-colors cursor-pointer ${
                activeTab === "syllabus"
                  ? "border-b-3 border-[#f59e0b] text-[#f59e0b]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Nội dung bài học
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 px-1 transition-colors cursor-pointer ${
                activeTab === "reviews"
                  ? "border-b-3 border-[#f59e0b] text-[#f59e0b]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Đánh giá của học viên
            </button>
          </div>
        </section>

        {/* Tab content */}
        {activeTab === "syllabus" && (
          <section className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row gap-6 shadow-xs">
              <div className="relative w-full md:w-56 h-36 rounded-lg overflow-hidden shrink-0">
                <Image
                  src="/images/student_cafe.png"
                  alt="Student studying in Cafe"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-extrabold text-gray-900 text-lg">Nội dung bài học</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
                  Khóa học hướng đến đối tượng người Việt mới bắt đầu học tiếng Trung.
                  <br />
                  Gồm 15 bài học chính thức.
                  <br />
                  Mỗi bài học bao gồm 7 phần: video giải thích từ vựng, bài tập từ vựng, video ngữ
                  pháp, bài tập ngữ pháp, bài tập nghe chép chính tả, thực hành hội thoại, bài tập bổ
                  sung.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
              <div className="w-full md:w-1/2 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-amber-800">
                  <span>Tiến độ học tập</span>
                  <span>40%</span>
                </div>
                <div className="w-full bg-amber-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f59e0b] h-full rounded-full" style={{ width: "40%" }} />
                </div>
              </div>
              <button
                onClick={() => handleSubtopicClick("learn-video-vocab")}
                className="bg-[#f59e0b] text-white hover:bg-amber-600 font-bold px-6 py-2.5 rounded-full text-sm shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                Học tiếp =&gt;
              </button>
            </div>

            <div className="space-y-4">
              {syllabusLessons.map((lesson) => {
                const isExpanded = !!expandedLessons[lesson.num];
                return (
                  <div
                    key={lesson.num}
                    className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden"
                  >
                    <button
                      onClick={() => toggleLesson(lesson.num)}
                      className="w-full flex items-center justify-between p-4.5 font-extrabold text-gray-900 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[15px]">{lesson.title}</span>
                        {lesson.tag && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                            {lesson.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 font-mono text-lg">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-gray-50 space-y-2">
                        {lesson.subtopics.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {lesson.subtopics.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => handleSubtopicClick(sub.id)}
                                className="flex items-center justify-between p-3.5 bg-[#fff8e6] hover:bg-[#ffe082] text-gray-900 hover:text-amber-950 font-bold rounded-lg transition-all duration-200 border border-amber-100 cursor-pointer text-left w-full"
                              >
                                <span className="text-xs">{sub.name}</span>
                                <span className="text-amber-600 text-xs font-mono">&rarr;</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            Bài học chưa được mở khóa hoặc đang cập nhật nội dung.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "info" && (
          <section className="bg-white rounded-xl p-8 border border-gray-100 text-gray-600 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-lg">Mô tả chi tiết khóa học</h3>
            <p className="text-sm leading-relaxed">
              Đây là khóa học đàm thoại toàn diện được thiết kế đặc biệt cho người Việt Nam học
              tiếng Trung từ cơ bản. Các nội dung bám sát thực tế cuộc sống, công sở và đi lại.
            </p>
          </section>
        )}

        {activeTab === "reviews" && (
          <section className="bg-white rounded-xl p-8 border border-gray-100 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-lg">Đánh giá tiêu biểu</h3>
            <div className="border-l-4 border-amber-400 pl-4 space-y-1">
              <p className="text-sm italic text-gray-600">
                &quot;Khóa học rất thực tế, bài học từ vựng có video ngắn rất dễ nhớ. Phần luyện nói
                chấm điểm pinyin cực kỳ hay!&quot;
              </p>
              <span className="text-xs text-gray-400 font-bold">- Nguyễn Văn A (Học viên)</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
