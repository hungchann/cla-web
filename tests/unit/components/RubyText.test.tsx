import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RubyText } from "@/components/RubyText";

describe("RubyText", () => {
  it("renders word and pinyin", () => {
    render(<RubyText word="你好" pinyin="nǐ hǎo" />);
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("nǐ")).toBeInTheDocument();
    expect(screen.getByText("hǎo")).toBeInTheDocument();
  });

  it("renders one rt per character when pinyin can be split", () => {
    render(<RubyText word="北方" pinyin="běifāng" />);
    const rts = document.querySelectorAll("rt");
    expect(rts).toHaveLength(2);
    expect(rts[0]).toHaveTextContent("běi");
    expect(rts[1]).toHaveTextContent("fāng");
  });

  it("keeps a single rt when pinyin cannot be split", () => {
    render(<RubyText word="我们的" pinyin="wǒmende" />);
    const rts = document.querySelectorAll("rt");
    expect(rts).toHaveLength(1);
    expect(rts[0]).toHaveTextContent("wǒmende");
  });

  it("does not render pinyin when absent", () => {
    render(<RubyText word="你好" />);
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.queryByText("nǐ hǎo")).not.toBeInTheDocument();
  });

  it("skips rt when pinyin is punctuation returned by segment API", () => {
    render(<RubyText word="，" pinyin="，" />);
    expect(screen.getByText("，")).toBeInTheDocument();
    expect(document.querySelector("rt")).toBeNull();
  });

  it("applies bold weight when bold is true", () => {
    render(<RubyText word="好" bold />);
    expect(screen.getByText("好")).toHaveStyle({ fontWeight: "700" });
  });

  it("renders as button with onPress and triggers click", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<RubyText word="好" onPress={onPress} />);

    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("renders as span when no onPress", () => {
    const { container } = render(<RubyText word="好" />);
    expect(container.querySelector("span")).not.toBeNull();
  });

  it("applies fontSize via style", () => {
    render(<RubyText word="好" fontSize={22} />);
    expect(screen.getByText("好")).toHaveStyle({ fontSize: "22px" });
  });
});
