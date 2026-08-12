import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BilingualGrammar } from "@/components/bilingual/BilingualGrammar";

const baseProps = {
  grammarList: [],
  isLoading: false,
};

describe("BilingualGrammar", () => {
  it("shows loading state", () => {
    render(<BilingualGrammar {...baseProps} isLoading />);
    expect(screen.getByText("Đang tải ngữ pháp...")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<BilingualGrammar {...baseProps} />);
    expect(screen.getByText(/chưa được cập nhật cấu trúc ngữ pháp/)).toBeInTheDocument();
  });

  it("renders grammar title and description", () => {
    render(
      <BilingualGrammar
        {...baseProps}
        grammarList={[{ id: "g1", title: "把字句", description: "Cấu trúc 把" }]}
      />,
    );
    expect(screen.getByText("把字句")).toBeInTheDocument();
    expect(screen.getByText("Cấu trúc 把")).toBeInTheDocument();
  });

  it("decodes HTML entities in content", () => {
    render(
      <BilingualGrammar
        {...baseProps}
        grammarList={[{ id: "g1", title: "HTML", content: "a &amp; b &lt; c &gt; d" }]}
      />,
    );
    expect(screen.getByText(/a & b < c > d/)).toBeInTheDocument();
  });

  it("renders content as HTML when title has markup", () => {
    render(
      <BilingualGrammar
        {...baseProps}
        grammarList={[{ id: "g1", title: "<b>Đậm</b>", content: "không dùng" }]}
      />,
    );
    // Title có HTML → dùng làm nội dung HTML, không hiển thị title text
    expect(screen.queryByText("<b>Đậm</b>")).not.toBeInTheDocument();
    expect(document.querySelector(".grammar-html-renderer b")).toHaveTextContent("Đậm");
  });
});
