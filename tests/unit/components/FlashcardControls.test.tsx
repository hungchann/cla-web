import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardControls } from "@/components/flashcard/FlashcardControls";

const baseProps = {
  onNext: vi.fn(),
  onPrevious: vi.fn(),
  onFlip: vi.fn(),
  currentIndex: 0,
  isFirst: false,
};

describe("FlashcardControls", () => {
  it("renders all four buttons", () => {
    render(<FlashcardControls {...baseProps} />);
    expect(screen.getByRole("button", { name: /quay lại/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chưa thuộc/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lật thẻ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /đã thuộc/i })).toBeInTheDocument();
  });

  it("calls onNext with learning status", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<FlashcardControls {...baseProps} onNext={onNext} />);
    await user.click(screen.getByRole("button", { name: /chưa thuộc/i }));
    expect(onNext).toHaveBeenCalledWith("learning");
  });

  it("calls onNext with mastered status", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<FlashcardControls {...baseProps} onNext={onNext} />);
    await user.click(screen.getByRole("button", { name: /đã thuộc/i }));
    expect(onNext).toHaveBeenCalledWith("mastered");
  });

  it("calls onFlip", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    render(<FlashcardControls {...baseProps} onFlip={onFlip} />);
    await user.click(screen.getByRole("button", { name: /lật thẻ/i }));
    expect(onFlip).toHaveBeenCalled();
  });

  it("calls onPrevious when not first card", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    render(<FlashcardControls {...baseProps} isFirst={false} onPrevious={onPrevious} />);
    await user.click(screen.getByRole("button", { name: /quay lại/i }));
    expect(onPrevious).toHaveBeenCalled();
  });

  it("disables previous button on first card", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    render(<FlashcardControls {...baseProps} isFirst onPrevious={onPrevious} />);
    const btn = screen.getByRole("button", { name: /quay lại/i });
    expect(btn).toBeDisabled();

    await user.click(btn);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("renders pronounce button in quiz mode and calls onPronounce", async () => {
    const user = userEvent.setup();
    const onPronounce = vi.fn();
    render(<FlashcardControls {...baseProps} mode="quiz" onPronounce={onPronounce} />);
    expect(screen.getByRole("button", { name: /phát âm/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /phát âm/i }));
    expect(onPronounce).toHaveBeenCalled();
  });
});

