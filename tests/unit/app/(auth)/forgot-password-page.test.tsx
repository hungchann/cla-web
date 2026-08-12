import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import * as apiService from "@/api/apiService";

vi.mock("@/api/apiService", async (importOriginal) => {
  const actual = await importOriginal<typeof apiService>();
  return {
    ...actual,
    forgotPassword: vi.fn(),
  };
});

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.mocked(apiService.forgotPassword).mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders the form", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: "Khôi Phục Mật Khẩu" })).toBeInTheDocument();
    expect(screen.getByLabelText("Địa chỉ Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /gửi email khôi phục/i })).toBeInTheDocument();
  });

  it("sends email and shows success", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Địa chỉ Email"), "an@example.com");
    await user.click(screen.getByRole("button", { name: /gửi email khôi phục/i }));

    expect(apiService.forgotPassword).toHaveBeenCalledWith("an@example.com");
    expect(
      await screen.findByText(/Yêu cầu đã được gửi thành công/),
    ).toBeInTheDocument();
  });

  it("shows error when request fails", async () => {
    vi.mocked(apiService.forgotPassword).mockRejectedValue(
      new Error("Email không tồn tại"),
    );
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Địa chỉ Email"), "an@example.com");
    await user.click(screen.getByRole("button", { name: /gửi email khôi phục/i }));

    expect(await screen.findByText("Email không tồn tại")).toBeInTheDocument();
  });

  it("shows default error message for unknown errors", async () => {
    vi.mocked(apiService.forgotPassword).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Địa chỉ Email"), "an@example.com");
    await user.click(screen.getByRole("button", { name: /gửi email khôi phục/i }));

    expect(await screen.findByText("boom")).toBeInTheDocument();
  });

  it("links back to sign-in after success", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Địa chỉ Email"), "an@example.com");
    await user.click(screen.getByRole("button", { name: /gửi email khôi phục/i }));

    const link = await screen.findByRole("link", { name: /quay lại đăng nhập/i });
    expect(link).toHaveAttribute("href", "/sign-in");
  });
});
