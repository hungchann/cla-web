"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const handleSave = () => {
    alert("Đã lưu từ vựng vào sổ tay Thanh Hà!");
    router.push("/flashcard/study?notebook=Thanh Hà");
  };



  return (
    <div className="flex-1 flex flex-col gap-6">
        <div className="p-6 md:p-8 space-y-6 max-w-4xl w-full mx-auto flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Note sidebar in the layout */}
          <div className="md:col-span-1 space-y-4 pr-2">
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl text-xs leading-relaxed text-amber-900 font-bold space-y-3 shadow-2xs">
              <div className="text-sm font-bold flex items-center gap-1 text-amber-700">
                💡 Note
              </div>
              <p className="font-semibold text-gray-600">
                Note: sau khi người dùng gõ thêm từ mới xong, các phần bên dưới sẽ tự động hiện ra dựa theo file từ điển có sẵn, sau đó người dùng được tự do chỉnh sửa thông tin.
              </p>
              <p className="text-[10px] text-gray-400 font-normal">
                Thử gõ các từ như: &quot;爱&quot;, &quot;学习&quot; hoặc &quot;电脑&quot; để trải nghiệm tính năng điền tự động.
              </p>
            </div>
          </div>

          {/* Form input fields */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Title header bar */}
            <div className="bg-[#f59e0b] text-gray-950 font-black py-3 px-6 rounded-xl text-center shadow-xs text-sm uppercase tracking-wide">
              Thanh Hà
            </div>

            {/* Form grid */}
            <div className="space-y-4 text-xs font-bold text-gray-700">
              
              {/* Search input field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase tracking-wider text-[10px]">Thêm từ mới</label>
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
                  onClick={handleSave}
                  className="w-full bg-[#f59e0b] hover:bg-amber-600 text-gray-950 font-black py-3 px-6 rounded-xl text-center shadow-xs text-sm uppercase tracking-wide cursor-pointer transition-all active:scale-[0.99]"
                >
                  Lưu vào sổ tay
                </button>
              </div>

            </div>
          </div>

      </div>
    </div>
  );
}
