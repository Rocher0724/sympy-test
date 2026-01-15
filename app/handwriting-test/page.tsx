"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { HandwritingCanvas } from "../components/HandwritingCanvas";
import { MathKeyboardModal } from "../components/MathKeyboardModal";
import { RecognitionResult } from "../components/RecognitionResult";
import type { MathfieldElement } from "mathlive";

type InputMode = "idle" | "handwriting" | "result";

interface RecognitionState {
  latex: string;
  isSuccess: boolean;
  errorMessage?: string;
}

const SAMPLE_PROBLEMS = [
  {
    id: 1,
    question: "다음 함수를 미분하시오: f(x) = x^2 + 3x",
    questionLatex: "f(x) = x^2 + 3x",
    expectedAnswer: "2x + 3",
  },
  {
    id: 2,
    question: "다음 적분을 계산하시오",
    questionLatex: "\\int_0^1 x^2 \\, dx",
    expectedAnswer: "\\frac{1}{3}",
  },
  {
    id: 3,
    question: "다음 방정식의 해를 구하시오",
    questionLatex: "x^2 - 5x + 6 = 0",
    expectedAnswer: "x = 2 \\text{ 또는 } x = 3",
  },
];

export default function HandwritingTestPage() {
  const [currentProblem, setCurrentProblem] = useState(SAMPLE_PROBLEMS[0]);
  const [answer, setAnswer] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("idle");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] =
    useState<RecognitionState | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const questionPreviewRef = useRef<HTMLDivElement>(null);
  const answerPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initPreview = async (
      container: HTMLDivElement | null,
      latex: string
    ) => {
      if (!container || !latex) return;

      const mathlive = await import("mathlive");
      mathlive.MathfieldElement.fontsDirectory =
        "https://unpkg.com/mathlive@0.108.2/fonts/";

      container.innerHTML = "";

      const mathfield = document.createElement("math-field") as MathfieldElement;
      mathfield.value = latex;
      mathfield.setAttribute("read-only", "true");
      mathfield.style.fontSize = "1.25rem";
      mathfield.style.backgroundColor = "transparent";
      mathfield.style.border = "none";
      mathfield.style.pointerEvents = "none";

      container.appendChild(mathfield);
    };

    initPreview(questionPreviewRef.current, currentProblem.questionLatex);
  }, [currentProblem]);

  useEffect(() => {
    const initPreview = async (
      container: HTMLDivElement | null,
      latex: string
    ) => {
      if (!container) return;

      if (!latex) {
        container.innerHTML =
          '<span class="text-zinc-400 dark:text-zinc-500 text-sm">정답을 입력하세요</span>';
        return;
      }

      const mathlive = await import("mathlive");
      mathlive.MathfieldElement.fontsDirectory =
        "https://unpkg.com/mathlive@0.108.2/fonts/";

      container.innerHTML = "";

      const mathfield = document.createElement("math-field") as MathfieldElement;
      mathfield.value = latex;
      mathfield.setAttribute("read-only", "true");
      mathfield.style.fontSize = "1.25rem";
      mathfield.style.backgroundColor = "transparent";
      mathfield.style.border = "none";
      mathfield.style.pointerEvents = "none";

      container.appendChild(mathfield);
    };

    initPreview(answerPreviewRef.current, answer);
  }, [answer]);

  const handleRecognize = useCallback(async (imageData: string) => {
    setIsRecognizing(true);

    try {
      const response = await fetch("/api/recognize-math", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();

      if (data.success && data.latex) {
        setRecognitionResult({
          latex: data.latex,
          isSuccess: true,
        });
      } else {
        setRecognitionResult({
          latex: "",
          isSuccess: false,
          errorMessage: data.error || "수식을 인식하지 못했습니다",
        });
      }

      setInputMode("result");
    } catch (error) {
      setRecognitionResult({
        latex: "",
        isSuccess: false,
        errorMessage:
          error instanceof Error ? error.message : "인식 중 오류가 발생했습니다",
      });
      setInputMode("result");
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  const handleConfirmRecognition = useCallback(() => {
    if (recognitionResult?.latex) {
      setAnswer(recognitionResult.latex);
    }
    setInputMode("idle");
    setRecognitionResult(null);
  }, [recognitionResult]);

  const handleRetry = useCallback(() => {
    setInputMode("handwriting");
    setRecognitionResult(null);
  }, []);

  const handleOpenKeyboard = useCallback(() => {
    setIsKeyboardOpen(true);
  }, []);

  const handleKeyboardConfirm = useCallback((latex: string) => {
    setAnswer(latex);
    setIsKeyboardOpen(false);
    setInputMode("idle");
    setRecognitionResult(null);
  }, []);

  const handleProblemChange = useCallback((problemId: number) => {
    const problem = SAMPLE_PROBLEMS.find((p) => p.id === problemId);
    if (problem) {
      setCurrentProblem(problem);
      setAnswer("");
      setInputMode("idle");
      setRecognitionResult(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-zinc-950 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8 pt-16 lg:pt-8">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
            ✍️ 필기 수식 입력 테스트
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            펜, 터치, 마우스로 수식을 필기하여 LaTeX로 변환합니다
          </p>
        </header>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                📋 문제 선택
              </h2>
              <select
                value={currentProblem.id}
                onChange={(e) => handleProblemChange(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none"
              >
                {SAMPLE_PROBLEMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    문제 {p.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                {currentProblem.question}
              </p>
              <div
                ref={questionPreviewRef}
                className="min-h-[40px] flex items-center"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
              ✏️ 정답 입력
            </h2>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl min-h-[50px] flex items-center">
                <div ref={answerPreviewRef} className="flex-1" />
              </div>

              <button
                type="button"
                onClick={() => setInputMode("handwriting")}
                disabled={inputMode !== "idle"}
                className="p-3 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="필기 입력"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleOpenKeyboard}
                className="p-3 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-colors"
                title="키보드 입력"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </button>
            </div>

            {answer && (
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  LaTeX: {answer}
                </p>
              </div>
            )}
          </div>

          {inputMode === "handwriting" && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ✍️ 필기 영역
                </h2>
                <button
                  type="button"
                  onClick={() => setInputMode("idle")}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  닫기 ✕
                </button>
              </div>

              <HandwritingCanvas
                onImageReady={handleRecognize}
                isRecognizing={isRecognizing}
              />
            </div>
          )}

          {inputMode === "result" && recognitionResult && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <RecognitionResult
                latex={recognitionResult.latex}
                isSuccess={recognitionResult.isSuccess}
                errorMessage={recognitionResult.errorMessage}
                onConfirm={handleConfirmRecognition}
                onRetry={handleRetry}
                onEditWithKeyboard={handleOpenKeyboard}
              />
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
              💡 사용 방법
            </h2>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">1.</span>
                <span>
                  펜(✏️) 버튼을 눌러 필기 영역을 엽니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">2.</span>
                <span>
                  펜, 터치, 또는 마우스로 수식을 작성합니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">3.</span>
                <span>
                  &quot;인식하기&quot; 버튼을 눌러 LaTeX로 변환합니다
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">4.</span>
                <span>
                  결과를 확인하고, 필요시 키보드로 수정할 수 있습니다
                </span>
              </li>
            </ul>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <p>Gemini 2.5 Flash를 사용한 필기 수식 인식 테스트</p>
        </footer>
      </div>

      <MathKeyboardModal
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onConfirm={handleKeyboardConfirm}
        initialValue={recognitionResult?.latex || answer}
      />
    </div>
  );
}
