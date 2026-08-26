import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WordInfoModal } from "@/components/video/WordInfoModal";
import * as notebookApi from "@/api/notebook";

const guardPremiumMock = vi.fn(() => true);

vi.mock("@/lib/hooks/usePremiumGate", () => ({
  usePremiumGate: () => ({
    isPremium: true,
    loading: false,
    isLocked: false,
    premiumModalVisible: false,
    setPremiumModalVisible: vi.fn(),
    showPremiumModal: vi.fn(),
    guardPremium: (...args: unknown[]) => guardPremiumMock(...(args as [])),
  }),
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

const WORD_INFO = {
  word: "你好",
  pinyin: "nǐ hǎo",
  meanings: ["Xin chào", "Chào bạn"],
  traditional: "你好",
  simplified: "你好",
};

const baseProps = {
  isVisible: true,
  onClose: vi.fn(),
  selectedWord: "你好",
  wordInfo: WORD_INFO,
  isLoading: false,
};

describe("WordInfoModal", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.cookie = "";
    guardPremiumMock.mockReset();
    guardPremiumMock.mockImplementation(() => true);
    vi.restoreAllMocks();
  });

  it("returns null when not visible", () => {
    const { container } = render(<WordInfoModal {...baseProps} isVisible={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows loading spinner when isLoading", () => {
    render(<WordInfoModal {...baseProps} isLoading wordInfo={null} />);
    expect(screen.getByText("Đang tải...")).toBeInTheDocument();
  });

  it("shows word info meanings", () => {
    render(<WordInfoModal {...baseProps} />);
    expect(screen.getByText(/Xin chào, Chào bạn/)).toBeInTheDocument();
    expect(screen.getByText(/Phồn thể/)).toBeInTheDocument();
  });

  it("shows not-found message when wordInfo null", () => {
    render(<WordInfoModal {...baseProps} wordInfo={null} />);
    expect(screen.getByText("Không tìm thấy thông tin từ này.")).toBeInTheDocument();
  });

  it("calls onClose when clicking Đóng", async () => {
    const user = userEvent.setup();
    render(<WordInfoModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /đóng/i }));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("requires login before showing save button flow", async () => {
    const user = userEvent.setup();
    render(<WordInfoModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /lưu từ vào flashcard/i }));
    expect(screen.getByText(/vui lòng đăng nhập để lưu flashcard/i)).toBeInTheDocument();
  });

  it("blocks saving for non-premium user without loading decks (premium gate)", async () => {
    guardPremiumMock.mockReturnValue(false);
    const user = userEvent.setup();
    localStorage.setItem("user_data", JSON.stringify({ id: "u1" }));
    render(<WordInfoModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /lưu từ vào flashcard/i }));

    expect(notebookApi.notebookApi.getPersonalNotebooks).not.toHaveBeenCalled();
    expect(screen.queryByText(/chọn bộ flashcard/i)).not.toBeInTheDocument();
  });

  it("loads personal decks when logged in and saves word to selected deck", async () => {
    const user = userEvent.setup();
    localStorage.setItem("user_data", JSON.stringify({ id: "u1" }));
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue([
      { id: "deck-1", title: "Từ vựng HSK 1" },
    ]);
    vi.mocked(notebookApi.notebookApi.createVocabItemInPersonalDeck).mockResolvedValue({ id: "x" });

    render(<WordInfoModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /lưu từ vào flashcard/i }));
    await screen.findByText(/Từ vựng HSK 1/);

    await user.click(screen.getByRole("button", { name: /từ vựng hsk 1/i }));

    await waitFor(() => {
      expect(notebookApi.notebookApi.createVocabItemInPersonalDeck).toHaveBeenCalledWith(
        "deck-1",
        "你好",
        "nǐ hǎo",
        "Xin chào, Chào bạn",
      );
    });
    expect(await screen.findByText(/Đã lưu vào bộ "Từ vựng HSK 1"/)).toBeInTheDocument();
  });

  it("creates a new deck and saves word", async () => {
    const user = userEvent.setup();
    localStorage.setItem("user_data", JSON.stringify({ id: "u1" }));
    vi.mocked(notebookApi.notebookApi.getPersonalNotebooks).mockResolvedValue([]);
    vi.mocked(notebookApi.notebookApi.createNoteBooks).mockResolvedValue({ id: "deck-new" });
    vi.mocked(notebookApi.notebookApi.createVocabItemInPersonalDeck).mockResolvedValue({ id: "x" });

    render(<WordInfoModal {...baseProps} />);

    await user.click(screen.getByRole("button", { name: /lưu từ vào flashcard/i }));
    await screen.findByText("Bạn chưa có bộ flashcard nào.");

    await user.click(screen.getByRole("button", { name: /tạo bộ từ mới/i }));
    await user.type(screen.getByPlaceholderText("Tên bộ từ mới..."), "Bộ mới");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));

    await waitFor(() => {
      expect(notebookApi.notebookApi.createNoteBooks).toHaveBeenCalledWith("Bộ mới");
    });
    expect(await screen.findByText(/Đã tạo bộ "Bộ mới" và lưu từ vựng/)).toBeInTheDocument();
  });
});
