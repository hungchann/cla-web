"use client";

import React from "react";

interface BilingualVocabProps {
  vocabList: any[];
  isLoading: boolean;
  onWordPress: (word: string) => void;
}

export function BilingualVocab({
  vocabList,
  isLoading,
  onWordPress,
}: BilingualVocabProps) {
  return (
    <div className="space-y-3">
      {isLoading ? (
        <p className="text-xs text-zinc-400 font-semibold">Đang tải từ vựng...</p>
      ) : vocabList.length === 0 ? (
        <p className="text-xs text-zinc-500 font-semibold">Bài học này chưa được cập nhật từ vựng.</p>
      ) : (
        <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-3xs">
          <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800/60 text-left text-xs font-semibold">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-black tracking-wider uppercase border-b border-zinc-150 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Từ vựng</th>
                <th className="px-4 py-3">Từ loại</th>
                <th className="px-4 py-3">Pinyin</th>
                <th className="px-4 py-3">Nghĩa</th>
                <th className="px-4 py-3">Ví dụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
              {vocabList.map((vocab: any, index: number) => (
                <tr
                  key={vocab.id || index}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40"
                >
                  <td
                    className="px-4 py-3 font-black text-amber-650 dark:text-amber-500 text-sm cursor-pointer hover:underline"
                    onClick={() => onWordPress(vocab.word)}
                  >
                    {vocab.word}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {vocab.word_type || "N/A"}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {vocab.Pinyin || vocab.pinyin || ""}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {vocab.meaning}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 leading-normal">
                    {vocab.Example || vocab.example || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
