import apiInstance from "@/api/authConfig";
import { API_URL } from "@/lib/constants";
import { CourseChapter, CourseItem, CourseLesson } from "@/lib/types/course";
import { logger } from "@/services/logger";

const LESSON_FIELDS_REST = "id,status,sort,title,title_trans,lesson_type,content,video_section_id,exercise_id,audio_id,audio.id,audio.filename_disk,scenario_id,extra_pdf_id,extra_answer_id,extra_audio_id,extra_pdf.id,extra_pdf.filename_disk,extra_answer.id,extra_answer.filename_disk,extra_audio.id,extra_audio.filename_disk,chapter_id";

function escapeFilterString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, String.raw`\"`);
}

function buildCourseImageUrl(image: CourseItem["image"]): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return `${API_URL}/assets/${image}`;
  if (image.id) return `${API_URL}/assets/${image.id}`;
  return undefined;
}

function normalizeCourse(raw: any): CourseItem {
  if (!raw) return raw;
  const imageUrl = buildCourseImageUrl(raw.image);
  return { ...raw, image_url: imageUrl ?? raw.image_url };
}

async function fetchChaptersByCourse(courseId: string | number): Promise<any[]> {
  try {
    const r = await apiInstance.get(`/items/course_chapters?filter[course_id][_eq]=${courseId}&filter[status][_eq]=published&sort=sort&fields=id,status,sort,title,title_trans,tag,description,course_id`);
    return r.data?.data || [];
  } catch (error: any) {
    logger.warn(`[Courses API] fetchChaptersByCourse(${courseId}) failed`, error?.response?.status || error);
    return [];
  }
}

async function fetchLessonsByChapterIds(chapterIds: (string | number)[]): Promise<CourseLesson[]> {
  if (chapterIds.length === 0) return [];
  try {
    const ids = chapterIds.map((id) => String(id)).join(",");
    const r = await apiInstance.get(`/items/course_lessons?filter[chapter_id][_in]=${ids}&filter[status][_eq]=published&sort=sort&fields=${LESSON_FIELDS_REST}`);
    return r.data?.data || [];
  } catch (error: any) {
    logger.warn("[Courses API] fetchLessonsByChapterIds failed", error?.response?.status || error);
    return [];
  }
}

export const coursesApi = {
  async getCourses(params?: { level?: string; script?: string }): Promise<CourseItem[]> {
    try {
      const filters: string[] = [];
      filters.push("filter[status][_eq]=published");
      if (params?.level) filters.push(`filter[level][_eq]=${encodeURIComponent(params.level)}`);
      if (params?.script) filters.push(`filter[script_type][_eq]=${encodeURIComponent(params.script)}`);
      const qs = filters.join("&");
      const r = await apiInstance.get(`/items/course?fields=id,status,sort,title,title_trans,description,level,script_type,duration,isBilingual,subtext,is_featured,image.id,image.filename_disk&sort=sort&${qs}`);
      const items: CourseItem[] = r.data?.data || [];
      return items.map(normalizeCourse);
    } catch (error: any) {
      logger.warn("[Courses API] getCourses failed:", error?.response?.status || error?.message || error);
      return [];
    }
  },

  async getCourseById(id: string | number): Promise<CourseItem | null> {
    try {
      const r = await apiInstance.get(`/items/course/${id}?fields=id,status,sort,title,title_trans,description,level,script_type,duration,isBilingual,subtext,is_featured,image.id,image.filename_disk`);
      const raw = r.data?.data;
      if (!raw) return null;
      const normalized = normalizeCourse(raw);

      const chapterRows = await fetchChaptersByCourse(id);
      if (chapterRows.length > 0) {
        const chapterIds = chapterRows.map((c: any) => c.id);
        const allLessons = await fetchLessonsByChapterIds(chapterIds);

        const lessonMap: Record<string, CourseLesson[]> = {};
        for (const l of allLessons) {
          const cid = String(l.chapter_id || "");
          if (!lessonMap[cid]) lessonMap[cid] = [];
          lessonMap[cid].push(l);
        }
        normalized.chapters = chapterRows.map((c: any) => ({
          id: c.id,
          course_id: c.course_id,
          status: c.status,
          sort: c.sort,
          title: c.title,
          title_trans: c.title_trans,
          tag: c.tag,
          description: c.description,
          lessons: lessonMap[String(c.id)] || [],
        }));
      } else {
        normalized.chapters = [];
      }
      return normalized;
    } catch (error: any) {
      logger.warn(`[Courses API] getCourseById(${id}) failed:`, error?.response?.status || error?.message || error);
      return null;
    }
  },

  async getCourseChapters(courseId: string | number): Promise<CourseChapter[]> {
    try {
      const chapterRows = await fetchChaptersByCourse(courseId);
      if (chapterRows.length === 0) return [];
      const chapterIds = chapterRows.map((c: any) => c.id);
      const allLessons = await fetchLessonsByChapterIds(chapterIds);
      const lessonMap: Record<string, CourseLesson[]> = {};
      for (const l of allLessons) {
        const cid = String(l.chapter_id || "");
        if (!lessonMap[cid]) lessonMap[cid] = [];
        lessonMap[cid].push(l);
      }
      return chapterRows.map((c: any) => ({
        id: c.id,
        course_id: c.course_id,
        status: c.status,
        sort: c.sort,
        title: c.title,
        title_trans: c.title_trans,
        tag: c.tag,
        description: c.description,
        lessons: lessonMap[String(c.id)] || [],
      }));
    } catch (error: any) {
      logger.warn(`[Courses API] getCourseChapters(${courseId}) failed:`, error?.response?.status || error?.message || error);
      return [];
    }
  },

  async getCourseLessonById(
    lessonId: string | number,
  ): Promise<CourseLesson | null> {
    try {
      const r = await apiInstance.get(`/items/course_lessons/${lessonId}?fields=${LESSON_FIELDS_REST}`);
      return r.data?.data || null;
    } catch (error: any) {
      logger.warn(`[Courses API] getCourseLessonById(${lessonId}) failed:`, error?.response?.status || error?.message || error);
      return null;
    }
  },
};
