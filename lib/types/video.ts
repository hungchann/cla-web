export interface VideoGenre {
  id: string;
  title: string;
}
export interface Author {
  id?: string;
  name: string;
  avatar?:
    | string
    | {
        id: string;
        filename_disk?: string;
      };
}

export interface VideoItem {
  id: string;
  title: string;
  titleTrans: string;
  thumbnail: string;
  author: Author;
  date: string;
  genre?: {
    id: string;
    title: string;
  };
  source: "Youtube" | "Server";
  videoUrl?: string;
  raw: any; // Keep raw data for detail screens if needed
}

export interface AuthorSection {
  authorName: string;
  avatar: string | null;
  videos: VideoItem[];
}

export interface VideosByGenre {
  genreId: string;
  genreTitle: string;
  videos: VideoItem[];
}

export interface SegmentedWord {
  word: string;
  pinyin?: string;
}

export interface SubtitleSegment {
  index: number;
  start: string | number;
  end: string | number;
  chinese: string;
  vietnamese: string;
  pinyin?: string;
  segmentedWords?: SegmentedWord[];
}

export interface VideoData {
  id: string | number;
  title: string;
  title_trans: string;
  author?: string | Author;
  author_id?: Author;
  date_created: string;
  Video_Source: "Youtube" | "Local";
  YouTube_URL?: string;
  video_file?: {
    filename_disk: string;
  };
  srt_file?: {
    filename_disk: string;
  };
  SubRip_Subtitle?: {
    filename_disk: string;
  };
}
