"use client";

import { useState } from "react";
import { VideoQuizSection } from "./VideoQuizSection";

interface VideoQuizPanelProps {
  activeQuestion: any;
  activeEx: any;
  getOptions: (ex: any) => any[];
  onSubmit: (answer: string) => Promise<{ status?: string } | void>;
  onContinue: () => void;
}

export function VideoQuizPanel({
  activeQuestion,
  activeEx,
  getOptions,
  onSubmit,
  onContinue,
}: Readonly<VideoQuizPanelProps>) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  if (!activeQuestion || !activeEx) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
          Hiện tại không có câu hỏi dừng video nào đang chờ.
        </p>
        <p className="text-[10px] text-zinc-400/70 mt-1">
          Khi video phát tới mốc câu hỏi, phần trắc nghiệm sẽ tự động kích hoạt.
        </p>
      </div>
    );
  }

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null) return;

    setIsAnswerChecked(true);

    // Gọi hook báo cáo kết quả và lấy status thực tế từ API server
    const result = await onSubmit(String(selectedAnswer));
    if (result && "status" in result) {
      setIsAnswerCorrect(result.status === "Đúng");
    }
  };

  return (
    <VideoQuizSection
      activeQuestion={activeQuestion}
      activeEx={activeEx}
      selectedAnswer={selectedAnswer}
      setSelectedAnswer={setSelectedAnswer}
      isAnswerChecked={isAnswerChecked}
      isAnswerCorrect={isAnswerCorrect}
      handleAnswerSubmit={handleAnswerSubmit}
      handleContinueVideo={onContinue}
      getOptions={getOptions}
    />
  );
}
