"use client";

import React from "react";
import { Download } from "lucide-react";
import type { LessonExtra } from "@/lib/types/course";

interface ExtraLessonStepProps {
    lessonExtra: LessonExtra | null;
    onBackToCourse: () => void;
}

export function ExtraLessonStep({ lessonExtra, onBackToCourse }: ExtraLessonStepProps) {
    return (
        <div className="flex flex-col items-center justify-start w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl items-center">
                <div className="md:col-span-2 bg-white rounded-2xl border-2 border-dashed border-orange-200 p-8 shadow-xs w-full dark:bg-zinc-900 dark:border-zinc-800">
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-6 text-center dark:text-amber-400">
                        <Download className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Tải tài liệu & Bài tập bổ sung
                    </h4>
                    <div className="flex items-center justify-around gap-6">
                        {/* PDF 1: Exercise PDF */}
                        {lessonExtra?.extra_pdf_url ? (
                            <a
                                href={lessonExtra.extra_pdf_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                            >
                                <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative dark:bg-red-950/20 dark:border-red-900">
                                    <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Tải Bài tập</span>
                            </a>
                        ) : (
                            <div className="text-xs text-zinc-400 italic">Chưa có file bài tập</div>
                        )}

                        {/* PDF 2: Answer PDF */}
                        {lessonExtra?.extra_answer_url ? (
                            <a
                                href={lessonExtra.extra_answer_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                            >
                                <div className="w-16 h-20 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow relative dark:bg-red-950/20 dark:border-red-900">
                                    <span className="absolute top-1 text-[8px] font-black text-red-500 tracking-wider">PDF</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500 mt-2">
                                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M3.75 18a.75.75 0 0 1 .75.75h15a.75.75 0 0 1 0 1.5H4.5A.75.75 0 0 1 3.75 18Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Tải Đáp án</span>
                            </a>
                        ) : (
                            <div className="text-xs text-zinc-400 italic">Chưa có file đáp án</div>
                        )}

                        {/* Audio */}
                        {lessonExtra?.extra_audio_url ? (
                            <a
                                href={lessonExtra.extra_audio_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform active:scale-95"
                            >
                                <div className="w-16 h-20 bg-orange-50 border border-orange-200 rounded-xl flex flex-col items-center justify-center shadow-2xs group-hover:shadow-md transition-shadow dark:bg-orange-950/20 dark:border-orange-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-500">
                                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.062 2.062h1.932l4.5 4.5c.944.944 2.56.276 2.56-1.06V4.06ZM18.57 17.47a.75.75 0 1 1-1.06 1.06 9 9 0 0 1 0-12.72.75.75 0 1 1 1.06 1.06 7.5 7.5 0 0 0 0 10.6ZM15.89 14.8a.75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 1 0-6.36.75.75 0 1 1 1.06 1.06 3 3 0 0 0 0 4.24Z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Tải Audio</span>
                            </a>
                        ) : (
                            <div className="text-xs text-zinc-400 italic">Chưa có audio</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end w-full pt-6 border-t border-gray-150 mt-8 max-w-3xl dark:border-zinc-800">
                <button
                    type="button"
                    onClick={onBackToCourse}
                    className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer dark:text-amber-400"
                >
                    Về lộ trình học &rarr;
                </button>
            </div>
        </div>
    );
}
