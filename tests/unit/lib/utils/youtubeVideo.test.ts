import { describe, it, expect } from "vitest";
import {
  getYoutubeVideoIdFromUrl,
  getYoutubeVideoIdFromVideoData,
  readYoutubeUrlFromVideoData,
  readVideoSourceRaw,
  videoDataUsesYoutubePlayer,
} from "@/lib/utils/youtubeVideo";

describe("getYoutubeVideoIdFromUrl", () => {
  it("returns 11-char ID directly", () => {
    expect(getYoutubeVideoIdFromUrl("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from watch?v= URL", () => {
    expect(getYoutubeVideoIdFromUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtu.be URL", () => {
    expect(getYoutubeVideoIdFromUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from shorts URL", () => {
    expect(getYoutubeVideoIdFromUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from embed URL", () => {
    expect(getYoutubeVideoIdFromUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from live URL", () => {
    expect(getYoutubeVideoIdFromUrl("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("handles URL without scheme", () => {
    expect(getYoutubeVideoIdFromUrl("www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(getYoutubeVideoIdFromUrl("youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for malformed URLs", () => {
    expect(getYoutubeVideoIdFromUrl("not-a-url")).toBeNull();
    expect(getYoutubeVideoIdFromUrl("")).toBeNull();
    expect(getYoutubeVideoIdFromUrl(null)).toBeNull();
    expect(getYoutubeVideoIdFromUrl(undefined)).toBeNull();
  });

  it("returns null for invalid video ID format", () => {
    expect(getYoutubeVideoIdFromUrl("https://youtu.be/abc")).toBeNull();
  });
});

describe("readYoutubeUrlFromVideoData", () => {
  it("handles YouTube_URL field name", () => {
    expect(readYoutubeUrlFromVideoData({ YouTube_URL: "https://youtu.be/dQw4w9WgXcQ" })).toBe(
      "https://youtu.be/dQw4w9WgXcQ",
    );
  });

  it("handles youtube_url field name", () => {
    expect(readYoutubeUrlFromVideoData({ youtube_url: "https://youtu.be/dQw4w9WgXcQ" })).toBe(
      "https://youtu.be/dQw4w9WgXcQ",
    );
  });

  it("handles video_url field name", () => {
    expect(readYoutubeUrlFromVideoData({ video_url: "https://youtu.be/dQw4w9WgXcQ" })).toBe(
      "https://youtu.be/dQw4w9WgXcQ",
    );
  });

  it("returns null when no URL field present", () => {
    expect(readYoutubeUrlFromVideoData({ title: "x" })).toBeNull();
    expect(readYoutubeUrlFromVideoData(null)).toBeNull();
    expect(readYoutubeUrlFromVideoData(undefined)).toBeNull();
  });

  it("returns null for empty string URL", () => {
    expect(readYoutubeUrlFromVideoData({ YouTube_URL: "   " })).toBeNull();
  });
});

describe("readVideoSourceRaw", () => {
  it("handles Video_Source field name", () => {
    expect(readVideoSourceRaw({ Video_Source: "youtube" })).toBe("youtube");
  });

  it("handles video_source field name", () => {
    expect(readVideoSourceRaw({ video_source: "local" })).toBe("local");
  });

  it("returns empty string when missing", () => {
    expect(readVideoSourceRaw({})).toBe("");
    expect(readVideoSourceRaw(null)).toBe("");
  });
});

describe("videoDataUsesYoutubePlayer", () => {
  it("returns true when source is youtube", () => {
    expect(videoDataUsesYoutubePlayer({ Video_Source: "youtube" })).toBe(true);
  });

  it("returns true when source is youtu.be", () => {
    expect(videoDataUsesYoutubePlayer({ Video_Source: "youtu.be" })).toBe(true);
  });

  it("returns false when source is local", () => {
    expect(videoDataUsesYoutubePlayer({ Video_Source: "local" })).toBe(false);
  });

  it("returns false when local video file exists even with URL", () => {
    expect(
      videoDataUsesYoutubePlayer({
        YouTube_URL: "https://youtu.be/dQw4w9WgXcQ",
        video_file: { filename_disk: "local.mp4" },
      }),
    ).toBe(false);
  });

  it("returns true when URL present and no local file", () => {
    expect(
      videoDataUsesYoutubePlayer({ YouTube_URL: "https://youtu.be/dQw4w9WgXcQ" }),
    ).toBe(true);
  });

  it("returns false for null/empty data", () => {
    expect(videoDataUsesYoutubePlayer(null)).toBe(false);
    expect(videoDataUsesYoutubePlayer({})).toBe(false);
  });
});

describe("getYoutubeVideoIdFromVideoData", () => {
  it("extracts ID from video data", () => {
    expect(
      getYoutubeVideoIdFromVideoData({ YouTube_URL: "https://youtu.be/dQw4w9WgXcQ" }),
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null when no URL", () => {
    expect(getYoutubeVideoIdFromVideoData({})).toBeNull();
  });
});
