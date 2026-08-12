import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { BilingualExercise } from "@/components/bilingual/BilingualExercise";
import * as bilingualApi from "@/api/bilingual";

vi.mock("@/api/bilingual", async (importOriginal) => {
  const actual = await importOriginal<typeof bilingualApi>();
  return {
    ...actual,
    bilingualApi: {
      ...actual.bilingualApi,
      submitExercise: vi.fn(),
    },
  };
});

vi.mock("@/services/audioFeedback", () => ({
  playAnswerFeedback: vi.fn(),
}));

type ExerciseType = "select" | "quiz" | "trans_zh_vi" | "trans_vi_zh";

const baseProps = {
  exerciseList: [
    { id: 1, question: "Chọn nghĩa của 你好?", answer_A: "Xin chào", answer_B: "Cảm ơn" },
  ],
  isLoading: false,
  srtData: [
    { chinese: "你好", vietnamese: "Xin chào" },
    { chinese: "再见", vietnamese: "Tạm biệt" },
  ],
  quizSelected: null,
  setQuizSelected: vi.fn(),
  currentQuestionIndex: 0,
  setCurrentQuestionIndex: vi.fn(),
  exerciseType: "select" as ExerciseType,
  setExerciseType: vi.fn(),
};

describe("BilingualExercise — select mode", () => {
  it("shows exercise type selection with counts", () => {
    render(<BilingualExercise {...baseProps} />);
    expect(screen.getByText(/Trắc nghiệm \(1 câu\)/)).toBeInTheDocument();
    expect(screen.getByText(/Dịch Trung - Việt \(2 câu\)/)).toBeInTheDocument();
    expect(screen.getByText(/Dịch Việt - Trung \(2 câu\)/)).toBeInTheDocument();
  });

  it("trắc nghiệm button disabled when no exercises", () => {
    render(<BilingualExercise {...baseProps} exerciseList={[]} />);
    expect(screen.getByRole("button", { name: /trắc nghiệm/i })).toBeDisabled();
  });

  it("loading state shown", () => {
    render(<BilingualExercise {...baseProps} isLoading />);
    expect(screen.getByText("Đang tải bài tập...")).toBeInTheDocument();
  });
});

describe("BilingualExercise — quiz mode", () => {
  beforeEach(() => {
    vi.mocked(bilingualApi.bilingualApi.submitExercise).mockResolvedValue([
      { status: "Đúng", correctAnswer: "A" },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Wrapper giữ quizSelected có state thật (component là controlled prop)
  function QuizHarness(props: Partial<typeof baseProps>) {
    const [quizSelected, setQuizSelected] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    return (
      <BilingualExercise
        {...baseProps}
        {...props}
        quizSelected={quizSelected}
        setQuizSelected={setQuizSelected}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
      />
    );
  }

  it("renders question and options", () => {
    render(<QuizHarness exerciseType="quiz" />);
    expect(screen.getByText(/Chọn nghĩa của 你好/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /A\. Xin chào/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /B\. Cảm ơn/ })).toBeInTheDocument();
  });

  it("submits answer and shows correct result", async () => {
    const user = userEvent.setup();
    render(<QuizHarness exerciseType="quiz" />);

    await user.click(screen.getByRole("button", { name: /A\. Xin chào/ }));

    expect(bilingualApi.bilingualApi.submitExercise).toHaveBeenCalledWith([
      { questionId: 1, answer: "A", selectAnswer: "A" },
    ]);
    expect(await screen.findByText(/Chính xác! Bạn đã trả lời đúng/)).toBeInTheDocument();
  });

  it("shows wrong result message with correct answer", async () => {
    vi.mocked(bilingualApi.bilingualApi.submitExercise).mockResolvedValue([
      { status: "Sai", correctAnswer: "B" },
    ]);
    const user = userEvent.setup();
    render(<QuizHarness exerciseType="quiz" />);

    await user.click(screen.getByRole("button", { name: /A\. Xin chào/ }));

    expect(await screen.findByText(/Chưa chính xác! Đáp án đúng là B/)).toBeInTheDocument();
  });
});

describe("BilingualExercise — trans_zh_vi mode", () => {
  const zhProps = { ...baseProps, exerciseType: "trans_zh_vi" as const };

  it("shows source Chinese sentence", () => {
    render(<BilingualExercise {...zhProps} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
  });

  it("toggles reference translation", async () => {
    const user = userEvent.setup();
    render(<BilingualExercise {...zhProps} />);

    await user.click(screen.getByRole("button", { name: /xem đáp án mẫu/i }));
    expect(screen.getByText(/Bản dịch mẫu tham khảo/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ẩn đáp án mẫu/i }));
    expect(screen.queryByText(/Bản dịch mẫu tham khảo/)).not.toBeInTheDocument();
  });

  it("check button disabled until input typed", async () => {
    render(<BilingualExercise {...zhProps} />);
    const checkBtn = screen.getByRole("button", { name: /kiểm tra kết quả/i });
    expect(checkBtn).toBeDisabled();
  });

  it("shows evaluation after checking translation", async () => {
    const user = userEvent.setup();
    render(<BilingualExercise {...zhProps} />);

    await user.type(screen.getByPlaceholderText(/Nhập bản dịch tiếng Việt/), "Xin chào");
    await user.click(screen.getByRole("button", { name: /kiểm tra kết quả/i }));

    expect(screen.getByText(/Độ trùng khớp từ vựng/)).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("shows missing words when translation is incomplete", async () => {
    const user = userEvent.setup();
    render(<BilingualExercise {...zhProps} />);

    // Reference: "Xin chào" → gõ thiếu một từ
    await user.type(screen.getByPlaceholderText(/Nhập bản dịch tiếng Việt/), "Xin");
    await user.click(screen.getByRole("button", { name: /kiểm tra kết quả/i }));

    expect(screen.getByText(/Các từ quan trọng bị thiếu/)).toBeInTheDocument();
  });
});
