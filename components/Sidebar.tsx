"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ClipboardList, FolderOpen, Globe, FileText, User, LogOut, Phone } from "lucide-react";
import { tokenUtils } from "@/lib/utils/tokenUtils";

interface SidebarProps {
  view?: string;
  setView?: (view: string) => void;
  activeView?: string;
}

export default function Sidebar({
  view = "",
  setView = () => {},
  activeView,
}: Readonly<SidebarProps>) {
  const handleLogout = async () => {
    try {
      const { logoutUser } = await import("@/api/apiService");
      await logoutUser();
    } catch (e) {
      console.error("Failed to call logoutUser in Sidebar", e);
      await tokenUtils.clearAllTokens();
    }
    window.location.replace("/sign-in");
  };
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

  const renderContent = () => {
    if (isBilingualMode) {
      return (
        <div className="space-y-6 text-zinc-700 dark:text-zinc-300 font-medium">
          {/* Trình độ (HSK Levels) */}
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-zinc-900 dark:text-zinc-100">
              <ClipboardList className="w-4 h-4 text-zinc-550" /> Trình độ
            </h3>
            <ul className="space-y-3.5 text-sm pl-1">
              {[
                { key: "hsk1", label: "HSK 1" },
                { key: "hsk2", label: "HSK 2" },
                { key: "hsk3", label: "HSK 3" },
                { key: "hsk4", label: "HSK 4" },
                { key: "hsk5", label: "HSK 5" },
                { key: "hsk6", label: "HSK 6" },
              ].map((item) => (
                <li key={item.key} className="flex items-center gap-3">
                  <Checkbox
                    id={`hsk-${item.key}`}
                    checked={hskLevels[item.key as keyof typeof hskLevels]}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      setHskLevels({ ...hskLevels, [item.key]: !!checked })
                    }
                  />
                  <Label htmlFor={`hsk-${item.key}`} className="cursor-pointer font-medium">
                    {item.label}
                  </Label>
                </li>
              ))}
            </ul>
          </div>

          {/* Chủ đề (Topics) */}
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-zinc-900 dark:text-zinc-100">
              <FolderOpen className="w-4 h-4 text-zinc-550" /> Chủ đề
            </h3>
            <ul className="space-y-3.5 text-sm pl-1">
              {[
                { key: "culture", label: "Văn hóa" },
                { key: "economy", label: "Kinh tế" },
                { key: "hskk", label: "HSKK" },
                { key: "life", label: "Cuộc sống" },
              ].map((item) => (
                <li key={item.key} className="flex items-center gap-3">
                  <Checkbox
                    id={`topic-${item.key}`}
                    checked={topics[item.key as keyof typeof topics]}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      setTopics({ ...topics, [item.key]: !!checked })
                    }
                  />
                  <Label htmlFor={`topic-${item.key}`} className="cursor-pointer font-medium">
                    {item.label}
                  </Label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (isStudyMode) {
      return (
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300 font-medium">
          {/* Learning Subtopics */}
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Bài 1: Phát âm</h3>
          <ul className="space-y-1.5 text-sm pl-1">
            {learnSteps.map((stepItem) => {
              const isActive = view === stepItem.id;
              return (
                <li key={stepItem.id}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => setView(stepItem.id)}
                    className={`w-full justify-start font-semibold text-xs py-1.5 h-auto ${
                      isActive
                        ? "text-amber-600 bg-amber-500/10 hover:bg-amber-500/15"
                        : "text-zinc-650 hover:text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    • {stepItem.name}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-zinc-700 dark:text-zinc-300 font-medium">
        {/* Cấp độ */}
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-zinc-900 dark:text-zinc-100">
            <Globe className="w-4 h-4 text-zinc-550" /> Cấp độ
          </h3>
          <ul className="space-y-3.5 text-sm pl-1">
            <li className="flex items-center gap-3">
              <Checkbox
                id="lvl-beg"
                checked={levels.beginner}
                onCheckedChange={(checked: boolean | "indeterminate") => setLevels({ ...levels, beginner: !!checked })}
              />
              <Label htmlFor="lvl-beg" className="cursor-pointer font-medium">Sơ cấp</Label>
            </li>
            <li className="flex items-center gap-3">
              <Checkbox
                id="lvl-int"
                checked={levels.intermediate}
                onCheckedChange={(checked: boolean | "indeterminate") => setLevels({ ...levels, intermediate: !!checked })}
              />
              <Label htmlFor="lvl-int" className="cursor-pointer font-medium">Trung Cấp</Label>
            </li>
            <li className="flex items-center gap-3">
              <Checkbox
                id="lvl-adv"
                checked={levels.advanced}
                onCheckedChange={(checked: boolean | "indeterminate") => setLevels({ ...levels, advanced: !!checked })}
              />
              <Label htmlFor="lvl-adv" className="cursor-pointer font-medium">Cao cấp</Label>
            </li>
          </ul>
        </div>

        {/* Thể loại */}
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-zinc-900 dark:text-zinc-100">
            <FileText className="w-4 h-4 text-zinc-550" /> Thể loại
          </h3>
          <ul className="space-y-3.5 text-sm pl-1">
            <li className="flex items-center gap-3">
              <Checkbox
                id="type-simp"
                checked={types.simplified}
                onCheckedChange={(checked: boolean | "indeterminate") => setTypes({ ...types, simplified: !!checked })}
              />
              <Label htmlFor="type-simp" className="cursor-pointer font-medium">Giản thể (TQ Đại Lục)</Label>
            </li>
            <li className="flex items-center gap-3">
              <Checkbox
                id="type-trad"
                checked={types.traditional}
                onCheckedChange={(checked: boolean | "indeterminate") => setTypes({ ...types, traditional: !!checked })}
              />
              <Label htmlFor="type-trad" className="cursor-pointer font-medium">Phồn thể (Đài Loan)</Label>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 min-h-screen bg-zinc-50 border-r border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 p-5 flex flex-col justify-between shrink-0 select-none shadow-xs">
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
            <span className="text-xs font-black tracking-widest text-amber-500">SUN</span>
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider">CHINESE</span>
          </div>
        </button>

        {/* Home Button Pill */}
        <Button
          onClick={() => setView("home")}
          className="flex items-center gap-2 bg-[#f59e0b] hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-full shadow-xs mb-6 transition-all duration-200 cursor-pointer w-full justify-start text-left"
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
        </Button>

        {/* Conditional Content */}
        {renderContent()}
      </div>

      {/* Bottom links */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2.5 text-sm text-zinc-650 dark:text-zinc-400 font-semibold">
        <Button
          variant="ghost"
          onClick={() => setView("home")}
          className="flex items-center gap-2.5 hover:text-amber-600 justify-start w-full text-left h-auto py-1.5"
        >
          <User className="w-4 h-4 text-zinc-500" /> Tài khoản
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-2.5 hover:text-amber-600 justify-start w-full text-left h-auto py-1.5"
        >
          <LogOut className="w-4 h-4 text-zinc-500" /> Đăng xuất
        </Button>
        <Button
          variant="ghost"
          onClick={() => setView("home")}
          className="flex items-center gap-2.5 hover:text-amber-600 justify-start w-full text-left h-auto py-1.5"
        >
          <Phone className="w-4 h-4 text-zinc-500" /> Liên hệ
        </Button>
      </div>
    </aside>
  );
}
