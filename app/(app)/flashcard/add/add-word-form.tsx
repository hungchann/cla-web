"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notebookApi } from "@/api/notebook";
import { useNotebookDecks } from "@/components/notebook/SaveToNotebook";
import { Folder, Plus } from "lucide-react";

// Mock Dictionary for autocomplete
const DICTIONARY_DB: Record<string, {
  simplified: string;
  traditional: string;
  meaning: string;
  pinyin: string;
  type: string;
  example: string;
  examplePinyin: string;
  exampleMeaning: string;
}> = {
  "爱": {
    simplified: "爱",
    traditional: "愛",
    meaning: "Yêu, yêu thương, thích",
    pinyin: "ài",
    type: "Động từ",
    example: "我爱你。",
    examplePinyin: "Wǒ ài nǐ.",
    exampleMeaning: "Tôi yêu bạn.",
  },
  "学习": {
    simplified: "学习",
    traditional: "學習",
    meaning: "Học tập, nghiên cứu",
    pinyin: "xuéxí",
    type: "Động từ",
    example: "我们学习汉语。",
    examplePinyin: "Wǒmen xuéxí Hànyǔ.",
    exampleMeaning: "Chúng tôi học tiếng Trung.",
  },
  "电脑": {
    simplified: "电脑",
    traditional: "電腦",
    meaning: "Máy tính, máy vi tính",
    pinyin: "diànnǎo",
    type: "Danh từ",
    example: "我的电脑坏了。",
    examplePinyin: "Wǒ de diànnǎo huài le.",
    exampleMeaning: "Máy tính của tôi hỏng rồi.",
  }
};

export default function AddWordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form states
  const [searchKey, setSearchKey] = useState("");
  const [simplified, setSimplified] = useState("");
  const [traditional, setTraditional] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [wordType, setWordType] = useState("");
  const [example, setExample] = useState("");
  const [examplePinyin, setExamplePinyin] = useState("");
  const [exampleMeaning, setExampleMeaning] = useState("");

  // Notebook selection
  const {
    decks,
    loading: loadingDecks,
    creating,
    createDeck,
    message,
    setMessage,
    loadDecks,
  } = useNotebookDecks();
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadDecks();
      if (cancelled || loaded.length === 0) return;
      const paramNotebookId = searchParams.get("notebookId");
      const paramNotebookTitle = searchParams.get("notebook");
      const matched = loaded.find(
        (d) => d.id === paramNotebookId || d.title.toLowerCase() === paramNotebookTitle?.toLowerCase(),
      );
      setSelectedDeckId((prev) => prev || matched?.id || loaded[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDecks, searchParams]);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    const deck = await createDeck(newTitle);
    if (!deck) return;
    setNewTitle("");
    setShowCreate(false);
    setSelectedDeckId(deck.id);
  };

  const handleSearchChange = (val: string) => {
    setSearchKey(val);

    // Auto-fill logic based on dictionary
    const match = DICTIONARY_DB[val.trim()];
    if (match) {
      setSimplified(match.simplified);
      setTraditional(match.traditional);
      setMeaning(match.meaning);
      setPinyin(match.pinyin);
      setWordType(match.type);
      setExample(match.example);
      setExamplePinyin(match.examplePinyin);
      setExampleMeaning(match.exampleMeaning);
    }
  };

  const handleSave = async () => {
    if (!selectedDeckId) {
      alert("Vui lòng tạo một sổ tay từ vựng trước khi thêm từ!");
      return;
    }
    if (!simplified.trim()) {
      alert("Vui lòng nhập từ chữ Hán cần thêm!");
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      await notebookApi.createVocabItemInPersonalDeck(
        selectedDeckId,
        simplified,
        pinyin,
        meaning,
        example,
        exampleMeaning
      );
      const chosenDeck = decks.find((d) => d.id === selectedDeckId);
      alert(`Đã lưu từ vựng vào sổ tay "${chosenDeck?.title || "của bạn"}" thành công!`);
      router.push(`/flashcard/study?notebook=${encodeURIComponent(chosenDeck?.title || "")}`);
    } catch (err) {
      console.error("Failed to create vocabulary item in notebook:", err);
      setMessage({ type: "error", text: "Không thể lưu từ vựng, vui lòng thử lại!" });
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="flex-1 flex flex-col gap-6">
        <div className="p-6 md:p-8 space-y-6 max-w-2xl w-full mx-auto flex-1">
          
          {/* Form input fields */}
          <div className="space-y-6">
            
            {/* Title header bar */}
            <div className="bg-[#f59e0b] text-gray-950 font-black py-3.5 px-6 rounded-2xl text-center shadow-xs text-sm uppercase tracking-wide">
              Thêm Từ Mới Vào Sổ Tay
            </div>

            {message && (
              <div className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600"
              }`}>
                {message.text}
              </div>
            )}

            {/* Form grid */}
            <div className="space-y-4 text-xs font-bold text-gray-700">
              
              {/* Select Notebook */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-wider text-[10px]">Chọn sổ tay từ vựng</label>
                {loadingDecks ? (
                  <div className="text-xs text-zinc-400 font-semibold p-2 animate-pulse bg-zinc-50 rounded-xl">Đang tải danh sách sổ tay...</div>
                ) : decks.length === 0 ? (
                  <div className="text-xs text-zinc-500 font-semibold p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                    Bạn chưa có sổ tay nào. Hãy tạo sổ tay mới bên dưới!
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {decks.map((deck) => (
                      <button
                        key={deck.id}
                        type="button"
                        onClick={() => setSelectedDeckId(deck.id)}
                        className={`w-full text-left py-2.5 px-3 rounded-xl border font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                          selectedDeckId === deck.id
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-300 hover:border-amber-300"
                        }`}
                      >
                        <Folder className="w-4 h-4 shrink-0" />
                        <span className="truncate">{deck.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showCreate ? (
                  <form onSubmit={handleCreateDeck} className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Tên sổ tay mới..."
                      disabled={creating}
                      autoFocus
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs bg-white dark:bg-zinc-950 focus:border-amber-500 focus:outline-none dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={creating || !newTitle.trim()}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer border-none"
                    >
                      {creating ? "..." : "Tạo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-bold cursor-pointer bg-transparent text-zinc-500"
                    >
                      Hủy
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="mt-1 py-2 border border-dashed border-amber-500/40 rounded-xl text-amber-600 dark:text-amber-500 hover:bg-amber-500/5 text-xs font-bold transition-colors cursor-pointer bg-transparent flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tạo sổ tay mới
                  </button>
                )}
              </div>

              {/* Search input field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-wider text-[10px]">Thêm từ mới (Chữ Hán)</label>
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Nhập từ chữ Hán cần thêm..."
                  className="w-full border border-gray-250 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Simplified & Traditional fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Từ vựng (Giản thể)</label>
                  <input
                    type="text"
                    value={simplified}
                    onChange={(e) => setSimplified(e.target.value)}
                    placeholder="Giản thể"
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Từ vựng (Phồn thể)</label>
                  <input
                    type="text"
                    value={traditional}
                    onChange={(e) => setTraditional(e.target.value)}
                    placeholder="Phồn thể"
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Word Meaning */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nghĩa của từ</label>
                <input
                  type="text"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="Nghĩa của từ"
                  className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Pinyin & Word Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Pinyin</label>
                  <input
                    type="text"
                    value={pinyin}
                    onChange={(e) => setPinyin(e.target.value)}
                    placeholder="Pinyin"
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Từ loại</label>
                  <input
                    type="text"
                    value={wordType}
                    onChange={(e) => setWordType(e.target.value)}
                    placeholder="Từ loại"
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Example & Example Pinyin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Ví dụ</label>
                  <input
                    type="text"
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder="Ví dụ"
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 uppercase tracking-wider text-[10px]">Pinyin của ví dụ</label>
                  <input
                    type="text"
                    value={examplePinyin}
                    onChange={(e) => setExamplePinyin(e.target.value)}
                    placeholder="Pinyin của ví dụ"
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Example Meaning */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-wider text-[10px]">Nghĩa của ví dụ</label>
                <input
                  type="text"
                  value={exampleMeaning}
                  onChange={(e) => setExampleMeaning(e.target.value)}
                  placeholder="Nghĩa của ví dụ"
                  className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  disabled={isSaving || !selectedDeckId}
                  onClick={handleSave}
                  className="w-full bg-[#f59e0b] hover:bg-amber-600 disabled:bg-zinc-300 disabled:text-zinc-550 disabled:cursor-not-allowed text-gray-950 font-black py-3.5 px-6 rounded-2xl text-center shadow-xs text-sm uppercase tracking-wide cursor-pointer transition-all active:scale-[0.99] flex items-center justify-center"
                >
                  {isSaving ? "Đang lưu..." : "Lưu vào sổ tay"}
                </button>
              </div>

            </div>
          </div>

      </div>
    </div>
  );
}
