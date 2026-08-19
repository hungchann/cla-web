export type CourseLessonType =
  | "video_vocab"
  | "quiz_vocab"
  | "vocab_theory"
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
  is_free_preview?: boolean;
}

export interface LessonVideo {
  id: string | number;
  lesson_id?: string | number;
  video_file?: string | { id: string; filename_disk?: string } | null;
  srt_file?: string | { id: string; filename_disk?: string } | null;
  video_cover?: string | { id: string; filename_disk?: string } | null;
  video_url?: string;
  srt_url?: string;
  status?: string;
}

export interface LessonTheory {
  id: string | number;
  lesson_id?: string | number;
  vocab_display_map_id?: string | null;
  title?: string;
  content?: string;
  image_id?: string | { id: string; filename_disk?: string } | null;
  image_url?: string;
  sort?: number;
  status?: string;
}

export interface LessonExtra {
  id: string | number;
  lesson_id?: string | number;
  extra_pdf_id?: string | { id: string; filename_disk?: string; title?: string } | null;
  extra_answer_id?: string | { id: string; filename_disk?: string; title?: string } | null;
  extra_audio_id?: string | { id: string; filename_disk?: string; title?: string } | null;
  extra_pdf_url?: string;
  extra_answer_url?: string;
  extra_audio_url?: string;
  status?: string;
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
  access_tier?: "free" | "registered" | "premium" | string;
  image?: string | { id: string; filename_disk?: string; title?: string };
  image_url?: string;
  chapters?: CourseChapter[];
}

export interface LessonVocab {
  id: string | number;
  lesson_id?: string | number;
  word: string;
  pinyin?: string;
  meaning?: string;
  time_start?: string;
  time_end?: string;
  sort?: number;
  status?: string;
}

export interface LessonQuestion {
  id: string | number;
  lesson_id?: string | number;
  question: string;
  answer_A?: string;
  answer_B?: string;
  answer_C?: string;
  answer_D?: string;
  correct_answer?: string;
  explanation?: string;
  audio_id?: string | { id: string; filename_disk?: string } | null;
  audio_url?: string;
  sort?: number;
  status?: string;
}

export interface LessonDictation {
  id: string | number;
  lesson_id?: string | number;
  audio_id?: string | { id: string; filename_disk?: string } | null;
  audio_url?: string;
  answer_text: string;
  sort?: number;
  status?: string;
}

export interface LessonDialogue {
  id: string | number;
  lesson_id?: string | number;
  chinese_text: string;
  pinyin?: string;
  vietnamese_text?: string;
  speaker?: string;
  order?: number;
  status?: string;
}

export interface Banner {
  id: string | number;
  image?: string | { id: string; filename_disk?: string } | null;
  image_url?: string;
  link?: string;
  sort?: number;
  status?: string;
}
