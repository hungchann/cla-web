import { describe, it, expect } from "vitest";
import { videoMapper } from "@/lib/mappers/videoMapper";

describe("videoMapper.getYoutubeVideoId", () => {
  it("extracts ID from youtu.be URL", () => {
    expect(videoMapper.getYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from watch?v= URL", () => {
    expect(videoMapper.getYoutubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("returns null for invalid URL", () => {
    expect(videoMapper.getYoutubeVideoId("not-a-url")).toBeNull();
    expect(videoMapper.getYoutubeVideoId(null)).toBeNull();
    expect(videoMapper.getYoutubeVideoId(undefined)).toBeNull();
    expect(videoMapper.getYoutubeVideoId("")).toBeNull();
  });
});

describe("videoMapper.getThumbnail", () => {
  it("returns YouTube thumbnail for Youtube source", () => {
    const video = { Video_Source: "Youtube", YouTube_URL: "https://youtu.be/dQw4w9WgXcQ" };
    expect(videoMapper.getThumbnail(video)).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });

  it("returns asset URL when image_cover exists", () => {
    const video = { Video_Source: "Server", image_cover: { filename_disk: "img-1.jpg" } };
    expect(videoMapper.getThumbnail(video)).toBe("https://marutek.space/assets/img-1.jpg");
  });

  it("returns default thumbnail when nothing available", () => {
    expect(videoMapper.getThumbnail({})).toBe("https://img.youtube.com/vi/default/hqdefault.jpg");
  });
});

describe("videoMapper.toVideoItem", () => {
  it("maps a raw video to VideoItem", () => {
    const item = videoMapper.toVideoItem({
      id: "v-1",
      title: "Bài 1",
      title_trans: "Bài 1",
      Video_Source: "Youtube",
      YouTube_URL: "https://youtu.be/dQw4w9WgXcQ",
      date_created: "2024-01-01",
      author_id: { name: "  Cô Lan  ", avatar: { filename_disk: "avatar.jpg" } },
      genre_id: { id: "g-1", title: "Đời sống" },
    });

    expect(item.id).toBe("v-1");
    expect(item.title).toBe("Bài 1");
    expect(item.source).toBe("Youtube");
    expect(item.author.name).toBe("Cô Lan"); // trim
    expect(item.author.avatar).toBe("https://marutek.space/assets/avatar.jpg");
    expect(item.genre).toEqual({ id: "g-1", title: "Đời sống" });
  });

  it("uses default author name when missing", () => {
    const item = videoMapper.toVideoItem({ id: "v-1", Video_Source: "Server" });
    expect(item.author.name).toBe("Khác");
    expect(item.author.avatar).toBeUndefined();
    expect(item.source).toBe("Server");
  });

  it("handles missing title/date with empty string", () => {
    const item = videoMapper.toVideoItem({ id: "v-1", Video_Source: "Server" });
    expect(item.title).toBe("");
    expect(item.date).toBe("");
  });

  it("toVideoItems handles empty list", () => {
    expect(videoMapper.toVideoItems([])).toEqual([]);
    expect(videoMapper.toVideoItems(null as unknown as unknown[])).toEqual([]);
  });
});
