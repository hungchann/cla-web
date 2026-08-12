import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoTeleprompter } from "@/components/video/VideoTeleprompter";

const ITEMS = [
  {
    index: 0,
    chinese: "你好",
    pinyin: "nǐ hǎo",
    vietnamese: "Xin chào",
    start: "00:00:01,000",
    end: "00:00:04,000",
    segmentedWords: [{ word: "你", pinyin: "nǐ" }, { word: "好", pinyin: "hǎo" }],
  },
  {
    index: 1,
    chinese: "再见",
    pinyin: "zài jiàn",
    vietnamese: "Tạm biệt",
    start: "00:00:05,000",
    end: "00:00:08,000",
    segmentedWords: [],
  },
];

const baseProps = {
  items: ITEMS,
  activeIndex: 0,
  isOpenPinyin: true,
  onWordPress: vi.fn(),
  onReplayPress: vi.fn(),
  onSpeak: vi.fn(),
};

describe("VideoTeleprompter", () => {
  it("renders the active subtitle chinese and vietnamese", () => {
    render(<VideoTeleprompter {...baseProps} />);
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });

  it("shows progress as current/total", () => {
    render(<VideoTeleprompter {...baseProps} activeIndex={1} />);
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();
  });

  it("hides pinyin when isOpenPinyin is false", () => {
    render(<VideoTeleprompter {...baseProps} isOpenPinyin={false} />);
    expect(screen.queryByText("nǐ")).not.toBeInTheDocument();
    expect(screen.queryByText("hǎo")).not.toBeInTheDocument();
  });

  it("calls onWordPress when a segmented word is pressed", async () => {
    const user = userEvent.setup();
    const onWordPress = vi.fn();
    render(<VideoTeleprompter {...baseProps} onWordPress={onWordPress} />);

    await user.click(screen.getByRole("button", { name: /你/ }));
    expect(onWordPress).toHaveBeenCalledWith("你");
  });

  it("calls onReplayPress with the active item and index", async () => {
    const user = userEvent.setup();
    const onReplayPress = vi.fn();
    render(<VideoTeleprompter {...baseProps} onReplayPress={onReplayPress} />);

    await user.click(screen.getByRole("button", { name: /phát lại/i }));
    expect(onReplayPress).toHaveBeenCalledWith(ITEMS[0], 0);
  });

  it("calls onSpeak with the chinese text", async () => {
    const user = userEvent.setup();
    const onSpeak = vi.fn();
    render(<VideoTeleprompter {...baseProps} onSpeak={onSpeak} />);

    await user.click(screen.getByRole("button", { name: /nghe mẫu/i }));
    expect(onSpeak).toHaveBeenCalledWith("你好");
  });

  it("falls back to first item when activeIndex is null", () => {
    render(<VideoTeleprompter {...baseProps} activeIndex={null} />);
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });

  it("shows empty state when there are no items", () => {
    render(<VideoTeleprompter {...baseProps} items={[]} />);
    expect(screen.getByText(/không có phụ đề/i)).toBeInTheDocument();
  });

  it("renders whole chinese as individual characters when no segmentedWords", () => {
    render(<VideoTeleprompter {...baseProps} activeIndex={1} />);
    expect(screen.getByText("再")).toBeInTheDocument();
    expect(screen.getByText("见")).toBeInTheDocument();
    expect(screen.getByText("Tạm biệt")).toBeInTheDocument();
  });
});
