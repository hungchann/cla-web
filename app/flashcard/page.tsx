"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function FlashcardDashboardPage() {
  const router = useRouter();
  
  // Active HSK tab
  const [activeHsk, setActiveHsk] = useState("HSK1");
  // Active TOCFL tab
  const [activeTocfl, setActiveTocfl] = useState("A1");

  const hskTabs = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6", "HSK 7-9"];
  const tocflTabs = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // Mock list of decks based on active tab
  const hskDecks = [
    { title: `150 từ vựng ${activeHsk}`, count: 150 },
    { title: "Địa điểm", count: 50 },
    { title: "Thói quen", count: 50 },
  ];

  const tocflDecks = [
    { title: `150 từ vựng C1`, count: 150 }, // Keep C1 as shown in screenshot even if tab changes for mock visual
    { title: "Địa điểm", count: 50 },
    { title: "Thói quen", count: 50 },
  ];

  const handleSetView = (newStep: string) => {
    if (newStep === "home") {
      router.push("/dashboard");
    } else if (newStep === "courses") {
      router.push("/courses");
    } else if (newStep === "bilingual-list") {
      router.push("/bilingual");
    }
  };

  const handleStudy = (notebookName: string) => {
    router.push(`/flashcard/study?notebook=${encodeURIComponent(notebookName)}`);
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white text-gray-800 flex-1 -m-4 sm:-m-6 lg:-m-8">
      {/* Sidebar */}
      <Sidebar view="flashcard" setView={handleSetView} />

      {/* Right Column Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header view="flashcard" setView={handleSetView} showLogo={false} />

        <div className="p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto flex-1 flex flex-col justify-start pb-20">
          
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Left Note sidebar block matching Image 5 */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl text-xs leading-relaxed text-amber-900 font-bold space-y-2 shadow-2xs">
                <div className="text-sm font-bold flex items-center gap-1.5 text-amber-700">
                  💡 Note
                </div>
                <p className="font-semibold text-gray-600">
                  Note: Khi bấm vào Từ vựng hay phần Flashcard thì đều dẫn đến trang này
                </p>
              </div>
            </div>

            {/* Right form notebooks section */}
            <div className="md:col-span-3 space-y-8">
              
              {/* Notebook Title (orange bar) */}
              <div className="bg-[#f59e0b] text-gray-950 font-black py-3 px-6 rounded-xl text-center shadow-xs text-sm uppercase tracking-wide">
                Sổ tay cá nhân
              </div>

              {/* Notebooks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Create new notebook (dashed border with plus) */}
                <button
                  onClick={() => router.push("/flashcard/add")}
                  className="border-2 border-dashed border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/10 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[110px]"
                >
                  <span className="text-2xl font-bold text-gray-400">+</span>
                  <span className="text-xs font-bold text-gray-700">Tạo sổ tay mới</span>
                </button>

                {/* Thanh Hà solid card */}
                <div className="border border-gray-150 bg-white p-5 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xs min-h-[110px]">
                  <span className="text-sm font-bold text-gray-800">Thanh Hà</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStudy("Thanh Hà")}
                      className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                    >
                      Học mới
                    </button>
                    <button
                      onClick={() => handleStudy("Thanh Hà")}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer"
                    >
                      Ôn tập
                    </button>
                  </div>
                </div>

              </div>

              {/* HSK Decks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-sm text-gray-900 tracking-wider">HSK</h3>
                  <button className="text-xs font-bold text-[#d97706] hover:underline cursor-pointer">
                    Xem tất cả
                  </button>
                </div>

                {/* HSK sub tabs scrollbar */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin select-none">
                  {hskTabs.map((tab) => {
                    const isActive = activeHsk === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveHsk(tab)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          isActive ? "bg-[#f59e0b] text-gray-950" : "bg-gray-100 text-gray-500 hover:bg-gray-250"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* HSK Decks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {hskDecks.map((deck, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-100 bg-white p-4 rounded-xl flex flex-col justify-between shadow-2xs gap-4 relative"
                    >
                      {/* Plus icon on top right */}
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">+</button>
                      
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{deck.title}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold italic mt-0.5">{deck.count} từ</p>
                      </div>

                      <div className="flex gap-2 justify-start pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleStudy(deck.title)}
                          className="border border-amber-250 text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
                        >
                          Học mới
                        </button>
                        <button
                          onClick={() => handleStudy(deck.title)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
                        >
                          Ôn tập
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOCFL Decks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-extrabold text-sm text-gray-900 tracking-wider">TOCFL</h3>
                  <button className="text-xs font-bold text-[#d97706] hover:underline cursor-pointer">
                    Xem tất cả
                  </button>
                </div>

                {/* TOCFL sub tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin select-none">
                  {tocflTabs.map((tab) => {
                    const isActive = activeTocfl === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTocfl(tab)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          isActive ? "bg-[#f59e0b] text-gray-950" : "bg-gray-100 text-gray-500 hover:bg-gray-250"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* TOCFL Decks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tocflDecks.map((deck, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-100 bg-white p-4 rounded-xl flex flex-col justify-between shadow-2xs gap-4 relative"
                    >
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">+</button>

                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{deck.title}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold italic mt-0.5">{deck.count} từ</p>
                      </div>

                      <div className="flex gap-2 justify-start pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleStudy(deck.title)}
                          className="border border-amber-250 text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
                        >
                          Học mới
                        </button>
                        <button
                          onClick={() => handleStudy(deck.title)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer"
                        >
                          Ôn tập
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
