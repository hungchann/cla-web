"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notebookApi } from "@/api/notebook";
import Link from "next/link";

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

export default function AddWordPage() {
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

  // Notebook selection states
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNotebooks = async () => {
      setLoadingDecks(true);
      try {
        const response = await notebookApi.getPersonalNotebooks();
        const personalDecks = Array.isArray(response) ? response : [];
        setDecks(personalDecks);

        // Pre-select matching notebook from search parameters if specified
        const paramNotebookId = searchParams.get("notebookId");
        const paramNotebookTitle = searchParams.get("notebook");
        
        const matched = personalDecks.find(
          (d) => d.id === paramNotebookId || d.title.toLowerCase() === paramNotebookTitle?.toLowerCase()
        );
        
        if (matched) {
          setSelectedDeckId(matched.id);
        } else if (personalDecks.length > 0) {
          setSelectedDeckId(personalDecks[0].id);
        }
      } catch (err) {
        console.error("Failed to load personal notebooks:", err);
      } finally {
        setLoadingDecks(false);
      }
    };
    fetchNotebooks();
  }, [searchParams]);

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
      router.push(`/flashcard/study?notebook=${encodeURIComponent(chosenDeck?.title || "Thanh Hà")}`);
    } catch (err) {
      console.error("Failed to create vocabulary item in notebook:", err);
      alert("Không thể lưu từ vựng, vui lòng thử lại!");
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

            {/* Form grid */}
            <div className="space-y-4 text-xs font-bold text-gray-700">
              
              {/* Select Notebook dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-wider text-[10px]">Chọn sổ tay từ vựng</label>
                {loadingDecks ? (
                  <div className="text-xs text-zinc-400 font-semibold p-2 animate-pulse bg-zinc-50 rounded-xl">Đang tải danh sách sổ tay...</div>
                ) : decks.length === 0 ? (
                  <div className="text-xs text-rose-500 font-bold p-2 bg-rose-50 border border-rose-200 rounded-xl font-sans">
                    Bạn chưa có sổ tay nào. Vui lòng quay lại <Link href="/flashcard" className="underline hover:text-rose-600">Trang chủ Flashcard</Link> để tạo mới sổ tay trước!
                  </div>
                ) : (
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-3 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-gray-800 dark:text-zinc-200"
                  >
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.title}
                      </option>
                    ))}
                  </select>
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
                  disabled={isSaving || decks.length === 0}
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
