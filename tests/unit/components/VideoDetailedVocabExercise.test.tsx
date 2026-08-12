import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VideoDetailedVocabExercise from "@/components/video/VideoDetailedVocabExercise";

describe("VideoDetailedVocabExercise", () => {
  it("renders header and question", () => {
    render(<VideoDetailedVocabExercise />);
    expect(screen.getByText("Bài tập chi tiết")).toBeInTheDocument();
    expect(screen.getByText("Từ vựng video")).toBeInTheDocument();
    expect(screen.getByText(/中国是一个拥有悠久历史和/)).toBeInTheDocument();
  });

  it("renders all 4 options", () => {
    render(<VideoDetailedVocabExercise />);
    expect(screen.getByText("老的")).toBeInTheDocument();
    expect(screen.getByText("丰富")).toBeInTheDocument();
    expect(screen.getByText("苹果")).toBeInTheDocument();
    expect(screen.getByText("青春 của")).toBeInTheDocument();
  });

  it("selects an option when clicked", async () => {
    const user = userEvent.setup();
    render(<VideoDetailedVocabExercise />);

    const option = screen.getByRole("button", { name: /丰富/ });
    await user.click(option);

    // Style thay đổi khi selected (backgroundColor = primary #d97706)
    expect(option).toHaveStyle({ backgroundColor: "#d97706" });
  });

  it("switches selection to another option", async () => {
    const user = userEvent.setup();
    render(<VideoDetailedVocabExercise />);

    const first = screen.getByRole("button", { name: /老的/ });
    const second = screen.getByRole("button", { name: /苹果/ });

    await user.click(first);
    expect(first).toHaveStyle({ backgroundColor: "#d97706" });

    await user.click(second);
    expect(second).toHaveStyle({ backgroundColor: "#d97706" });
    expect(first).toHaveStyle({ backgroundColor: "rgb(244, 244, 245)" });
  });
});
