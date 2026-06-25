"use client";

import { useState } from "react";

interface SidebarProps {
  view: string;
  setView: (view: string) => void;
}

export default function Sidebar({ view, setView }: SidebarProps) {
  // Filter states for "courses" view
  const [levels, setLevels] = useState({
    beginner: true,
    intermediate: false,
    advanced: false,
  });

  const [types, setTypes] = useState({
    simplified: true,
    traditional: false,
  });

  // HSK filter states for bilingual views
  const [hskLevels, setHskLevels] = useState({
    hsk1: true,
    hsk2: false,
    hsk3: false,
    hsk4: false,
    hsk5: false,
    hsk6: false,
  });

  const [topics, setTopics] = useState({
    culture: false,
    economy: false,
    hskk: false,
    life: false,
  });

  const learnSteps = [
    { id: "learn-video-vocab", name: "Video từ vựng" },
    { id: "learn-quiz-vocab", name: "Bài tập: từ vựng" },
    { id: "learn-video-grammar", name: "Video ngữ pháp" },
    { id: "learn-quiz-grammar", name: "Bài tập: ngữ pháp" },
    { id: "learn-dictation", name: "Bài tập: Nghe chép chính tả" },
    { id: "learn-conversation", name: "Thực hành hội thoại" },
    { id: "learn-extra", name: "Bài tập bổ sung" },
  ];

  const isStudyMode = view.startsWith("learn");
  const isBilingualMode = view.startsWith("bilingual");

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-[#ffe5a3] via-[#ffa3d4] to-[#f9a8d4] p-5 flex flex-col justify-between shrink-0 select-none shadow-md">
      <div>
        {/* Logo */}
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 mb-8 group cursor-pointer text-left w-full"
        >
          <div className="relative flex items-center justify-center w-9 h-9 bg-amber-500 rounded-full shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-transform duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-white"
            >
              <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-black tracking-widest text-[#d97706]">SUN</span>
            <span className="text-[10px] font-bold text-gray-700 tracking-wider">CHINESE</span>
          </div>
        </button>

        {/* Home Button Pill */}
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 bg-[#f59e0b] hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-full shadow-sm mb-6 transition-all duration-200 cursor-pointer w-full text-left"
        >
          {/* Home Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M11.47 3.82a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-1.1-1.1V18a2.25 2.25 0 0 1-2.25 2.25h-5.25a.75.75 0 0 1-.75-.75V15a.75.75 0 0 0-.75-.75h-1.5A.75.75 0 0 0 8 15v4.5a.75.75 0 0 1-.75.75H2.25A2.25 2.25 0 0 1 0 18v-6.53l-1.1 1.1a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
          </svg>
          <span className="text-sm">Trang chủ</span>
        </button>

        {/* Conditional Content */}
        {isBilingualMode ? (
          /* Bilingual Mode Sidebar - HSK Level & Topic Filters */
          <div className="space-y-6 text-[#4a3656] font-medium">
            {/* Trình độ (HSK Levels) */}
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <span className="text-base">📋</span> Trình độ
              </h3>
              <ul className="space-y-2.5 text-sm pl-2">
                {[
                  { key: "hsk1", label: "HSK1" },
                  { key: "hsk2", label: "HSK2" },
                  { key: "hsk3", label: "HSK3" },
                  { key: "hsk4", label: "HSK4" },
                  { key: "hsk5", label: "HSK5" },
                  { key: "hsk6", label: "HSK6" },
                ].map((item) => (
                  <li key={item.key} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`hsk-${item.key}`}
                      checked={hskLevels[item.key as keyof typeof hskLevels]}
                      onChange={(e) =>
                        setHskLevels({ ...hskLevels, [item.key]: e.target.checked })
                      }
                      className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                    />
                    <label htmlFor={`hsk-${item.key}`} className="cursor-pointer select-none">
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chủ đề (Topics) */}
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <span className="text-base">📂</span> Chủ đề
              </h3>
              <ul className="space-y-2.5 text-sm pl-2">
                {[
                  { key: "culture", label: "Văn hóa" },
                  { key: "economy", label: "Kinh tế" },
                  { key: "hskk", label: "HSKK" },
                  { key: "life", label: "Cuộc sống" },
                ].map((item) => (
                  <li key={item.key} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`topic-${item.key}`}
                      checked={topics[item.key as keyof typeof topics]}
                      onChange={(e) =>
                        setTopics({ ...topics, [item.key]: e.target.checked })
                      }
                      className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                    />
                    <label htmlFor={`topic-${item.key}`} className="cursor-pointer select-none">
                      {item.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : !isStudyMode ? (
          <div className="space-y-6 text-[#4a3656] font-medium">
            {/* Cấp độ */}
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <span className="text-base">🌐</span> Cấp độ
              </h3>
              <ul className="space-y-2.5 text-sm pl-2">
                <li className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="lvl-beg"
                    checked={levels.beginner}
                    onChange={(e) => setLevels({ ...levels, beginner: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <label htmlFor="lvl-beg" className="cursor-pointer select-none">Sơ cấp</label>
                </li>
                <li className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="lvl-int"
                    checked={levels.intermediate}
                    onChange={(e) => setLevels({ ...levels, intermediate: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <label htmlFor="lvl-int" className="cursor-pointer select-none">Trung Cấp</label>
                </li>
                <li className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="lvl-adv"
                    checked={levels.advanced}
                    onChange={(e) => setLevels({ ...levels, advanced: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <label htmlFor="lvl-adv" className="cursor-pointer select-none">Cao cấp</label>
                </li>
              </ul>
            </div>

            {/* Thể loại */}
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <span className="text-base">📄</span> Thể loại
              </h3>
              <ul className="space-y-2.5 text-sm pl-2">
                <li className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="type-simp"
                    checked={types.simplified}
                    onChange={(e) => setTypes({ ...types, simplified: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <label htmlFor="type-simp" className="cursor-pointer select-none">Giản thể (TQ Đại Lục)</label>
                </li>
                <li className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="type-trad"
                    checked={types.traditional}
                    onChange={(e) => setTypes({ ...types, traditional: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm border-gray-300 text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <label htmlFor="type-trad" className="cursor-pointer select-none">Phồn thể (Đài Loan)</label>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-[#4a3656] font-medium">
            {/* Learning Subtopics */}
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Bài 1: Phát âm</h3>
            <ul className="space-y-2 text-sm pl-2">
              {learnSteps.map((stepItem) => {
                const isActive = view === stepItem.id;
                return (
                  <li key={stepItem.id}>
                    <button
                      onClick={() => setView(stepItem.id)}
                      className={`w-full text-left font-semibold py-1.5 px-2 rounded-md transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "text-[#d97706] bg-white/40 shadow-xs"
                          : "text-gray-700 hover:text-[#d97706] hover:bg-white/20"
                      }`}
                    >
                      • {stepItem.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom links */}
      <div className="border-t border-white/20 pt-4 space-y-3 text-sm text-[#4a3656] font-semibold">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 hover:text-[#d97706] transition-colors cursor-pointer w-full text-left"
        >
          <span>👤</span> Tài khoản
        </button>
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 hover:text-[#d97706] transition-colors cursor-pointer w-full text-left"
        >
          <span>🚪</span> Đăng xuất
        </button>
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 hover:text-[#d97706] transition-colors cursor-pointer w-full text-left"
        >
          <span>📞</span> Liên hệ
        </button>
      </div>
    </aside>
  );
}
