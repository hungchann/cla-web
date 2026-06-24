import { ASSET_URL } from "../constants";
import { Author, VideoItem } from "../types/video";

export const videoMapper = {
  getYoutubeVideoId(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.slice(1);
      }
      return parsed.searchParams.get("v");
    } catch {
      return null;
    }
  },

  getThumbnail(video: any): string {
    if (video.Video_Source === "Youtube" && video.YouTube_URL) {
      const videoId = this.getYoutubeVideoId(video.YouTube_URL);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    if (video.image_cover?.filename_disk) {
      return `${ASSET_URL}/${video.image_cover.filename_disk}`;
    }

    return "https://img.youtube.com/vi/default/hqdefault.jpg";
  },

  toVideoItem(raw: any): VideoItem {
    const author: Author = {
      name: raw.author_id?.name?.trim() || "Khác",
      avatar: raw.author_id?.avatar?.filename_disk
        ? `${ASSET_URL}/${raw.author_id.avatar.filename_disk}`
        : undefined,
    };

    return {
      id: raw.id,
      title: raw.title || "",
      titleTrans: raw.title_trans || "",
      thumbnail: this.getThumbnail(raw),
      author,
      date: raw.date_created || raw.date || "",
      genre: raw.genre_id
        ? {
            id: raw.genre_id.id,
            title: raw.genre_id.title,
          }
        : undefined,
      source: raw.Video_Source === "Youtube" ? "Youtube" : "Server",
      videoUrl: raw.YouTube_URL,
      raw: raw,
    };
  },

  toVideoItems(rawList: any[]): VideoItem[] {
    return (rawList || []).map((item) => this.toVideoItem(item));
  },
};
