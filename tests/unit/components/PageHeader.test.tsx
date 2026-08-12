import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/PageHeader";

describe("PageHeader", () => {
  it("renders title and description", () => {
    render(<PageHeader title="Dashboard" description="Chào mừng" />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Chào mừng")).toBeInTheDocument();
  });

  it("renders without description", () => {
    render(<PageHeader title="Chỉ tiêu đề" />);
    expect(screen.getByRole("heading", { name: "Chỉ tiêu đề" })).toBeInTheDocument();
    expect(screen.queryByText("Chào mừng")).not.toBeInTheDocument();
  });

  it("renders icon", () => {
    render(<PageHeader title="X" icon={<span data-testid="icon-test">🔥</span>} />);
    expect(screen.getByTestId("icon-test")).toBeInTheDocument();
  });

  it("renders action", () => {
    render(<PageHeader title="X" action={<button>Hành động</button>} />);
    expect(screen.getByRole("button", { name: "Hành động" })).toBeInTheDocument();
  });
});
