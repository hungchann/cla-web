import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HighlightedText from "@/components/HighlightedText";

describe("HighlightedText", () => {
  it("renders text character by character", () => {
    render(<HighlightedText text="你好" highlightedWords={[]} />);
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
  });

  it("marks correct characters with bold style", () => {
    render(
      <HighlightedText
        text="你好"
        highlightedWords={[{ word: "你", isCorrect: true, isMissing: false, isExtra: false }]}
      />,
    );
    const char = screen.getByText("你");
    expect(char).toHaveStyle({ fontWeight: "bold" });
    expect(screen.getByText("好")).not.toHaveStyle({ fontWeight: "bold" });
  });

  it("marks missing characters with error background", () => {
    render(
      <HighlightedText
        text="好"
        highlightedWords={[{ word: "好", isCorrect: false, isMissing: true, isExtra: false }]}
      />,
    );
    expect(screen.getByText("好")).toHaveStyle({ color: "#ef4444" });
  });

  it("marks extra characters with warning color", () => {
    render(
      <HighlightedText
        text="好"
        highlightedWords={[{ word: "好", isCorrect: false, isMissing: false, isExtra: true }]}
      />,
    );
    expect(screen.getByText("好")).toHaveStyle({ color: "#f59e0b" });
  });

  it("renders segmented words with pinyin when showPinyin enabled", () => {
    render(
      <HighlightedText
        text="你好"
        highlightedWords={[{ word: "你好", isCorrect: true, isMissing: false, isExtra: false }]}
        showPinyin
        segmentedWords={[{ word: "你好", pinyin: "nǐ hǎo" }]}
      />,
    );
    expect(screen.getByText("nǐ hǎo")).toBeInTheDocument();
  });
});
