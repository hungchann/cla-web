import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoPlayerSection } from "@/components/video/VideoPlayerSection";

vi.mock("@/components/video/YouTubePlayer", () => ({
  YouTubePlayer: () => <div data-testid="mock-yt-player">YouTube Player</div>,
}));

const baseProps = {
  isYoutubeVideo: false,
  ytVideoId: null,
  youtubeIsPlaying: false,
  youtubePlayerRef: { current: null },
  videoRef: { current: null },
  videoSource: "https://marutek.space/assets/clip.mp4",
  handleTimeUpdate: vi.fn(),
  handleVideoLoaded: vi.fn(),
};

describe("VideoPlayerSection", () => {
  it("renders local video element when not YouTube", () => {
    render(<VideoPlayerSection {...baseProps} />);
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.src).toBe("https://marutek.space/assets/clip.mp4");
    expect(screen.queryByTestId("mock-yt-player")).not.toBeInTheDocument();
  });

  it("renders YouTube player when YouTube video", () => {
    render(
      <VideoPlayerSection
        {...baseProps}
        isYoutubeVideo
        ytVideoId="dQw4w9WgXcQ"
      />,
    );
    expect(screen.getByTestId("mock-yt-player")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
  });

  it("falls back to local video when no ytVideoId", () => {
    render(<VideoPlayerSection {...baseProps} isYoutubeVideo />);
    expect(document.querySelector("video")).not.toBeNull();
  });

  it("renders title and fallback title", () => {
    render(<VideoPlayerSection {...baseProps} title="Bài 1" titleTrans="Bài 1" />);
    expect(screen.getByRole("heading", { name: "Bài 1" })).toBeInTheDocument();
  });

  it("uses default titles when missing", () => {
    render(<VideoPlayerSection {...baseProps} />);
    expect(screen.getByText("Video Bài Giảng")).toBeInTheDocument();
    expect(screen.getByText(/Học tiếng Trung qua bài giảng video song ngữ/)).toBeInTheDocument();
  });
});
