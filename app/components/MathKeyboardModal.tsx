"use client";

import { useEffect, useRef, useCallback } from "react";
import type { MathfieldElement } from "mathlive";

interface MathKeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (latex: string) => void;
  initialValue?: string;
}

export function MathKeyboardModal({
  isOpen,
  onClose,
  onConfirm,
  initialValue = "",
}: MathKeyboardModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathfieldRef = useRef<MathfieldElement | null>(null);
  const latexRef = useRef(initialValue);

  useEffect(() => {
    if (!isOpen) return;

    let mathfield: MathfieldElement | null = null;

    const initMathfield = async () => {
      const mathlive = await import("mathlive");
      mathlive.MathfieldElement.fontsDirectory =
        "https://unpkg.com/mathlive@0.108.2/fonts/";

      if (!containerRef.current) return;

      containerRef.current.innerHTML = "";

      mathfield = document.createElement("math-field") as MathfieldElement;
      mathfield.value = initialValue;
      mathfield.setAttribute("placeholder", "수식을 입력하세요");
      mathfield.style.width = "100%";
      mathfield.style.fontSize = "1.5rem";
      mathfield.style.padding = "1rem";
      mathfield.style.borderRadius = "0.75rem";
      mathfield.style.border = "2px solid #e2e8f0";
      mathfield.style.backgroundColor = "#ffffff";
      mathfield.style.minHeight = "80px";

      mathfield.addEventListener("input", () => {
        if (mathfieldRef.current) {
          latexRef.current = mathfieldRef.current.getValue("latex");
        }
      });

      containerRef.current.appendChild(mathfield);
      mathfieldRef.current = mathfield;
      latexRef.current = initialValue;

      setTimeout(() => mathfield?.focus(), 100);
    };

    initMathfield();

    return () => {
      if (mathfield) {
        mathfield.remove();
      }
      mathfieldRef.current = null;
    };
  }, [isOpen, initialValue]);

  const handleConfirm = useCallback(() => {
    onConfirm(latexRef.current);
  }, [onConfirm]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && e.metaKey) {
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            수식 키보드
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div ref={containerRef} className="min-h-[80px]" />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            MathLive 키보드를 사용하여 수식을 입력하세요
          </p>
        </div>

        <div className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
