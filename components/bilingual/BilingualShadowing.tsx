"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Mic, Square, ChevronLeft, ChevronRight, RefreshCw, Play, Pause, Loader2 } from "lucide-react";

interface BilingualShadowingProps {
  srtData: any[];
  onSpeakWord: (text: string) => void;
}

interface HighlightWord {
  word: string;
  isCorrect: boolean;
  isMissing: boolean;
  isExtra: boolean;
}

interface ComparisonResult {
  accuracy: number;
  correctWords: string[];
  incorrectWords: string[];
  missingWords: string[];
  extraWords: string[];
  highlightedText: HighlightWord[];
}

export function BilingualShadowing({
  srtData,
  onSpeakWord,
}: BilingualShadowingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [userText, setUserText] = useState<string>("");
  const [feedback, setFeedback] = useState<{ accuracy: number; details: string[] } | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  // Audio playback of recorded voice
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);

  const defaultEntry = srtData[currentIndex] || {
    chinese: "面对同辈压力，核心是建立自我坐标系。",
    vietnamese: "Đối mặt với áp lực từ đồng trang lứa, cốt lõi là xây dựng hệ quy chiếu của riêng mình.",
    segmentedWords: [],
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // Stop recording when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, stopRecording]);

  // Handle user audio playing state
  useEffect(() => {
    if (userAudioUrl) {
      const audio = new Audio(userAudioUrl);
      userAudioRef.current = audio;

      const handlePlay = () => setIsPlayingUserAudio(true);
      const handleEndedOrPause = () => setIsPlayingUserAudio(false);

      audio.addEventListener("play", handlePlay);
      audio.addEventListener("ended", handleEndedOrPause);
      audio.addEventListener("pause", handleEndedOrPause);

      return () => {
        audio.pause();
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("ended", handleEndedOrPause);
        audio.removeEventListener("pause", handleEndedOrPause);
      };
    }
  }, [userAudioUrl]);

  // Audio recording handlers
  const startRecording = async () => {
    try {
      setUserText("");
      setFeedback(null);
      setComparisonResult(null);
      if (userAudioUrl) {
        URL.revokeObjectURL(userAudioUrl);
        setUserAudioUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const localUrl = URL.createObjectURL(audioBlob);
        setUserAudioUrl(localUrl);

        // Upload and transcribe
        await uploadAndTranscribe(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Không thể truy cập Microphone. Vui lòng cấp quyền ghi âm cho trang web.");
    }
  };


  const toggleUserAudioPlayback = () => {
    if (userAudioRef.current) {
      if (isPlayingUserAudio) {
        userAudioRef.current.pause();
      } else {
        userAudioRef.current.play().catch(e => console.log("User audio playback failed", e));
      }
    }
  };

  // Upload audio to server
  const uploadAndTranscribe = async (blob: Blob) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("language", "zh-CN");

      const response = await fetch("/api/speech/transcribe", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.transcription) {
        const transcribedText = result.transcription;
        setUserText(transcribedText);

        const comparison = compareTextsAdvanced(defaultEntry.chinese, transcribedText);
        setComparisonResult(comparison);
        setFeedback({
          accuracy: comparison.accuracy,
          details: [
            `Phát âm đúng: ${comparison.correctWords.length} chữ`,
            `Chữ bị thiếu: ${comparison.missingWords.length} chữ`,
            `Chữ thừa: ${comparison.extraWords.length} chữ`,
          ],
        });
      } else {
        setUserText("");
        setFeedback({
          accuracy: 0,
          details: ["Không nhận diện được giọng nói. Hãy nói rõ hơn hoặc thử lại."],
        });
      }
    } catch (err) {
      console.error("Transcription upload error:", err);
      setFeedback({
        accuracy: 0,
        details: ["Lỗi kết nối máy chủ ghi âm. Vui lòng thử lại."],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Text Comparison Algorithm (LCS/DP character level)
  const compareTextsAdvanced = (targetText: string, userText: string): ComparisonResult => {
    const normalize = (text: string) =>
      text
        .replace(/[，。！？、；：""''（）【】.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

    const normalizedTarget = normalize(targetText);
    const normalizedUser = normalize(userText);

    const targetWords = normalizedTarget.split("").filter((char) => char.trim());
    const userWords = normalizedUser.split("").filter((char) => char.trim());

    const dp: number[][] = Array(targetWords.length + 1)
      .fill(null)
      .map(() => Array(userWords.length + 1).fill(0));

    // Fill DP table
    for (let i = 1; i <= targetWords.length; i++) {
      for (let j = 1; j <= userWords.length; j++) {
        if (targetWords[i - 1] === userWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find matches
    let i = targetWords.length;
    let j = userWords.length;
    const matchedPairs: { target: number; user: number }[] = [];

    while (i > 0 && j > 0) {
      if (targetWords[i - 1] === userWords[j - 1]) {
        matchedPairs.push({ target: i - 1, user: j - 1 });
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    const matchedTarget = new Set(matchedPairs.map((p) => p.target));
    const matchedUser = new Set(matchedPairs.map((p) => p.user));

    const correctWords: string[] = [];
    const incorrectWords: string[] = [];
    const missingWords: string[] = [];
    const extraWords: string[] = [];
    const highlightedText: HighlightWord[] = [];

    targetWords.forEach((word, index) => {
      if (matchedTarget.has(index)) {
        correctWords.push(word);
        highlightedText.push({
          word,
          isCorrect: true,
          isMissing: false,
          isExtra: false,
        });
      } else {
        missingWords.push(word);
        highlightedText.push({
          word,
          isCorrect: false,
          isMissing: true,
          isExtra: false,
        });
      }
    });

    userWords.forEach((word, index) => {
      if (!matchedUser.has(index)) {
        const targetWord = targetWords[index];
        if (targetWord && targetWord !== word) {
          incorrectWords.push(word);
        } else {
          extraWords.push(word);
        }
      }
    });

    const totalTargetWords = targetWords.length;
    const correctCount = correctWords.length;
    const substitutionCount = incorrectWords.length;

    // Substitutions count as partial credit (0.5)
    const adjustedCorrectCount = correctCount + substitutionCount * 0.5;
    const accuracy = totalTargetWords > 0 ? (adjustedCorrectCount / totalTargetWords) * 100 : 0;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      correctWords,
      incorrectWords,
      missingWords,
      extraWords,
      highlightedText,
    };
  };

  const handleNext = () => {
    if (currentIndex < srtData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetStateForSentence();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetStateForSentence();
    }
  };

  const resetStateForSentence = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setUserText("");
    setFeedback(null);
    setComparisonResult(null);
    if (userAudioUrl) {
      URL.revokeObjectURL(userAudioUrl);
      setUserAudioUrl(null);
    }
  };

  // Score display HSL/tailwinds
  const getAccuracyColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  const getAccuracyBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-250/50 dark:border-emerald-900/30";
    if (score >= 50) return "bg-amber-50/50 dark:bg-amber-950/20 border-amber-250/50 dark:border-amber-900/30";
    return "bg-rose-50/50 dark:bg-rose-950/20 border-rose-250/50 dark:border-rose-900/30";
  };

  return (
    <div className="border border-amber-500/35 dark:border-amber-500/20 rounded-2xl p-5 md:p-6 bg-white dark:bg-zinc-900 shadow-2xs space-y-6">
      {/* Header bar with Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          Shadowing
        </h3>
        
        {srtData.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || isRecording || isProcessing}
              className="p-1.5 rounded-lg border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Câu trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-zinc-500">
              {currentIndex + 1} / {srtData.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentIndex === srtData.length - 1 || isRecording || isProcessing}
              className="p-1.5 rounded-lg border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Câu tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active Subtitle box */}
      <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          {/* Target Chinese characters with optional interactive words */}
          <div className="flex flex-wrap items-end gap-x-1.5 gap-y-2 text-lg md:text-xl font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed">
            {defaultEntry.segmentedWords && defaultEntry.segmentedWords.length > 0 ? (
              defaultEntry.segmentedWords.map((wItem: any, wordIdx: number) => (
                <span
                  key={wordIdx}
                  onClick={() => onSpeakWord(wItem.word)}
                  className="cursor-pointer hover:text-amber-650 dark:hover:text-amber-500 transition-colors select-none"
                  title="Click để nghe phát âm"
                >
                  <ruby>
                    {wItem.word}
                    {wItem.pinyin && (
                      <rt className="text-[10px] text-zinc-400 font-bold select-none">
                        {wItem.pinyin}
                      </rt>
                    )}
                  </ruby>
                </span>
              ))
            ) : (
              <span className="select-text">{defaultEntry.chinese}</span>
            )}
          </div>
          <p className="text-xs md:text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
            {defaultEntry.vietnamese}
          </p>
        </div>
        <button
          onClick={() => onSpeakWord(defaultEntry.chinese)}
          disabled={isRecording || isProcessing}
          className="w-10 h-10 border border-amber-250 dark:border-zinc-800 hover:bg-amber-100/50 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 cursor-pointer active:scale-95 transition-all shrink-0 bg-transparent"
          title="Nghe giọng đọc mẫu"
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      {/* Recording controls */}
      <div className="flex flex-col items-center justify-center space-y-3 py-4">
        {isRecording ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-rose-650 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 animate-pulse transition-all cursor-pointer border-none"
              title="Dừng ghi âm"
            >
              <Square className="h-6 w-6 fill-current" />
            </button>
            <p className="text-xs font-black text-rose-600 dark:text-rose-400 tracking-widest uppercase animate-pulse">
              Đang thu âm: {recordingSeconds}s / 15s
            </p>
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 animate-pulse">
              Đang gửi âm thanh lên server để phân tích...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer border-none"
              title="Bắt đầu ghi âm"
            >
              <Mic className="h-7 w-7" />
            </button>
            <p className="text-[11px] font-bold text-zinc-450 dark:text-zinc-500">
              Nhấn để bắt đầu ghi âm
            </p>
          </div>
        )}
      </div>

      {/* Results and Feedback box */}
      {(feedback || userText) && (
        <div className={`rounded-2xl p-4 md:p-5 border space-y-4 transition-all ${feedback ? getAccuracyBg(feedback.accuracy) : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20"}`}>
          {/* Accuracy Score */}
          {feedback && (
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Kết quả phát âm</span>
              <span className={`text-xl md:text-2xl font-black ${getAccuracyColor(feedback.accuracy)}`}>
                {feedback.accuracy}%
              </span>
            </div>
          )}

          {/* Highlights comparison */}
          {comparisonResult && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 block">Chi tiết phát âm (so sánh từng chữ):</span>
              <div className="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-xl leading-relaxed text-lg font-bold select-none">
                {comparisonResult.highlightedText.map((char, index) => {
                  let charClass = "text-zinc-800 dark:text-zinc-200";
                  if (char.isCorrect) {
                    charClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded-sm";
                  } else if (char.isMissing) {
                    charClass = "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 line-through px-1 rounded-sm";
                  } else if (char.isExtra) {
                    charClass = "text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1 rounded-sm";
                  }
                  return (
                    <span key={index} className={charClass}>
                      {char.word}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold flex flex-wrap gap-x-3 gap-y-1">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/20 border border-emerald-300 inline-block"></span> Phát âm đúng</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500/20 border border-rose-300 inline-block"></span> Bị thiếu / sai</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500/20 border border-amber-300 inline-block"></span> Dư thừa</span>
              </p>
            </div>
          )}

          {/* User's transcribed text */}
          {userText && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 block">Nhận diện được từ giọng nói:</span>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-all bg-white/40 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800/40">
                {userText}
              </p>
            </div>
          )}

          {/* Troubleshooting details */}
          {feedback?.details && feedback.details.length > 0 && (
            <div className="text-xs font-semibold text-zinc-555 dark:text-zinc-400 space-y-1 pt-1">
              {feedback.details.map((detail, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                  {detail}
                </div>
              ))}
            </div>
          )}

          {/* Playback & Try again row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
            {userAudioUrl && (
              <button
                onClick={toggleUserAudioPlayback}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white cursor-pointer active:scale-95 transition-all border-none"
              >
                {isPlayingUserAudio ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    Tạm dừng
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Nghe lại giọng bạn
                  </>
                )}
              </button>
            )}
            <button
              onClick={resetStateForSentence}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 dark:text-amber-400 cursor-pointer active:scale-95 transition-all border border-amber-200/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Luyện tập lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
