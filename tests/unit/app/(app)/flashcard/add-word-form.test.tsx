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
      createNoteBooks: vi.fn(),
    },
  };
});

const DECKS = [
  { id: "deck-1", title: "Từ vựng HSK 1" },
  { id: "deck-2", title: "Sổ tay riêng" },
];

describe("AddWordForm", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue(DECKS);
    vi.mocked(notebookApi.notebookApi.createVocabItemInPersonalDeck).mockResolvedValue({ id: "x" });
    vi.mocked(notebookApi.notebookApi.createNoteBooks).mockResolvedValue({ id: "deck-new", title: "Bộ mới" });
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("loads personal notebooks and preselects the first one", async () => {
    render(<AddWordForm />);
    expect(await screen.findByRole("button", { name: /từ vựng hsk 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sổ tay riêng/i })).toBeInTheDocument();
    expect(notebookApi.notebookApi.getPersonalNotebooks).toHaveBeenCalled();
  });

  it("shows empty deck warning when no notebooks", async () => {
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue([]);
    render(<AddWordForm />);
    expect(
      await screen.findByText((content) => content.includes("sổ tay nào")),
    ).toBeInTheDocument();
  });

  it("autofills fields when searching a dictionary word", async () => {
    const user = userEvent.setup();
    render(<AddWordForm />);
    await screen.findByRole("button", { name: /từ vựng hsk 1/i });

    await user.type(screen.getByPlaceholderText("Nhập từ chữ Hán cần thêm..."), "爱");

    // 爱 xuất hiện ở cả ô search lẫn ô giản thể → dùng getAllByDisplayValue
    expect(screen.getAllByDisplayValue("爱").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue("愛")).toBeInTheDocument(); // phồn thể
    expect(screen.getByDisplayValue("Yêu, yêu thương, thích")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ài")).toBeInTheDocument();
  });

  it("saves word to selected notebook", async () => {
    const user = userEvent.setup();
    render(<AddWordForm />);
    await screen.findByRole("button", { name: /từ vựng hsk 1/i });

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

  it("disables save button when no notebooks available", async () => {
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue([]);
    render(<AddWordForm />);
    await screen.findByText((content) => content.includes("sổ tay nào"));

    const saveBtn = screen.getByRole("button", { name: /lưu vào sổ tay/i });
    expect(saveBtn).toBeDisabled();
  });

  it("shows error message when save fails", async () => {
    vi.mocked(notebookApi.notebookApi.createVocabItemInPersonalDeck).mockRejectedValue(
      new Error("boom"),
    );
    const user = userEvent.setup();
    render(<AddWordForm />);
    await screen.findByRole("button", { name: /từ vựng hsk 1/i });

    await user.type(screen.getByPlaceholderText("Nhập từ chữ Hán cần thêm..."), "爱");
    await user.click(screen.getByRole("button", { name: /lưu vào sổ tay/i }));

    expect(
      await screen.findByText("Không thể lưu từ vựng, vui lòng thử lại!"),
    ).toBeInTheDocument();
  });
});
