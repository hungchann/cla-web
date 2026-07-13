export interface StoryChapterContent {
  zn: string;
  vi: string;
}

export interface StoryChapter {
  id: string;
  title: string;
  book_content: StoryChapterContent[];
  sort_id: string;
  image_cover?: string | { filename_disk: string };
}

export interface StoryBook {
  id: string;
  view_count: string | number;
  chapters_id: StoryChapter[];
  image?: {
    filename_disk: string;
  };
}

export interface StoryBookDetail extends StoryBook {
  title: string;
  title_trans: string;
  author: string;
  author_trans: string | null;
  summary: string;
  genre_id: {
    book_genre_id: {
      id: string;
      title: string;
    };
  }[];
}
