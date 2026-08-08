export type CourseLessonType =
  | "video_vocab"
  | "quiz_vocab"
  | "video_grammar"
  | "quiz_grammar"
  | "dictation"
  | "conversation"
  | "extra"
  | string;

export interface CourseLesson {
  id: string | number;
  chapter_id?: string | number;
  title: string;
  title_trans?: string;
  lesson_type: CourseLessonType;
  status?: string;
  sort?: number;
  content?: string;
  resource_id?: string | number | null;
  resource_collection?: string | null;
  video_section_id?: string | null;
  exercise_id?: number | string | null;
  audio_id?: string | null;
  scenario_id?: number | string | null;
  extra_pdf_id?: string | null;
  extra_answer_id?: string | null;
  extra_audio_id?: string | null;
  extra_pdf?: { id: string; filename_disk?: string; title?: string } | null;
  extra_answer?: { id: string; filename_disk?: string; title?: string } | null;
  extra_audio?: { id: string; filename_disk?: string; title?: string } | null;
  video_url?: string;
}

export interface CourseChapter {
  id: string | number;
  course_id?: string | number;
  title: string;
  title_trans?: string;
  tag?: string;
  status?: string;
  sort?: number;
  description?: string;
  lessons?: CourseLesson[];
}

export interface CourseItem {
  id: string | number;
  title: string;
  title_trans?: string;
  description?: string;
  level?: string;
  script_type?: "simplified" | "traditional" | string;
  duration?: string;
  status?: string;
  sort?: number;
  is_featured?: boolean;
  isBilingual?: boolean;
  subtext?: string;
  image?: string | { id: string; filename_disk?: string; title?: string };
  image_url?: string;
  chapters?: CourseChapter[];
}
