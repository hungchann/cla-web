"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";

interface BilingualExerciseProps {
  exerciseList: any[];
  isLoading: boolean;
  srtData: any[];
  quizSelected: string | null;
  setQuizSelected: (val: string | null) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  exerciseType: "select" | "quiz" | "trans_zh_vi" | "trans_vi_zh";
  setExerciseType: (type: "select" | "quiz" | "trans_zh_vi" | "trans_vi_zh") => void;
}

export function BilingualExercise({
  exerciseList,
  isLoading,
  srtData,
  quizSelected,
  setQuizSelected,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  exerciseType,
  setExerciseType,
}: BilingualExerciseProps) {
  const getOptions = (ex: any) => {
    if (!ex) return [];
    if (Array.isArray(ex.options)) return ex.options;
    const opts = [];
    if (ex.answer_A) opts.push({ id: "A", val: ex.answer_A, isCorrect: ex.Correct_answer === "A" || ex.answer === "A" });
    if (ex.answer_B) opts.push({ id: "B", val: ex.answer_B, isCorrect: ex.Correct_answer === "B" || ex.answer === "B" });
    if (ex.answer_C) opts.push({ id: "C", val: ex.answer_C, isCorrect: ex.Correct_answer === "C" || ex.answer === "C" });
    if (ex.answer_D) opts.push({ id: "D", val: ex.answer_D, isCorrect: ex.Correct_answer === "D" || ex.answer === "D" });
    return opts;
  };

  return (
    <Card className="p-5 md:p-6 shadow-2xs space-y-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
      {isLoading ? (
        <p className="text-xs text-zinc-400 font-semibold text-center py-6">Đang tải bài tập...</p>
      ) : exerciseList.length === 0 ? (
        <p className="text-xs text-zinc-500 font-semibold text-center py-6">Bài học này chưa có bài tập trắc nghiệm.</p>
      ) : exerciseType === "select" ? (
        <div className="text-center space-y-6 py-4">
          <h3 className="text-lg font-black text-zinc-900 dark:text-white">Lựa chọn dạng bài</h3>
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <Button
              onClick={() => setExerciseType("quiz")}
              className="py-6 rounded-2xl text-sm font-extrabold cursor-pointer"
            >
              Trắc nghiệm
            </Button>
            <Button
              onClick={() => setExerciseType("trans_zh_vi")}
              className="py-6 rounded-2xl text-sm font-extrabold cursor-pointer"
            >
              Dịch Trung - Việt
            </Button>
            <Button
              onClick={() => setExerciseType("trans_vi_zh")}
              className="py-6 rounded-2xl text-sm font-extrabold cursor-pointer"
            >
              Dịch Việt - Trung
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Button
            variant="link"
            onClick={() => setExerciseType("select")}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-650 flex items-center gap-1 p-0 h-auto cursor-pointer"
          >
            &larr; Quay lại dạng bài
          </Button>

          {exerciseType === "quiz" && (() => {
            const currentQuestion = exerciseList[currentQuestionIndex];
            const options = getOptions(currentQuestion);
            const isCorrectAnswer = options.find((o: any) => o.id === quizSelected)?.isCorrect;

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm select-none border-amber-500/20 text-amber-600 dark:text-amber-500 bg-amber-500/5">
                    Q{currentQuestionIndex + 1}
                  </Badge>
                  <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm md:text-base">
                    {currentQuestion?.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {options.map((opt: any) => {
                    const isSelected = quizSelected === opt.id;
                    let btnStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 text-zinc-800 dark:text-zinc-200 hover:border-amber-300 dark:hover:border-amber-500";

                    if (isSelected) {
                      if (opt.isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 ring-2 ring-emerald-500/30";
                      } else {
                        btnStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-455 ring-2 ring-rose-500/30";
                      }
                    } else if (quizSelected && opt.isCorrect) {
                      btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-455";
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (!quizSelected) setQuizSelected(opt.id);
                        }}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-xs cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt.id}. {opt.val}</span>
                      </button>
                    );
                  })}
                </div>

                {quizSelected && (
                  <div className={`p-4 rounded-2xl border font-semibold text-xs leading-relaxed space-y-2 ${isCorrectAnswer
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-450"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-455"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      {isCorrectAnswer ? (
                        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Chính xác! Bạn đã trả lời đúng.</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Sai rồi! Đáp án đúng là {options.find((o: any) => o.isCorrect)?.id}.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Button
                        variant="link"
                        onClick={() => setQuizSelected(null)}
                        className="text-amber-650 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 underline block cursor-pointer p-0 h-auto font-bold text-xs"
                      >
                        Làm lại
                      </Button>
                      {currentQuestionIndex < exerciseList.length - 1 && (
                        <Button
                          onClick={() => {
                            setCurrentQuestionIndex(currentQuestionIndex + 1);
                            setQuizSelected(null);
                          }}
                          className="font-bold text-xs px-4 py-1.5 rounded-lg cursor-pointer"
                        >
                          Câu tiếp theo
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {exerciseType === "trans_zh_vi" && (() => {
            const entry = srtData[0] || { chinese: "管理信息输入、专注纵向成长，而非横向比较。", vietnamese: "Quản lý lượng thông tin đầu vào, tập trung vào tăng trưởng theo chiều dọc chứ không phải so sánh theo chiều ngang." };
            return (
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Dịch câu sau sang tiếng Việt:</h4>
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl font-bold text-md text-amber-700 dark:text-amber-500">
                  {entry.chinese}
                </div>
                <Textarea
                  placeholder="Nhập bản dịch tiếng Việt của bạn..."
                  className="w-full h-24 text-xs font-semibold"
                />
                <Button
                  onClick={() => alert(`Bản dịch tham khảo: ${entry.vietnamese}`)}
                  className="font-bold text-xs px-5 py-2 cursor-pointer"
                >
                  Kiểm tra kết quả
                </Button>
              </div>
            );
          })()}

          {exerciseType === "trans_vi_zh" && (() => {
            const entry = srtData[0] || { chinese: "面对同辈压力，核心是建立自我坐标系。", vietnamese: "Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình." };
            return (
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Dịch câu sau sang chữ Hán (Giản thể):</h4>
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl font-bold text-sm text-zinc-700 dark:text-zinc-300">
                  {entry.vietnamese}
                </div>
                <Input
                  type="text"
                  placeholder="Nhập câu tiếng Trung..."
                  className="w-full text-xs font-semibold"
                />
                <Button
                  onClick={() => alert(`Bản dịch mẫu: ${entry.chinese}`)}
                  className="font-bold text-xs px-5 py-2 cursor-pointer"
                >
                  Kiểm tra kết quả
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}
