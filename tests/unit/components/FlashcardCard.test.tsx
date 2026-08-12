import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardCard } from "@/components/flashcard/FlashcardC";

const baseProps = {
  isFlipped: false,
  onFlip: vi.fn(),
  frontContent: <span>Mặt trước</span>,
  backContent: <span>Mặt sau</span>,
};

describe("FlashcardCard", () => {
  it("renders front and back content", () => {
    render(<FlashcardCard {...baseProps} />);
    expect(screen.getByText("Mặt trước")).toBeInTheDocument();
    expect(screen.getByText("Mặt sau")).toBeInTheDocument();
  });

  it("calls onFlip on click", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    render(<FlashcardCard {...baseProps} onFlip={onFlip} />);

    await user.click(screen.getByRole("button"));
    expect(onFlip).toHaveBeenCalled();
  });

  it("calls onFlip on Enter key", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    render(<FlashcardCard {...baseProps} onFlip={onFlip} />);

    const card = screen.getByRole("button");
    card.focus();
    await user.keyboard("{Enter}");
    expect(onFlip).toHaveBeenCalled();
  });

  it("calls onFlip on Space key", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    render(<FlashcardCard {...baseProps} onFlip={onFlip} />);

    const card = screen.getByRole("button");
    card.focus();
    await user.keyboard(" ");
    expect(onFlip).toHaveBeenCalled();
  });

  it("does not flip when key event is on child element", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    render(<FlashcardCard {...baseProps} onFlip={onFlip} />);

    // Focus a child span — key event target != currentTarget → không flip
    const front = screen.getByText("Mặt trước");
    front.focus();
    await user.keyboard("{Enter}");
    expect(onFlip).not.toHaveBeenCalled();
  });
});
