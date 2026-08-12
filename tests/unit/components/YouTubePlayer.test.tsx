import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { YouTubePlayer } from "@/components/video/YouTubePlayer";

interface MockYtPlayerInstance {
  config: { events?: { onReady?: (event: { target: unknown }) => void } };
  getCurrentTime: () => number;
  seekTo: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  destroy: () => void;
}

function createMockYT() {
  const playerInstances: MockYtPlayerInstance[] = [];
  const MockPlayer = vi.fn(function (
    this: MockYtPlayerInstance,
    _id: string,
    config: { events?: { onReady?: (event: { target: unknown }) => void } },
  ) {
    this.config = config;
    this.getCurrentTime = vi.fn(() => 10);
    this.seekTo = vi.fn();
    this.playVideo = vi.fn();
    this.pauseVideo = vi.fn();
    this.getPlayerState = vi.fn(() => 1);
    this.destroy = vi.fn();
    playerInstances.push(this);
    if (config?.events?.onReady) {
      config.events.onReady({ target: this });
    }
  });
  return { MockPlayer, playerInstances };
}

describe("YouTubePlayer", () => {
  beforeEach(() => {
    vi.stubGlobal("YT", undefined);
    // Xóa script iframe_api còn sót từ test trước
    document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').forEach((s) =>
      s.remove(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("injects iframe API script when window.YT is missing", () => {
    render(<YouTubePlayer videoId="abc" isPlaying={false} playerRef={{ current: null }} />);

    const scripts = Array.from(document.querySelectorAll("script"));
    expect(scripts.some((s) => s.src === "https://www.youtube.com/iframe_api")).toBe(true);
  });

  it("does not inject script when YT already loaded", () => {
    vi.stubGlobal("YT", { Player: class {} });
    render(<YouTubePlayer videoId="abc" isPlaying={false} playerRef={{ current: null }} />);

    const scripts = Array.from(document.querySelectorAll("script"));
    expect(scripts.some((s) => s.src === "https://www.youtube.com/iframe_api")).toBe(false);
  });

  it("initializes player when YT is ready and exposes API via playerRef", async () => {
    const { MockPlayer } = createMockYT();
    vi.stubGlobal("YT", { Player: MockPlayer });
    const playerRef: { current: MockYtPlayerInstance | null } = { current: null };

    render(<YouTubePlayer videoId="abc" isPlaying={false} playerRef={playerRef} />);

    await waitFor(() => expect(MockPlayer).toHaveBeenCalled());
    await waitFor(() => expect(playerRef.current).not.toBeNull());

    // API phải expose đúng contract mà useDetailedVideoLogic cần
    const api = playerRef.current!;
    expect(typeof api.getCurrentTime).toBe("function");
    expect(typeof api.seekTo).toBe("function");
    expect(typeof api.playVideo).toBe("function");
    expect(typeof api.pauseVideo).toBe("function");
  });

  it("getCurrentTime returns player time as promise", async () => {
    const { MockPlayer } = createMockYT();
    vi.stubGlobal("YT", { Player: MockPlayer });
    const playerRef: { current: MockYtPlayerInstance | null } = { current: null };

    render(<YouTubePlayer videoId="abc" isPlaying={false} playerRef={playerRef} />);

    await waitFor(() => expect(playerRef.current).not.toBeNull());
    const api = playerRef.current!;
    await expect(api.getCurrentTime()).resolves.toBe(10);
  });

  it("pauses player when isPlaying=false and player is playing", async () => {
    const { MockPlayer, playerInstances } = createMockYT();
    vi.stubGlobal("YT", { Player: MockPlayer });
    const playerRef = { current: null };

    render(<YouTubePlayer videoId="abc" isPlaying={false} playerRef={playerRef} />);

    await waitFor(() => expect(playerInstances.length).toBe(1));
    const player = playerInstances[0];
    await waitFor(() => expect(player.pauseVideo).toHaveBeenCalled());
  });

  it("plays player when isPlaying=true and player is paused", async () => {
    const { MockPlayer, playerInstances } = createMockYT();
    vi.stubGlobal("YT", { Player: MockPlayer });
    const playerRef = { current: null };

    const { rerender } = render(
      <YouTubePlayer videoId="abc" isPlaying={false} playerRef={playerRef} />,
    );

    await waitFor(() => expect(playerInstances.length).toBe(1));
    const player = playerInstances[0];
    vi.mocked(player.getPlayerState).mockReturnValue(2); // paused

    act(() => {
      rerender(<YouTubePlayer videoId="abc" isPlaying playerRef={playerRef} />);
    });

    await waitFor(() => expect(player.playVideo).toHaveBeenCalled());
  });

  it("destroys player on unmount", async () => {
    const { MockPlayer, playerInstances } = createMockYT();
    vi.stubGlobal("YT", { Player: MockPlayer });
    const playerRef = { current: null };

    const { unmount } = render(
      <YouTubePlayer videoId="abc" isPlaying={false} playerRef={playerRef} />,
    );

    await waitFor(() => expect(playerInstances.length).toBe(1));
    unmount();

    expect(playerInstances[0].destroy).toHaveBeenCalled();
    expect(playerRef.current).toBeNull();
  });

  it("destroys and re-inits when videoId changes", async () => {
    const { MockPlayer, playerInstances } = createMockYT();
    vi.stubGlobal("YT", { Player: MockPlayer });
    const playerRef = { current: null };

    const { rerender } = render(
      <YouTubePlayer videoId="abc" isPlaying={false} playerRef={playerRef} />,
    );
    await waitFor(() => expect(playerInstances.length).toBe(1));

    act(() => {
      rerender(<YouTubePlayer videoId="xyz" isPlaying={false} playerRef={playerRef} />);
    });
    await waitFor(() => expect(playerInstances.length).toBe(2));

    expect(playerInstances[0].destroy).toHaveBeenCalled();
  });
});
