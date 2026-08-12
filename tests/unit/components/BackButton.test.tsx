import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackButton } from "@/components/BackButton";

const routerBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: routerBack }),
}));

vi.mock("next/link", () => {
  return {
    default: ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe("BackButton", () => {
  it("renders default label", () => {
    render(<BackButton />);
    expect(screen.getByText("Quay lại")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<BackButton label="Về trang chủ" />);
    expect(screen.getByText("Về trang chủ")).toBeInTheDocument();
  });

  it("renders as link when href provided", () => {
    render(<BackButton href="/bilingual" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/bilingual");
  });

  it("renders as button and calls router.back when no href", async () => {
    const user = userEvent.setup();
    render(<BackButton />);

    await user.click(screen.getByRole("button"));
    expect(routerBack).toHaveBeenCalled();
  });
});
