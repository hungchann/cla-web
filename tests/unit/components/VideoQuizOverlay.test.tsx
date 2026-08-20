import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoQuizOverlay } from "@/components/video/VideoQuizOverlay";

const QUESTION = {
  id: 101,
  question: "_____回来",
  answer_A: "迎接",
  answer_B: "欢迎",
  answer_C: "迎来",
  answer_D: "欢乐",
  time_start: "00:00:03,766",
  time_end: "00:00:05,800",
};

describe("VideoQuizOverlay", () => {
  it("renders active question and 4 options", () => {
    render(
      <VideoQuizOverlay
        activeQuestion={QUESTION}
        showResult={false}
        answerResults={[]}
        onSubmit={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByText("_____回来")).toBeInTheDocument();
    expect(screen.getByText("迎接")).toBeInTheDocument();
    expect(screen.getByText("欢迎")).toBeInTheDocument();
    expect(screen.getByText("迎来")).toBeInTheDocument();
    expect(screen.getByText("欢乐")).toBeInTheDocument();
  });

  it("selects an option without auto-submitting until confirmed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ status: "Đúng" });

    render(
      <VideoQuizOverlay
        activeQuestion={QUESTION}
        showResult={false}
        answerResults={[]}
        onSubmit={onSubmit}
        onContinue={vi.fn()}
      />
    );

    // 1. Click option B -> It should NOT submit immediately
    await user.click(screen.getByRole("button", { name: /欢迎/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Đã chọn \(B\)/i)).toBeInTheDocument();

    // 2. Click confirm button -> Now it submits
    await user.click(screen.getByRole("button", { name: /xác nhận đáp án/i }));
    expect(onSubmit).toHaveBeenCalledWith("B");
  });

  it("shows correct feedback when answer is correct", () => {
    render(
      <VideoQuizOverlay
        activeQuestion={QUESTION}
        showResult={true}
        answerResults={[
          {
            questionId: 101,
            yourAnswer: "B",
            correctAnswer: "B",
            status: "Đúng",
          },
        ]}
        onSubmit={vi.fn()}
        onContinue={vi.fn()}
      />
    );

    expect(screen.getByText(/chính xác! rất tốt!/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tiếp tục xem video/i })
    ).toBeInTheDocument();
  });

  it("calls onContinue when skip button is clicked", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();

    render(
      <VideoQuizOverlay
        activeQuestion={QUESTION}
        showResult={false}
        answerResults={[]}
        onSubmit={vi.fn()}
        onContinue={onContinue}
      />
    );

    await user.click(screen.getByRole("button", { name: /bỏ qua/i }));
    expect(onContinue).toHaveBeenCalled();
  });
});
