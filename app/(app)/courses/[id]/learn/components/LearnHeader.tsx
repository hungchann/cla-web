"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface LearnHeaderProps {
    courseId: string;
    courseTitle: string;
}

export function LearnHeader({ courseId, courseTitle }: LearnHeaderProps) {
    const router = useRouter();

    return (
        <div className="bg-white border-b border-gray-100 shadow-2xs sticky top-0 z-20 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="text-xs font-bold text-gray-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer dark:text-zinc-400 dark:hover:text-amber-400"
                    >
                        &larr; Khóa học
                    </button>
                    <span className="text-gray-300 dark:text-zinc-700">|</span>
                    <h1 className="text-sm font-extrabold text-gray-900 truncate max-w-md dark:text-white">
                        {courseTitle}
                    </h1>
                </div>
            </div>
        </div>
    );
}
