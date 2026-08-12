import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoQuizPanel } from "@/components/video/VideoQuizPanel";

const EXERCISE = {
  id: 1,
  question: "Chọn nghĩa đúng của 你好",
  answer_a: "Xin chào",
  answer_b: "Cảm ơn",
};

const OPTIONS = [
  { id: "a", hanzi: "你好", pinyin: "nǐ hǎo", isCorrect: true },
  { id: "b", hanzi: "再见", pinyin: "zài jiàn", isCorrect: false },
];

const baseProps = {
  activeQuestion: { id: 1 },
  activeEx: EXERCISE,
  getOptions: vi.fn(() => OPTIONS),
  onSubmit: vi.fn(),
  onContinue: vi.fn(),
};

describe("VideoQuizPanel", () => {
  it("shows empty state when no active question", () => {
    render(
      <VideoQuizPanel
        {...baseProps}
        activeQuestion={null}
        activeEx={null}
      />,
    );
    expect(screen.getByText(/không có câu hỏi dừng video/i)).toBeInTheDocument();
  });

  it("renders question and options", () => {
    render(<VideoQuizPanel {...baseProps} />);
    expect(screen.getByText("Chọn nghĩa đúng của 你好")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /a\. 你好/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /b\. 再见/i })).toBeInTheDocument();
  });

  it("submits the selected answer through onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "Đúng" });
    render(<VideoQuizPanel {...baseProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /a\. 你好/i }));
    await user.click(screen.getByRole("button", { name: /nộp câu trả lời/i }));

    expect(onSubmit).toHaveBeenCalledWith("a");
  });

  it("shows success message when answer is correct", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "Đúng" });
    render(<VideoQuizPanel {...baseProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /a\. 你好/i }));
    await user.click(screen.getByRole("button", { name: /nộp câu trả lời/i }));

    expect(screen.getByText("Chính xác! Bạn học rất tốt.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tiếp tục xem video/i })).toBeInTheDocument();
  });

  it("shows failure message when answer is wrong", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "Sai" });
    render(<VideoQuizPanel {...baseProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /b\. 再见/i }));
    await user.click(screen.getByRole("button", { name: /nộp câu trả lời/i }));

    expect(screen.getByText("Chưa đúng rồi! Ôn tập lại nhé.")).toBeInTheDocument();
  });

  it("calls onContinue from continue button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "Đúng" });
    const onContinue = vi.fn();
    render(<VideoQuizPanel {...baseProps} onSubmit={onSubmit} onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: /a\. 你好/i }));
    await user.click(screen.getByRole("button", { name: /nộp câu trả lời/i }));
    await user.click(screen.getByRole("button", { name: /tiếp tục xem video/i }));

    expect(onContinue).toHaveBeenCalled();
  });
});
