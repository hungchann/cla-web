/**
 * Chuẩn hóa nguồn video / URL YouTube từ CMS (Directus) — field name & casing có thể khác nhau.
 */

export function readYoutubeUrlFromVideoData(videoData: any): string | null {
  if (!videoData || typeof videoData !== "object") return null;
  const u =
    videoData.YouTube_URL ??
    videoData.youtube_url ??
    videoData.YouTubeUrl ??
    videoData.youtubeUrl ??
    videoData.video_url;
  if (typeof u === "string" && u.trim().length > 0) return u.trim();
  return null;
}

export function readVideoSourceRaw(videoData: any): string {
  if (!videoData || typeof videoData !== "object") return "";
  const s =
    videoData.Video_Source ??
    videoData.video_source ??
    videoData.videoSource ??
    videoData.source;
  return String(s ?? "").trim();
}

/** Có nên dùng Youtube iframe (không dùng file local) không. */
export function videoDataUsesYoutubePlayer(videoData: any): boolean {
  if (!videoData) return false;
  const src = readVideoSourceRaw(videoData).toLowerCase();
  if (src === "youtube" || src === "youtu.be") return true;
  if (src === "local" || src === "server") return false;
  const url = readYoutubeUrlFromVideoData(videoData);
  const hasFile = !!(videoData.video_file?.filename_disk || videoData.video_file?.id);
  return !!url && !hasFile;
}

/**
 * Trích videoId cho react-native-youtube-iframe.
 * Hỗ trợ watch?v=, youtu.be, shorts/, embed/, live/, URL thiếu scheme, hoặc đúng 11 ký tự id.
 */
export function getYoutubeVideoIdFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;

  const parseHref = (href: string): string | null => {
    try {
      const u = new URL(href);
      const ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
      const isValidId = (id: string | undefined): id is string => !!id && ID_REGEX.test(id);

      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      if (host === "youtu.be" || host.endsWith(".youtu.be")) {
        const id = u.pathname.split("/").filter(Boolean)[0];
        return isValidId(id) ? id : null;
      }
      const v = u.searchParams.get("v");
      if (v && ID_REGEX.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && isValidId(parts[shortsIdx + 1])) return parts[shortsIdx + 1];
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && isValidId(parts[embedIdx + 1])) return parts[embedIdx + 1];
      const liveIdx = parts.indexOf("live");
      if (liveIdx >= 0 && isValidId(parts[liveIdx + 1])) return parts[liveIdx + 1];
      return null;
    } catch {
      return null;
    }
  };

  if (t.includes("://")) return parseHref(t);
  const withScheme = `https://${t}`;
  return parseHref(withScheme) ?? parseHref(t);
}

export function getYoutubeVideoIdFromVideoData(videoData: any): string | null {
  return getYoutubeVideoIdFromUrl(readYoutubeUrlFromVideoData(videoData));
}
