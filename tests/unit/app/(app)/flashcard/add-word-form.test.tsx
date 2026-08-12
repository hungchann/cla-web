import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddWordForm from "@/app/(app)/flashcard/add/add-word-form";
import * as notebookApi from "@/api/notebook";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/api/notebook", async (importOriginal) => {
  const actual = await importOriginal<typeof notebookApi>();
  return {
    ...actual,
    notebookApi: {
      ...actual.notebookApi,
      getPersonalNotebooks: vi.fn(),
      createVocabItemInPersonalDeck: vi.fn(),
    },
  };
});

const DECKS = [
  { id: "deck-1", title: "Từ vựng HSK 1" },
  { id: "deck-2", title: "Sổ tay riêng" },
];

describe("AddWordForm", () => {
  beforeEach(() => {
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue(DECKS);
    vi.mocked(notebookApi.notebookApi.createVocabItemInPersonalDeck).mockResolvedValue({ id: "x" });
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("loads personal decks into selector", async () => {
    render(<AddWordForm />);
    const select = await screen.findByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(notebookApi.notebookApi.getPersonalNotebooks).toHaveBeenCalled();
  });

  it("shows empty deck warning when no decks", async () => {
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue([]);
    render(<AddWordForm />);
    expect(
      await screen.findByText((content) => content.includes("sổ tay nào")),
    ).toBeInTheDocument();
  });

  it("autofills fields when searching a dictionary word", async () => {
    const user = userEvent.setup();
    render(<AddWordForm />);
    await screen.findByRole("combobox");

    await user.type(screen.getByPlaceholderText("Nhập từ chữ Hán cần thêm..."), "爱");

    // 爱 xuất hiện ở cả ô search lẫn ô giản thể → dùng getAllByDisplayValue
    expect(screen.getAllByDisplayValue("爱").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue("愛")).toBeInTheDocument(); // phồn thể
    expect(screen.getByDisplayValue("Yêu, yêu thương, thích")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ài")).toBeInTheDocument();
  });

  it("saves word to selected deck", async () => {
    const user = userEvent.setup();
    render(<AddWordForm />);
    await screen.findByRole("combobox");

    await user.type(screen.getByPlaceholderText("Nhập từ chữ Hán cần thêm..."), "爱");
    await user.click(screen.getByRole("button", { name: /lưu vào sổ tay/i }));

    await waitFor(() => {
      expect(notebookApi.notebookApi.createVocabItemInPersonalDeck).toHaveBeenCalledWith(
        "deck-1",
        "爱",
        "ài",
        "Yêu, yêu thương, thích",
        "我爱你。",
        "Tôi yêu bạn.",
      );
    });
    expect(routerPush).toHaveBeenCalledWith(
      "/flashcard/study?notebook=" + encodeURIComponent("Từ vựng HSK 1"),
    );
  });

  it("disables save button when no decks available", async () => {
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue([]);
    render(<AddWordForm />);
    // Chờ loading decks xong (render thông báo không có sổ tay)
    await screen.findByText((content) => content.includes("sổ tay nào"));

    const saveBtn = screen.getByRole("button", { name: /lưu vào sổ tay/i });
    expect(saveBtn).toBeDisabled();
  });

  it("alerts when save fails", async () => {
    vi.mocked(notebookApi.notebookApi.createVocabItemInPersonalDeck).mockRejectedValue(
      new Error("boom"),
    );
    const user = userEvent.setup();
    render(<AddWordForm />);
    await screen.findByRole("combobox");

    await user.type(screen.getByPlaceholderText("Nhập từ chữ Hán cần thêm..."), "爱");
    await user.click(screen.getByRole("button", { name: /lưu vào sổ tay/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Không thể lưu từ vựng, vui lòng thử lại!");
    });
  });
});
