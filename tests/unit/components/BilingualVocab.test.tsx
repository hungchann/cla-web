import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BilingualVocab } from "@/components/bilingual/BilingualVocab";

const VOCAB = [
  {
    id: "v1",
    word: "你好",
    word_type: "叹词",
    Pinyin: "nǐ hǎo",
    meaning: "Xin chào",
    Example: "你好！",
  },
];

describe("BilingualVocab", () => {
  it("shows loading state", () => {
    render(<BilingualVocab vocabList={[]} isLoading onWordPress={() => {}} />);
    expect(screen.getByText("Đang tải từ vựng...")).toBeInTheDocument();
  });

  it("shows empty state when no vocab", () => {
    render(<BilingualVocab vocabList={[]} isLoading={false} onWordPress={() => {}} />);
    expect(screen.getByText(/chưa được cập nhật từ vựng/i)).toBeInTheDocument();
  });

  it("renders vocab table with all columns", () => {
    render(<BilingualVocab vocabList={VOCAB} isLoading={false} onWordPress={() => {}} />);
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("叹词")).toBeInTheDocument();
    expect(screen.getByText("nǐ hǎo")).toBeInTheDocument();
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
    expect(screen.getByText("你好！")).toBeInTheDocument();
  });

  it("calls onWordPress when clicking a word", async () => {
    const user = userEvent.setup();
    const onWordPress = vi.fn();
    render(<BilingualVocab vocabList={VOCAB} isLoading={false} onWordPress={onWordPress} />);

    await user.click(screen.getByText("你好"));
    expect(onWordPress).toHaveBeenCalledWith("你好");
  });

  it("falls back to example field when Example missing", () => {
    const vocab = [{ ...VOCAB[0], Example: undefined, example: "Ví dụ thay thế" }];
    render(<BilingualVocab vocabList={vocab} isLoading={false} onWordPress={() => {}} />);
    expect(screen.getByText("Ví dụ thay thế")).toBeInTheDocument();
  });
});
