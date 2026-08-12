import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtitleItem } from "@/components/video/SubtitleItem";
import { SubtitleSegment } from "@/lib/types/video";

const ITEM: SubtitleSegment = {
  index: 0,
  chinese: "你好",
  pinyin: "nǐ hǎo",
  vietnamese: "Xin chào",
  start: "00:00:01,000",
  end: "00:00:04,000",
  segmentedWords: [],
};

const baseProps = {
  item: ITEM,
  index: 2,
  activeIndex: null,
  isOpenPinyin: false,
  onWordPress: vi.fn(),
  onReplayPress: vi.fn(),
};

describe("SubtitleItem", () => {
  it("renders chinese and vietnamese", () => {
    render(<SubtitleItem {...baseProps} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });

  it("hides pinyin when isOpenPinyin is false", () => {
    render(<SubtitleItem {...baseProps} isOpenPinyin={false} />);
    expect(screen.queryByText("nǐ hǎo")).not.toBeInTheDocument();
  });

  it("shows pinyin when isOpenPinyin is true", () => {
    render(<SubtitleItem {...baseProps} isOpenPinyin />);
    expect(screen.getByText("nǐ hǎo")).toBeInTheDocument();
  });

  it("calls onReplayPress on click", async () => {
    const user = userEvent.setup();
    const onReplayPress = vi.fn();
    render(<SubtitleItem {...baseProps} onReplayPress={onReplayPress} />);

    await user.click(screen.getByText("你好"));
    expect(onReplayPress).toHaveBeenCalledWith(ITEM, 2);
  });

  it("calls onReplayPress from replay button without propagation issue", async () => {
    const user = userEvent.setup();
    const onReplayPress = vi.fn();
    render(<SubtitleItem {...baseProps} onReplayPress={onReplayPress} />);

    await user.click(screen.getByTitle("Phát lại đoạn này"));
    expect(onReplayPress).toHaveBeenCalledWith(ITEM, 2);
  });

  it("calls onWordPress when segmented word pressed", async () => {
    const user = userEvent.setup();
    const onWordPress = vi.fn();
    render(
      <SubtitleItem
        {...baseProps}
        item={{
          ...ITEM,
          segmentedWords: [{ word: "你", pinyin: "nǐ" }],
        }}
        onWordPress={onWordPress}
      />,
    );

    await user.click(screen.getByRole("button", { name: /你/ }));
    expect(onWordPress).toHaveBeenCalledWith("你");
  });

  it("omits vietnamese paragraph when absent", () => {
    render(<SubtitleItem {...baseProps} item={{ ...ITEM, vietnamese: "" }} />);
    expect(screen.queryByText("Xin chào")).not.toBeInTheDocument();
  });
});
