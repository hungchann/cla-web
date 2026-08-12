import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinyinToggle } from "@/components/PinyinToggle";

describe("PinyinToggle", () => {
  it("shows 'Hiện Pinyin' when closed", () => {
    render(<PinyinToggle isOpen={false} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Hiện Pinyin" })).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("shows 'Ẩn Pinyin' when open", () => {
    render(<PinyinToggle isOpen={true} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Ẩn Pinyin" })).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange with inverted value on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PinyinToggle isOpen={false} onChange={onChange} />);

    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange(false) when currently open", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PinyinToggle isOpen={true} onChange={onChange} />);

    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
