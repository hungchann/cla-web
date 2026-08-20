import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VideoResultsPage from "@/app/(app)/video/results/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

describe("VideoResultsPage", () => {
  it("renders empty state when no results provided", () => {
    mockSearchParams = new URLSearchParams();
    render(<VideoResultsPage />);
    expect(screen.getByText("Kết quả trắc nghiệm")).toBeDefined();
    expect(screen.getByText("Chưa có dữ liệu bài làm trắc nghiệm.")).toBeDefined();
  });

  it("renders accuracy and question details when results exist", () => {
    const results = [
      {
        questionId: 101,
        question: "Từ nào có nghĩa là Học tập?",
        yourAnswer: "A",
        answerText: "学习",
        correctAnswer: "A",
        status: "Đúng",
        isCorrect: true,
        time_start: "00:00:04,000",
      },
      {
        questionId: 102,
        question: "Từ nào có nghĩa là Ngõ hẻm?",
        yourAnswer: "B",
        answerText: "大路",
        correctAnswer: "A",
        status: "Sai",
        isCorrect: false,
        time_start: "00:00:12,000",
      },
    ];

    const video = {
      id: "v1",
      title: "Học tiếng Trung qua video",
    };

    mockSearchParams = new URLSearchParams({
      results: JSON.stringify(results),
      video: JSON.stringify(video),
    });

    render(<VideoResultsPage />);
    expect(screen.getByText("50%")).toBeDefined();
    expect(screen.getByText("Từ nào có nghĩa là Học tập?")).toBeDefined();
    expect(screen.getByText("Từ nào có nghĩa là Ngõ hẻm?")).toBeDefined();
  });
});
