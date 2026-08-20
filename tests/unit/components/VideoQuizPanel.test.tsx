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
  nextQuestionId: 1,
  hasCompletedAll: false,
  totalExercises: 2,
  onViewResults: vi.fn(),
  onSeek: vi.fn(),
  onSelectQuestion: vi.fn(),
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
      />
    );
    expect(
      screen.getByText(/chưa có câu hỏi trắc nghiệm/i)
    ).toBeInTheDocument();
  });

  it("renders question list with questions and timestamps", () => {
    render(<VideoQuizPanel {...baseProps} />);
    expect(screen.getByText("Chọn nghĩa đúng của 你好")).toBeInTheDocument();
    expect(screen.getByText("再见 nghĩa là gì?")).toBeInTheDocument();
    expect(screen.getByText("Câu 1")).toBeInTheDocument();
    expect(screen.getByText("Câu 2")).toBeInTheDocument();
  });

  it("calls onSelectQuestion when clicking a question item", async () => {
    const user = userEvent.setup();
    const onSelectQuestion = vi.fn();
    render(
      <VideoQuizPanel
        {...baseProps}
        activeQuestion={null}
        activeEx={null}
        onSelectQuestion={onSelectQuestion}
      />
    );

    await user.click(screen.getByText("再见 nghĩa là gì?"));
    expect(onSelectQuestion).toHaveBeenCalledWith(EXERCISES[1]);
  });

  it("shows completed percentage and answered badges", () => {
    render(
      <VideoQuizPanel
        {...baseProps}
        activeQuestion={null}
        activeEx={null}
        answeredIds={[1]}
        answerResults={[{ questionId: 1, status: "Đúng", yourAnswer: "A" }]}
      />
    );

    expect(screen.getByText(/50%/i)).toBeInTheDocument();
    expect(screen.getByText(/^\s*Đúng\s*$/i)).toBeInTheDocument();
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
      />
    );

    await user.click(
      screen.getByRole("button", { name: /xem kết quả tổng quan/i })
    );
    expect(onViewResults).toHaveBeenCalled();
  });
});
