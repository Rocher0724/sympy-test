"use client";

import { useEffect, useRef } from "react";
import type { MathfieldElement } from "mathlive";

interface RecognitionResultProps {
  latex: string;
  isSuccess: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onRetry: () => void;
  onEditWithKeyboard: () => void;
}

export function RecognitionResult({
  latex,
  isSuccess,
  errorMessage,
  onConfirm,
  onRetry,
  onEditWithKeyboard,
}: RecognitionResultProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!latex || !previewRef.current) return;

    let mathfield: MathfieldElement | null = null;

    const initPreview = async () => {
      const mathlive = await import("mathlive");
      mathlive.MathfieldElement.fontsDirectory =
        "https://unpkg.com/mathlive@0.108.2/fonts/";

      if (!previewRef.current) return;

      previewRef.current.innerHTML = "";

      mathfield = document.createElement("math-field") as MathfieldElement;
      mathfield.value = latex;
      mathfield.setAttribute("read-only", "true");
      mathfield.style.width = "100%";
      mathfield.style.fontSize = "1.5rem";
      mathfield.style.padding = "0.75rem";
      mathfield.style.borderRadius = "0.5rem";
      mathfield.style.border = "none";
      mathfield.style.backgroundColor = "transparent";

      previewRef.current.appendChild(mathfield);
    };

    initPreview();

    return () => {
      if (mathfield) {
        mathfield.remove();
      }
    };
  }, [latex]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div
        className={`px-4 py-2 ${
          isSuccess
            ? "bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800"
            : "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <>
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                인식 완료
              </span>
            </>
          ) : (
            <>
              <span className="text-amber-600 dark:text-amber-400">⚠</span>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {errorMessage || "인식 실패"}
              </span>
            </>
          )}
        </div>
      </div>

      {isSuccess && latex && (
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              인식된 수식
            </p>
            <div
              ref={previewRef}
              className="min-h-[60px] bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center"
            />
          </div>

          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              LaTeX 코드
            </p>
            <code className="block p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
              {latex}
            </code>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          🔄 다시 필기
        </button>
        <button
          type="button"
          onClick={onEditWithKeyboard}
          className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          ⌨️ 키보드로 수정
        </button>
        {isSuccess && (
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
          >
            ✓ 확인
          </button>
        )}
      </div>
    </div>
  );
}
