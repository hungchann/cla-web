import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";
import * as apiService from "@/api/apiService";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/api/apiService", async (importOriginal) => {
  const actual = await importOriginal<typeof apiService>();
  return {
    ...actual,
    checkEmailExists: vi.fn(),
    RegisterUser: vi.fn(),
  };
});

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(apiService.checkEmailExists).mockResolvedValue(false);
    vi.mocked(apiService.RegisterUser).mockResolvedValue({ id: "new-user" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/Tên \*/), "An");
    await user.type(screen.getByLabelText("Email *"), "an@example.com");
    await user.type(screen.getByLabelText(/Mật khẩu \*/), "123456");
    await user.click(screen.getByRole("button", { name: /đăng ký/i }));
  }

  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "Tạo Tài Khoản Mới" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên \*/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email *")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu \*/)).toBeInTheDocument();
  });

  it("checks email existence before registering", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(apiService.checkEmailExists).toHaveBeenCalledWith("an@example.com");
      expect(apiService.RegisterUser).toHaveBeenCalledWith("an@example.com", "123456", "An", "");
    });
  });

  it("shows error when email already exists", async () => {
    vi.mocked(apiService.checkEmailExists).mockResolvedValue(true);
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmit(user);

    expect(
      await screen.findByText(/Tài khoản đã tồn tại. Vui lòng đăng nhập/),
    ).toBeInTheDocument();
    expect(apiService.RegisterUser).not.toHaveBeenCalled();
  });

  it("shows success message after registration", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmit(user);

    expect(
      await screen.findByText(/Đăng ký thành công! Đang chuyển bạn đến trang đăng nhập/),
    ).toBeInTheDocument();
  });

  it("shows error message when registration fails", async () => {
    vi.mocked(apiService.RegisterUser).mockRejectedValue(new Error("Đăng ký thất bại"));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillAndSubmit(user);

    expect(await screen.findByText("Đăng ký thất bại")).toBeInTheDocument();
  });
});
