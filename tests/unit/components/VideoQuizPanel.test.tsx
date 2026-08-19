import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoQuizPanel } from "@/components/video/VideoQuizPanel";

const EXERCISES = [
  {
    id: 1,
    question: "Chọn nghĩa đúng của 你好",
    answer_A: "Xin chào",
    answer_B: "Cảm ơn",
    Correct_answer: "A",
    time_start: "00:00:01",
    time_end: "00:00:04",
  },
  {
    id: 2,
    question: "再见 nghĩa là gì?",
    answer_A: "Tạm biệt",
    answer_B: "Hẹn gặp lại",
    Correct_answer: "A",
    time_start: "00:00:05",
    time_end: "00:00:08",
  },
];

const baseProps = {
  exerciseData: EXERCISES,
  activeQuestion: EXERCISES[0],
  activeEx: EXERCISES[0],
  answeredIds: [],
  answerResults: [],
  showResult: false,
  nextQuestionId: 1,
  hasCompletedAll: false,
  totalExercises: 2,
  onSubmit: vi.fn(),
  onContinue: vi.fn(),
  onViewResults: vi.fn(),
  onSeek: vi.fn(),
};

describe("VideoQuizPanel", () => {
  it("shows no exercises message when totalExercises is 0", () => {
    render(
      <VideoQuizPanel
        {...baseProps}
        exerciseData={[]}
        activeQuestion={null}
        activeEx={null}
        totalExercises={0}
      />,
    );
    expect(screen.getByText(/chưa có câu hỏi trắc nghiệm/i)).toBeInTheDocument();
  });

  it("renders question list and active question panel", () => {
    render(<VideoQuizPanel {...baseProps} />);
    expect(screen.getAllByText("Chọn nghĩa đúng của 你好").length).toBeGreaterThan(0);
    expect(screen.getByText("再见 nghĩa là gì?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /a\. Xin chào/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /b\. Cảm ơn/i })).toBeInTheDocument();
  });

  it("submits the selected answer when clicking option", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "Đúng" });
    render(<VideoQuizPanel {...baseProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /a\. Xin chào/i }));
    expect(onSubmit).toHaveBeenCalledWith("A");
  });

  it("shows completed percentage and answered badges", () => {
    render(
      <VideoQuizPanel
        {...baseProps}
        activeQuestion={null}
        activeEx={null}
        answeredIds={[1]}
        answerResults={[{ questionId: 1, status: "Đúng", yourAnswer: "A" }]}
      />,
    );

    expect(screen.getByText(/50%/i)).toBeInTheDocument();
    expect(screen.getByText(/^\s*Đúng\s*$/i)).toBeInTheDocument();
  });

  it("calls onContinue when clicking skip button", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<VideoQuizPanel {...baseProps} onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: /bỏ qua/i }));
    expect(onContinue).toHaveBeenCalled();
  });

  it("calls onViewResults when all completed", async () => {
    const user = userEvent.setup();
    const onViewResults = vi.fn();
    render(
      <VideoQuizPanel
        {...baseProps}
        activeQuestion={null}
        activeEx={null}
        answeredIds={[1, 2]}
        hasCompletedAll={true}
        onViewResults={onViewResults}
      />,
    );

    await user.click(screen.getByRole("button", { name: /xem kết quả tổng quan/i }));
    expect(onViewResults).toHaveBeenCalled();
  });
});
