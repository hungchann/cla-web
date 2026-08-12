import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoQuizSection } from "@/components/video/VideoQuizSection";

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
  selectedAnswer: null,
  setSelectedAnswer: vi.fn(),
  isAnswerChecked: false,
  isAnswerCorrect: null,
  handleAnswerSubmit: vi.fn(),
  handleContinueVideo: vi.fn(),
  getOptions: vi.fn(() => OPTIONS),
};

describe("VideoQuizSection", () => {
  it("shows empty state when no active question", () => {
    render(
      <VideoQuizSection
        {...baseProps}
        activeQuestion={null}
        activeEx={null}
      />,
    );
    expect(screen.getByText(/không có câu hỏi dừng video/i)).toBeInTheDocument();
  });

  it("renders question and options", () => {
    render(<VideoQuizSection {...baseProps} />);
    expect(screen.getByText("Chọn nghĩa đúng của 你好")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /a\. 你好/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /b\. 再见/i })).toBeInTheDocument();
  });

  it("shows submit button disabled until an answer is selected", async () => {
    const user = userEvent.setup();
    render(<VideoQuizSection {...baseProps} selectedAnswer={null} />);
    const submit = screen.getByRole("button", { name: /nộp câu trả lời/i });
    expect(submit).toBeDisabled();

    await user.click(submit);
    expect(baseProps.handleAnswerSubmit).not.toHaveBeenCalled();
  });

  it("selects an option and enables submit", async () => {
    const user = userEvent.setup();
    const setSelectedAnswer = vi.fn();
    render(<VideoQuizSection {...baseProps} setSelectedAnswer={setSelectedAnswer} />);

    await user.click(screen.getByRole("button", { name: /a\. 你好/i }));
    expect(setSelectedAnswer).toHaveBeenCalledWith("a");
  });

  it("calls handleAnswerSubmit when checked", async () => {
    const user = userEvent.setup();
    render(<VideoQuizSection {...baseProps} selectedAnswer="a" />);
    await user.click(screen.getByRole("button", { name: /nộp câu trả lời/i }));
    expect(baseProps.handleAnswerSubmit).toHaveBeenCalled();
  });

  it("shows success message and continue button when answer checked correct", () => {
    render(
      <VideoQuizSection
        {...baseProps}
        isAnswerChecked
        isAnswerCorrect
        selectedAnswer="a"
      />,
    );
    expect(screen.getByText("Chính xác! Bạn học rất tốt.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tiếp tục xem video/i })).toBeInTheDocument();
  });

  it("shows failure message when answer wrong", () => {
    render(
      <VideoQuizSection
        {...baseProps}
        isAnswerChecked
        isAnswerCorrect={false}
        selectedAnswer="b"
      />,
    );
    expect(screen.getByText("Chưa đúng rồi! Ôn tập lại nhé.")).toBeInTheDocument();
  });

  it("disables options after check", () => {
    render(<VideoQuizSection {...baseProps} isAnswerChecked selectedAnswer="a" />);
    const optionBtn = screen.getByRole("button", { name: /a\. 你好/i });
    expect(optionBtn).toBeDisabled();
  });

  it("calls handleContinueVideo from continue button", async () => {
    const user = userEvent.setup();
    render(
      <VideoQuizSection
        {...baseProps}
        isAnswerChecked
        isAnswerCorrect
        selectedAnswer="a"
      />,
    );
    await user.click(screen.getByRole("button", { name: /tiếp tục xem video/i }));
    expect(baseProps.handleContinueVideo).toHaveBeenCalled();
  });
});
