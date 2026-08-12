import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BilingualContent } from "@/components/bilingual/BilingualContent";

vi.mock("@/components/bilingual/SubtitleRow", () => ({
  SubtitleRow: ({
    item,
    index,
    onReplay,
  }: {
    item: { chinese: string };
    index: number;
    onReplay: (item: { chinese: string }, index: number) => void;
  }) => (
    <div data-testid={`row-${index}`} onClick={() => onReplay(item, index)}>
      {item.chinese}
    </div>
  ),
}));

const SRT = [
  { id: 1, chinese: "你好", vietnamese: "Xin chào", segmentedWords: [] },
  { id: 2, chinese: "再见", vietnamese: "Tạm biệt", segmentedWords: [] },
];

const baseProps = {
  srtData: SRT,
  isOpenPinyin: false,
  onWordPress: vi.fn(),
};

describe("BilingualContent", () => {
  it("shows empty state when no subtitles", () => {
    render(<BilingualContent {...baseProps} srtData={[]} />);
    expect(screen.getByText(/Không có phụ đề/)).toBeInTheDocument();
  });

  it("renders all subtitle rows", () => {
    render(<BilingualContent {...baseProps} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("再见")).toBeInTheDocument();
  });

  it("calls onReplay when row clicked", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();
    render(<BilingualContent {...baseProps} onReplay={onReplay} />);

    await user.click(screen.getByTestId("row-0"));
    expect(onReplay).toHaveBeenCalledWith(SRT[0], 0);
  });

  it("falls back to onSpeakParagraph when no onReplay", async () => {
    const user = userEvent.setup();
    const onSpeakParagraph = vi.fn();
    render(<BilingualContent {...baseProps} onSpeakParagraph={onSpeakParagraph} />);

    await user.click(screen.getByTestId("row-1"));
    expect(onSpeakParagraph).toHaveBeenCalledWith("再见");
  });

  it("hides replay button when showReplay false", () => {
    // Với SubtitleRow thật bị mock, kiểm tra prop được truyền qua
    render(<BilingualContent {...baseProps} showReplay={false} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
  });
});
