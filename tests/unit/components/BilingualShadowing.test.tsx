import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BilingualShadowing } from "@/components/bilingual/BilingualShadowing";

const SRT = [
  { chinese: "你好", vietnamese: "Xin chào", segmentedWords: [] },
  { chinese: "再见", vietnamese: "Tạm biệt", segmentedWords: [] },
];

const baseProps = {
  srtData: SRT,
  onSpeakWord: vi.fn(),
};

function mockMediaDevices() {
  const stream = { getTracks: () => [{ stop: vi.fn() }] };
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    configurable: true,
  });
}

function mockMediaRecorder() {
  const recorder: {
    start: () => void;
    stop: () => void;
    state: string;
    ondataavailable: null;
    onstop: (() => void) | null;
  } = {
    start: vi.fn(),
    stop: vi.fn(() => {
      recorder.state = "inactive";
      if (typeof recorder.onstop === "function") recorder.onstop();
    }),
    state: "recording",
    ondataavailable: null,
    onstop: null,
  };
  Object.defineProperty(globalThis, "MediaRecorder", {
    value: function () {
      return recorder;
    },
    configurable: true,
  });
  return recorder;
}

describe("BilingualShadowing", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    // jsdom không có Audio constructor — mock để không crash khi phát lại bản ghi
    class MockAudio {
      play = vi.fn().mockResolvedValue(undefined);
      pause = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
    }
    vi.stubGlobal("Audio", MockAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders current sentence and navigation counter", () => {
    render(<BilingualShadowing {...baseProps} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("calls onSpeakWord when clicking speaker button", async () => {
    const user = userEvent.setup();
    render(<BilingualShadowing {...baseProps} />);
    await user.click(screen.getByTitle("Nghe giọng đọc mẫu"));
    expect(baseProps.onSpeakWord).toHaveBeenCalledWith("你好");
  });

  it("navigates to next sentence", async () => {
    const user = userEvent.setup();
    render(<BilingualShadowing {...baseProps} />);

    await user.click(screen.getByTitle("Câu tiếp theo"));
    expect(screen.getByText("再见")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("prev button disabled on first sentence", () => {
    render(<BilingualShadowing {...baseProps} />);
    expect(screen.getByTitle("Câu trước")).toBeDisabled();
  });

  it("starts recording and shows recording state", async () => {
    mockMediaDevices();
    mockMediaRecorder();

    const user = userEvent.setup();
    render(<BilingualShadowing {...baseProps} />);

    await user.click(screen.getByTitle("Bắt đầu ghi âm"));
    expect(screen.getByText(/Đang thu âm: 0s \/ 15s/)).toBeInTheDocument();
  });

  it("shows comparison feedback after successful transcription", async () => {
    mockMediaDevices();
    const recorder = mockMediaRecorder();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, transcription: "你好" }),
    }));
    const user = userEvent.setup();
    render(<BilingualShadowing {...baseProps} />);

    await user.click(screen.getByTitle("Bắt đầu ghi âm"));
    // Kích hoạt onstop
    recorder.stop();

    expect(await screen.findByText("Kết quả phát âm")).toBeInTheDocument();
    expect(await screen.findByText("100%")).toBeInTheDocument();
  });

  it("shows error feedback when transcription fails", async () => {
    mockMediaDevices();
    const recorder = mockMediaRecorder();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));
    const user = userEvent.setup();
    render(<BilingualShadowing {...baseProps} />);

    await user.click(screen.getByTitle("Bắt đầu ghi âm"));
    recorder.stop();

    expect(await screen.findByText(/Lỗi kết nối máy chủ ghi âm/)).toBeInTheDocument();
  });

  it("reset button clears feedback", async () => {
    mockMediaDevices();
    const recorder = mockMediaRecorder();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, transcription: "你好" }),
    }));
    const user = userEvent.setup();
    render(<BilingualShadowing {...baseProps} />);

    await user.click(screen.getByTitle("Bắt đầu ghi âm"));
    recorder.stop();
    await screen.findByText("Kết quả phát âm");

    await user.click(screen.getByRole("button", { name: /luyện tập lại/i }));
    await waitFor(() => {
      expect(screen.queryByText("Kết quả phát âm")).not.toBeInTheDocument();
    });
  });
});
