import apiInstance from "@/api/authConfig";
import { API_URL } from "@/lib/constants";
import { CourseChapter, CourseItem, CourseLesson, LessonVideo, LessonTheory, LessonExtra, LessonVocab, LessonQuestion, LessonDictation, LessonDialogue, Banner } from "@/lib/types/course";
import { logger } from "@/services/logger";

const LESSON_FIELDS_REST = "id,status,sort,title,title_trans,lesson_type,chapter_id,is_free_preview";

function escapeFilterString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, String.raw`\"`);
}

function buildCourseImageUrl(image: CourseItem["image"]): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return `${API_URL}/assets/${image}`;
  if (image.id) return `${API_URL}/assets/${image.id}`;
  return undefined;
}

/** Build asset URL từ field file (string id, object có filename_disk, hoặc array junction). */
function assetUrl(file: any): string | undefined {
  if (!file) return undefined;
  if (Array.isArray(file)) {
    const first = file[0];
    if (!first) return undefined;
    return assetUrl(first.directus_files_id || first);
  }
  if (typeof file === "string") return `${API_URL}/assets/${file}`;
  if (file.filename_disk) return `${API_URL}/assets/${file.filename_disk}`;
  if (file.id) return `${API_URL}/assets/${file.id}`;
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
      const r = await apiInstance.get(`/items/course?fields=id,status,sort,title,title_trans,description,level,script_type,duration,isBilingual,subtext,is_featured,access_tier,image.id,image.filename_disk&sort=sort&${qs}`);
      const items: CourseItem[] = r.data?.data || [];
      return items.map(normalizeCourse);
    } catch (error: any) {
      logger.warn("[Courses API] getCourses failed:", error?.response?.status || error?.message || error);
      return [];
    }
  },

  async getCourseById(id: string | number): Promise<CourseItem | null> {
    try {
      const r = await apiInstance.get(`/items/course/${id}?fields=id,status,sort,title,title_trans,description,level,script_type,duration,isBilingual,subtext,is_featured,access_tier,image.id,image.filename_disk`);
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

  async getLessonVocab(lessonId: string | number): Promise<LessonVocab[]> {
    const items = await fetchLessonItems(
      "lesson_vocab",
      lessonId,
      "id,word,pinyin,meaning,time_start,time_end,gif_id,sort,status",
      "sort",
    );
    return items.map((v: any) => ({
      ...v,
      gif_url: assetUrl(v.gif_id),
    }));
  },

  /** Nội dung video 1:1 của lesson (video_vocab / video_grammar). */
  async getLessonVideo(lessonId: string | number): Promise<LessonVideo | null> {
    const row = await fetchLessonSingle("lesson_video", lessonId, "id,video_file,video_file.filename_disk,srt_file,srt_file.filename_disk,video_cover,video_cover.filename_disk,status");
    if (!row) return null;
    return {
      ...row,
      video_url: assetUrl(row.video_file),
      srt_url: assetUrl(row.srt_file),
    };
  },

  /** Lý thuyết 1:1 của lesson (vocab_theory) — vocab_items M2M + notes + image. */
  async getLessonTheory(lessonId: string | number): Promise<LessonTheory | null> {
    const row = await fetchLessonSingle(
      "lesson_theory",
      lessonId,
      "id,title,notes,content,image_id,image_id.filename_disk,status,vocab_display_map_id,vocab_items.id,vocab_items.sort,vocab_items.vocab_items_id.id,vocab_items.vocab_items_id.name,vocab_items.vocab_items_id.pinyin,vocab_items.vocab_items_id.note,vocab_items.vocab_items_id.gif_id"
    );
    if (!row) return null;
    return {
      ...row,
      image_url: assetUrl(row.image_id),
    };
  },

  /** Bài tập bổ sung 1:1 của lesson (extra). */
  async getLessonExtra(lessonId: string | number): Promise<LessonExtra | null> {
    const row = await fetchLessonSingle(
      "lesson_extra",
      lessonId,
      "id,extra_pdf_id,extra_pdf_id.directus_files_id.id,extra_pdf_id.directus_files_id.filename_disk,extra_answer_id,extra_answer_id.directus_files_id.id,extra_answer_id.directus_files_id.filename_disk,extra_audio_id,extra_audio_id.directus_files_id.id,extra_audio_id.directus_files_id.filename_disk,status"
    );
    if (!row) return null;
    return {
      ...row,
      extra_pdf_url: assetUrl(row.extra_pdf_id),
      extra_answer_url: assetUrl(row.extra_answer_id),
      extra_audio_url: assetUrl(row.extra_audio_id),
    };
  },

  async getLessonQuestions(lessonId: string | number): Promise<LessonQuestion[]> {
    const items = await fetchLessonItems(
      "lesson_questions",
      lessonId,
      "id,question,answer_A,answer_B,answer_C,answer_D,correct_answer,explanation,audio_id,audio_id.filename_disk,sort,status",
      "sort"
    );
    return items.map((q: any) => {
      const audio = q.audio_id;
      return {
        ...q,
        audio_url: audio
          ? typeof audio === "string"
            ? `${API_URL}/assets/${audio}`
            : audio.filename_disk
            ? `${API_URL}/assets/${audio.filename_disk}`
            : audio.id
            ? `${API_URL}/assets/${audio.id}`
            : undefined
          : undefined,
      };
    });
  },

  async getLessonDictation(lessonId: string | number): Promise<LessonDictation[]> {
    const items = await fetchLessonItems(
      "lesson_dictation",
      lessonId,
      "id,audio_id,audio_id.filename_disk,answer_text,sort,status",
      "sort"
    );
    return items.map((d: any) => {
      const audio = d.audio_id;
      return {
        ...d,
        audio_url: audio
          ? typeof audio === "string"
            ? `${API_URL}/assets/${audio}`
            : audio.filename_disk
            ? `${API_URL}/assets/${audio.filename_disk}`
            : audio.id
            ? `${API_URL}/assets/${audio.id}`
            : undefined
          : undefined,
      };
    });
  },

  async getLessonDialogues(lessonId: string | number): Promise<LessonDialogue[]> {
    return fetchLessonItems(
      "lesson_dialogues",
      lessonId,
      "id,chinese_text,pinyin,vietnamese_text,speaker,order,status",
      "order"
    );
  },

  async getBanners(): Promise<Banner[]> {
    try {
      const r = await apiInstance.get(`/items/banners?filter[status][_eq]=published&sort=sort&fields=id,image,image.filename_disk,link,sort,status`);
      const items: any[] = r.data?.data || [];
      return items.map((b) => {
        const img = b.image;
        return {
          ...b,
          image_url: img
            ? typeof img === "string"
              ? `${API_URL}/assets/${img}`
              : img.filename_disk
              ? `${API_URL}/assets/${img.filename_disk}`
              : img.id
              ? `${API_URL}/assets/${img.id}`
              : undefined
            : undefined,
        };
      });
    } catch (error: any) {
      logger.warn("[Courses API] getBanners failed:", error?.response?.status || error);
      return [];
    }
  },
};

async function fetchLessonItems(collection: string, lessonId: string | number, fields: string, sort: string): Promise<any[]> {
  try {
    const r = await apiInstance.get(`/items/${collection}?filter[lesson_id][_eq]=${lessonId}&filter[status][_eq]=published&sort=${sort}&fields=${fields}`);
    return r.data?.data || [];
  } catch (error: any) {
    logger.warn(`[Courses API] fetchLessonItems(${collection}, ${lessonId}) failed:`, error?.response?.status || error);
    return [];
  }
}

/** Lấy 1 dòng con 1:1 theo lesson_id (lesson_video / lesson_theory / lesson_extra). */
async function fetchLessonSingle(collection: string, lessonId: string | number, fields: string): Promise<any | null> {
  try {
    const r = await apiInstance.get(`/items/${collection}?filter[lesson_id][_eq]=${lessonId}&filter[status][_eq]=published&limit=1&fields=${fields}`);
    return r.data?.data?.[0] || null;
  } catch (error: any) {
    logger.warn(`[Courses API] fetchLessonSingle(${collection}, ${lessonId}) failed:`, error?.response?.status || error);
    return null;
  }
}
