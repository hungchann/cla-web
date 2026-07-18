"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, HelpCircle, Eye, EyeOff } from "lucide-react";
import { playAnswerFeedback } from "@/services/audioFeedback";
import { bilingualApi } from "@/api/bilingual";

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

interface WordComparison {
  word: string;
  isCorrect: boolean;
}

interface EvaluationResult {
  percent: number;
  wordComparison: WordComparison[];
  missingWords: string[];
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
  // Local state for translation exercises
  const [transIndex, setTransIndex] = useState(0);
  const [transInput, setTransInput] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showReference, setShowReference] = useState(false);

  // Local state for quiz verification
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Pagination handlers for translation exercises
  const handlePrev = () => {
    if (transIndex > 0) {
      setTransIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (transIndex < srtData.length - 1) {
      setTransIndex((prev) => prev + 1);
    }
  };

  // Reset local state when exercise type changes
  useEffect(() => {
    setTransIndex(0);
    setTransInput("");
    setEvaluation(null);
    setShowReference(false);
    setVerificationResult(null);
  }, [exerciseType]);

  // Reset translation input & evaluation when active sentence changes
  useEffect(() => {
    setTransInput("");
    setEvaluation(null);
    setShowReference(false);
  }, [transIndex]);

  // Reset verification when active question changes
  useEffect(() => {
    setVerificationResult(null);
  }, [currentQuestionIndex]);

  const getOptions = (ex: any) => {
    if (!ex) return [];

    if (Array.isArray(ex.options)) {
      return ex.options.map((opt: any) => ({
        id: String(opt.id),
        val: opt.val || opt.hanzi || opt.text || "",
      }));
    }

    const opts = [];
    const ansA = ex.answer_A || ex.Answer_A || ex.answerA;
    const ansB = ex.answer_B || ex.Answer_B || ex.answerB;
    const ansC = ex.answer_C || ex.Answer_C || ex.answerC;
    const ansD = ex.answer_D || ex.Answer_D || ex.answerD;
    
    if (ansA) opts.push({ id: "A", val: ansA });
    if (ansB) opts.push({ id: "B", val: ansB });
    if (ansC) opts.push({ id: "C", val: ansC });
    if (ansD) opts.push({ id: "D", val: ansD });
    return opts;
  };

  // Translation evaluation logic (character level for Chinese, word level for Vietnamese)
  const handleCheckTranslation = (expectedText: string, isChineseTarget: boolean) => {
    const normalize = (s: string) => (s || "").normalize("NFKC").replace(/\s+/g, " ").trim();

    const tokenize = (s: string, isZh: boolean): string[] => {
      const normalized = normalize(s);
      if (!normalized) return [];
      if (isZh) {
        const cjkChars = normalized.match(/\p{Script=Han}/gu) ?? [];
        if (cjkChars.length > 0) return cjkChars;
      }
      return normalized
        .replace(/[，。！？、；：""''（）【】.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
    };

    const inputTokens = tokenize(transInput, isChineseTarget);
    const refTokens = tokenize(expectedText, isChineseTarget);

    const refCounts = new Map<string, number>();
    refTokens.forEach((tok) => refCounts.set(tok, (refCounts.get(tok) || 0) + 1));

    const wordComparison = inputTokens.map((tok) => {
      const remaining = refCounts.get(tok) || 0;
      const isCorrect = remaining > 0;
      if (isCorrect) {
        refCounts.set(tok, remaining - 1);
      }
      return { word: tok, isCorrect };
    });

    const correctCount = wordComparison.filter((w) => w.isCorrect).length;
    const refTotal = refTokens.length;
    const percent = refTotal > 0 ? Math.round((correctCount / refTotal) * 100) : 0;

    // Calculate missing tokens
    const inputCounts = new Map<string, number>();
    inputTokens.forEach((tok) => inputCounts.set(tok, (inputCounts.get(tok) || 0) + 1));

    const missingWords: string[] = [];
    const referenceCounts = new Map<string, number>();
    refTokens.forEach((tok) => referenceCounts.set(tok, (referenceCounts.get(tok) || 0) + 1));

    for (const [token, refCount] of referenceCounts.entries()) {
      const inCount = inputCounts.get(token) || 0;
      const missingCount = Math.max(refCount - inCount, 0);
      for (let k = 0; k < missingCount; k++) {
        missingWords.push(token);
      }
    }

    setEvaluation({
      percent: Math.min(percent, 100),
      wordComparison,
      missingWords,
    });
  };

  const getEvaluationColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getEvaluationBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30";
    if (score >= 50) return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30";
    return "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30";
  };

  const activeEntry = srtData[transIndex] || {
    chinese: "面对同辈压力，核心是建立自我坐标系。",
    vietnamese: "Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình.",
  };

  return (
    <Card className="p-5 md:p-6 shadow-2xs space-y-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
      {isLoading ? (
        <p className="text-xs text-zinc-400 font-semibold text-center py-6">Đang tải bài tập...</p>
      ) : exerciseList.length === 0 && exerciseType === "quiz" ? (
        <p className="text-xs text-zinc-500 font-semibold text-center py-6">Bài học này chưa có bài tập trắc nghiệm.</p>
      ) : exerciseType === "select" ? (
        <div className="text-center space-y-6 py-4">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Lựa chọn dạng bài tập</h3>
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <Button
              onClick={() => setExerciseType("quiz")}
              disabled={exerciseList.length === 0}
              className="py-6 rounded-2xl text-xs font-extrabold cursor-pointer transition-all hover:scale-102"
            >
              Trắc nghiệm ({exerciseList.length} câu)
            </Button>
            <Button
              onClick={() => setExerciseType("trans_zh_vi")}
              disabled={srtData.length === 0}
              className="py-6 rounded-2xl text-xs font-extrabold cursor-pointer transition-all hover:scale-102"
            >
              Dịch Trung - Việt ({srtData.length} câu)
            </Button>
            <Button
              onClick={() => setExerciseType("trans_vi_zh")}
              disabled={srtData.length === 0}
              className="py-6 rounded-2xl text-xs font-extrabold cursor-pointer transition-all hover:scale-102"
            >
              Dịch Việt - Trung ({srtData.length} câu)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Button
            variant="link"
            onClick={() => setExerciseType("select")}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 p-0 h-auto cursor-pointer"
          >
            &larr; Quay lại danh sách dạng bài
          </Button>

          {/* DẠNG 1: TRẮC NGHIỆM */}
          {exerciseType === "quiz" && (() => {
            const currentQuestion = exerciseList[currentQuestionIndex];
            const options = getOptions(currentQuestion);

            const handleSelectQuizOption = async (optId: string) => {
              if (quizSelected || isVerifying) return;
              
              setQuizSelected(optId);
              setIsVerifying(true);
              
              try {
                const answersPayload = [
                  {
                    questionId: currentQuestion.id,
                    answer: optId,
                    selectAnswer: optId,
                  },
                ];
                
                const response = await bilingualApi.submitExercise(answersPayload);
                const result = Array.isArray(response) ? response[0] : response;
                setVerificationResult(result);
                
                playAnswerFeedback(result.status === "Đúng");
              } catch (err) {
                console.error("Error submitting quiz answer:", err);
              } finally {
                setIsVerifying(false);
              }
            };

            const isCorrectAnswer = verificationResult 
              ? (verificationResult.status === "Đúng" || verificationResult.isCorrect) 
              : false;

            return (
              <div className="space-y-6">
                <div className="flex items-start gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none border-amber-500/20 text-amber-600 dark:text-amber-500 bg-amber-500/5">
                    Q{currentQuestionIndex + 1}
                  </Badge>
                  <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm md:text-base pt-1">
                    {currentQuestion?.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {options.map((opt: any, index: number) => {
                    const isSelected = quizSelected === opt.id;
                    let btnStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 hover:border-amber-300 dark:hover:border-amber-500";

                    if (verificationResult) {
                      const correctAns = String(verificationResult.correctAnswer || "").trim().toUpperCase();
                      const indexLetter = ["A", "B", "C", "D"][index] || "";
                      const isOptCorrect = opt.id === correctAns || 
                                           correctAns === `ANSWER_${opt.id}` ||
                                           (indexLetter && (correctAns === indexLetter || correctAns === `ANSWER_${indexLetter}`));

                      if (isSelected) {
                        if (isCorrectAnswer || isOptCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/30";
                        } else {
                          btnStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/30";
                        }
                      } else if (isOptCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30";
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isVerifying || quizSelected !== null}
                        onClick={() => handleSelectQuizOption(opt.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold text-left transition-all duration-200 active:scale-[0.98] text-xs cursor-pointer ${btnStyle} disabled:opacity-90`}
                      >
                        <span>{opt.id}. {opt.val}</span>
                      </button>
                    );
                  })}
                </div>

                {quizSelected && (
                  <div className={`p-4 rounded-2xl border font-semibold text-xs leading-relaxed space-y-2 ${
                    isVerifying 
                      ? "bg-zinc-100 border-zinc-200 text-zinc-600"
                      : isCorrectAnswer
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                  }`}>
                    {isVerifying ? (
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span>Đang chấm điểm...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                          {isCorrectAnswer ? (
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Chính xác! Bạn đã trả lời đúng.</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <XCircle className="h-4 w-4" /> 
                              Chưa chính xác! Đáp án đúng là {verificationResult?.correctAnswer || "A"}.
                            </span>
                          )}
                        </div>
                        {verificationResult?.explanation && (
                          <div className="text-zinc-650 dark:text-zinc-300 mt-1 select-text">
                            <strong className="text-zinc-900 dark:text-white block mb-0.5">Giải thích:</strong>
                            <div dangerouslySetInnerHTML={{ __html: verificationResult.explanation.replace(/\n/g, "<br/>") }} />
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <Button
                        variant="link"
                        disabled={isVerifying}
                        onClick={() => {
                          setQuizSelected(null);
                          setVerificationResult(null);
                        }}
                        className="text-amber-650 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 underline block cursor-pointer p-0 h-auto font-bold text-xs disabled:opacity-50"
                      >
                        Làm lại
                      </Button>
                      {currentQuestionIndex < exerciseList.length - 1 && (
                        <Button
                          disabled={isVerifying}
                          onClick={() => {
                            setCurrentQuestionIndex(currentQuestionIndex + 1);
                            setQuizSelected(null);
                            setVerificationResult(null);
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

          {/* DẠNG 2: DỊCH TRUNG - VIỆT */}
          {exerciseType === "trans_zh_vi" && (() => {
            return (
              <div className="space-y-5">
                {/* Navigation Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                    Dịch câu Trung - Việt
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrev}
                      disabled={transIndex === 0}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-zinc-500">
                      {transIndex + 1} / {srtData.length}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={transIndex === srtData.length - 1}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Source sentence */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/80 p-4 md:p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-zinc-400 uppercase block tracking-wider">Câu gốc (Tiếng Trung):</span>
                  <div className="font-black text-lg md:text-xl text-amber-700 dark:text-amber-500 select-text leading-relaxed">
                    {activeEntry.chinese}
                  </div>
                </div>

                {/* Textarea Input */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-450 block">Bản dịch của bạn (Tiếng Việt):</span>
                  <Textarea
                    placeholder="Nhập bản dịch tiếng Việt của bạn ở đây..."
                    value={transInput}
                    onChange={(e) => setTransInput(e.target.value)}
                    disabled={evaluation !== null}
                    className="w-full h-24 text-xs font-semibold rounded-xl"
                  />
                </div>

                {/* Buttons row */}
                <div className="flex flex-wrap items-center gap-3">
                  {!evaluation ? (
                    <Button
                      onClick={() => handleCheckTranslation(activeEntry.vietnamese, false)}
                      disabled={!transInput.trim()}
                      className="font-bold text-xs px-5 py-2 cursor-pointer rounded-xl"
                    >
                      Kiểm tra kết quả
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setEvaluation(null);
                        setTransInput("");
                        setShowReference(false);
                      }}
                      className="font-bold text-xs px-5 py-2 cursor-pointer rounded-xl"
                    >
                      Làm lại
                    </Button>
                  )}

                  <button
                    onClick={() => setShowReference((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-350 rounded-xl cursor-pointer active:scale-95 transition-all bg-transparent"
                  >
                    {showReference ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showReference ? "Ẩn đáp án mẫu" : "Xem đáp án mẫu"}
                  </button>

                  {transIndex < srtData.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={handleNext}
                      className="font-bold text-xs px-4 py-2 rounded-xl cursor-pointer border-zinc-250 hover:bg-zinc-50"
                    >
                      Câu tiếp theo
                    </Button>
                  )}
                </div>

                {/* Reference Translation Card */}
                {showReference && (
                  <div className="p-4 rounded-2xl border border-amber-200/50 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10 space-y-1">
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-wider block">Bản dịch mẫu tham khảo:</span>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-text leading-relaxed">
                      {activeEntry.vietnamese}
                    </p>
                  </div>
                )}

                {/* Evaluation Card */}
                {evaluation && (
                  <div className={`p-4 md:p-5 rounded-2xl border space-y-4 ${getEvaluationBg(evaluation.percent)}`}>
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Độ trùng khớp từ vựng</span>
                      <span className={`text-lg md:text-xl font-black ${getEvaluationColor(evaluation.percent)}`}>
                        {evaluation.percent}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-zinc-400 block uppercase">Chi tiết đối chiếu:</span>
                        <div className="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-xl leading-relaxed text-sm font-semibold select-none">
                          {evaluation.wordComparison.map((item, idx) => (
                            <span
                              key={idx}
                              className={item.isCorrect 
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded-xs" 
                                : "text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 px-1 rounded-xs line-through"
                              }
                            >
                              {item.word}
                            </span>
                          ))}
                        </div>
                      </div>

                      {evaluation.missingWords.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-zinc-450 block uppercase">Các từ quan trọng bị thiếu:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(new Set(evaluation.missingWords)).map((w, idx) => (
                              <span key={idx} className="text-xs font-bold px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-650 bg-rose-50 dark:bg-rose-950/20 select-none">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* DẠNG 3: DỊCH VIỆT - TRUNG */}
          {exerciseType === "trans_vi_zh" && (() => {
            return (
              <div className="space-y-5">
                {/* Navigation Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                    Dịch câu Việt - Trung
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrev}
                      disabled={transIndex === 0}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-zinc-500">
                      {transIndex + 1} / {srtData.length}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={transIndex === srtData.length - 1}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Source sentence */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/80 p-4 md:p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-zinc-400 uppercase block tracking-wider">Câu gốc (Tiếng Việt):</span>
                  <div className="font-black text-sm md:text-base text-zinc-750 dark:text-zinc-250 select-text leading-relaxed">
                    {activeEntry.vietnamese}
                  </div>
                </div>

                {/* Input Text Box */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-450 block">Bản dịch của bạn (Chữ Hán Giản Thể):</span>
                  <Input
                    type="text"
                    placeholder="Nhập câu tiếng Trung tương ứng..."
                    value={transInput}
                    onChange={(e) => setTransInput(e.target.value)}
                    disabled={evaluation !== null}
                    className="w-full text-xs font-semibold rounded-xl h-11"
                  />
                </div>

                {/* Buttons row */}
                <div className="flex flex-wrap items-center gap-3">
                  {!evaluation ? (
                    <Button
                      onClick={() => handleCheckTranslation(activeEntry.chinese, true)}
                      disabled={!transInput.trim()}
                      className="font-bold text-xs px-5 py-2 cursor-pointer rounded-xl"
                    >
                      Kiểm tra kết quả
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setEvaluation(null);
                        setTransInput("");
                        setShowReference(false);
                      }}
                      className="font-bold text-xs px-5 py-2 cursor-pointer rounded-xl"
                    >
                      Làm lại
                    </Button>
                  )}

                  <button
                    onClick={() => setShowReference((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-350 rounded-xl cursor-pointer active:scale-95 transition-all bg-transparent"
                  >
                    {showReference ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showReference ? "Ẩn câu mẫu" : "Xem câu mẫu"}
                  </button>

                  {transIndex < srtData.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={handleNext}
                      className="font-bold text-xs px-4 py-2 rounded-xl cursor-pointer border-zinc-250 hover:bg-zinc-50"
                    >
                      Câu tiếp theo
                    </Button>
                  )}
                </div>

                {/* Reference Translation Card */}
                {showReference && (
                  <div className="p-4 rounded-2xl border border-amber-200/50 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10 space-y-1">
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-wider block">Bản dịch chữ Hán mẫu:</span>
                    <p className="text-lg font-black text-amber-800 dark:text-amber-500 select-text leading-relaxed">
                      {activeEntry.chinese}
                    </p>
                  </div>
                )}

                {/* Evaluation Card */}
                {evaluation && (
                  <div className={`p-4 md:p-5 rounded-2xl border space-y-4 ${getEvaluationBg(evaluation.percent)}`}>
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Độ trùng khớp chữ Hán</span>
                      <span className={`text-lg md:text-xl font-black ${getEvaluationColor(evaluation.percent)}`}>
                        {evaluation.percent}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-zinc-400 block uppercase">Chi tiết đối chiếu:</span>
                        <div className="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-xl leading-relaxed text-lg font-bold select-none">
                          {evaluation.wordComparison.map((item, idx) => (
                            <span
                              key={idx}
                              className={item.isCorrect 
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded-xs" 
                                : "text-rose-650 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 px-1 rounded-xs line-through"
                              }
                            >
                              {item.word}
                            </span>
                          ))}
                        </div>
                      </div>

                      {evaluation.missingWords.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-zinc-450 block uppercase">Các chữ bị thiếu:</span>
                          <div className="flex flex-wrap gap-1.5 text-md font-bold">
                            {Array.from(new Set(evaluation.missingWords)).map((w, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-650 bg-rose-50 dark:bg-rose-950/20 select-none">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
}
