import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PremiumGate } from "@/components/PremiumGate";

vi.mock("next/link", () => {
  return {
    default: ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe("PremiumGate", () => {
  it("does not render content when closed", () => {
    render(<PremiumGate isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText("Tính năng Premium")).not.toBeInTheDocument();
  });

  it("renders default feature text", () => {
    render(<PremiumGate isOpen onClose={() => {}} />);
    expect(screen.getByText("Tính năng Premium")).toBeInTheDocument();
    expect(screen.getByText(/Để truy cập tính năng này/)).toBeInTheDocument();
  });

  it("renders custom feature and description", () => {
    render(
      <PremiumGate
        isOpen
        onClose={() => {}}
        feature="AI Luyện nói"
        description="Bạn cần Premium để luyện nói"
      />,
    );
    // Khi description được cung cấp, nó thay thế hoàn toàn template mặc định
    expect(screen.getByText("Bạn cần Premium để luyện nói")).toBeInTheDocument();
    expect(screen.queryByText(/Để truy cập/)).not.toBeInTheDocument();
  });

  it("lists premium features", () => {
    render(<PremiumGate isOpen onClose={() => {}} />);
    expect(screen.getByText("Video bài giảng không giới hạn")).toBeInTheDocument();
    expect(screen.getByText("AI Luyện nói không giới hạn lượt")).toBeInTheDocument();
  });

  it("links to pricing page", () => {
    render(<PremiumGate isOpen onClose={() => {}} />);
    const link = screen.getByRole("link", { name: /nâng cấp premium ngay/i });
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("calls onClose when closing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PremiumGate isOpen onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /để sau/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
