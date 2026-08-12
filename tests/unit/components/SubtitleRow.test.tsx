import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtitleRow } from "@/components/bilingual/SubtitleRow";
import { SubtitleEntry } from "@/lib/types/subtitle";

const ITEM: SubtitleEntry = {
  id: 1,
  start: "00:00:01,000",
  end: "00:00:04,000",
  chinese: "你好",
  vietnamese: "Xin chào",
  pinyin: "nǐ hǎo",
  segmentedWords: [],
};

const baseProps = {
  item: ITEM,
  index: 0,
  activeIndex: null,
  isOpenPinyin: false,
  onWordPress: vi.fn(),
  colors: {},
  onReplay: vi.fn(),
};

describe("SubtitleRow", () => {
  it("renders chinese and vietnamese", () => {
    render(<SubtitleRow {...baseProps} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });

  it("shows pinyin only when isOpenPinyin", () => {
    const { rerender } = render(<SubtitleRow {...baseProps} />);
    expect(screen.queryByText("nǐ hǎo")).not.toBeInTheDocument();

    rerender(<SubtitleRow {...baseProps} isOpenPinyin />);
    expect(screen.getByText("nǐ hǎo")).toBeInTheDocument();
  });

  it("calls onReplay when row clicked", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    render(<SubtitleRow {...baseProps} onReplay={onReplay} />);

    await user.click(screen.getByText("你好"));
    expect(onReplay).toHaveBeenCalledWith(ITEM, 0);
  });

  it("calls onReplay from replay button without propagation", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    render(<SubtitleRow {...baseProps} onReplay={onReplay} />);

    await user.click(screen.getByTitle("Phát lại đoạn này"));
    expect(onReplay).toHaveBeenCalledWith(ITEM, 0);
  });

  it("calls onWordPress on segmented word", async () => {
    const user = userEvent.setup();
    const onWordPress = vi.fn();
    render(
      <SubtitleRow
        {...baseProps}
        item={{ ...ITEM, segmentedWords: [{ word: "你", pinyin: "nǐ" }] }}
        onWordPress={onWordPress}
      />,
    );

    await user.click(screen.getByRole("button", { name: /你/ }));
    expect(onWordPress).toHaveBeenCalledWith("你");
  });

  it("hides replay button when showReplay false", () => {
    render(<SubtitleRow {...baseProps} showReplay={false} />);
    expect(screen.queryByTitle("Phát lại đoạn này")).not.toBeInTheDocument();
  });

  it("calls onLayout with position info", () => {
    const onLayout = vi.fn();
    render(<SubtitleRow {...baseProps} onLayout={onLayout} />);
    expect(onLayout).toHaveBeenCalledWith(0, expect.any(Number), expect.any(Number));
  });
});
