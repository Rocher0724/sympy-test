"use client";

import { useEffect, useRef, useCallback } from "react";
import type { MathfieldElement } from "mathlive";

interface MathInputProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function MathInput({
  value,
  onChange,
  placeholder = "수식을 입력하세요",
  label,
  disabled = false,
}: MathInputProps) {
  const mathfieldRef = useRef<MathfieldElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (mathfieldRef.current) {
      onChange(mathfieldRef.current.getValue("latex"));
    }
  }, [onChange]);

  useEffect(() => {
    let mathfield: MathfieldElement | null = null;

    const initMathfield = async () => {
      await import("mathlive");

      if (!containerRef.current) return;

      mathfield = document.createElement("math-field") as MathfieldElement;
      mathfield.value = value;
      mathfield.setAttribute("placeholder", placeholder);
      mathfield.style.width = "100%";
      mathfield.style.fontSize = "1.25rem";
      mathfield.style.padding = "0.75rem";
      mathfield.style.borderRadius = "0.5rem";
      mathfield.style.border = "2px solid #e2e8f0";
      mathfield.style.backgroundColor = disabled ? "#f1f5f9" : "#ffffff";

      if (disabled) {
        mathfield.setAttribute("read-only", "true");
      }

      mathfield.addEventListener("input", handleInput);
      containerRef.current.appendChild(mathfield);
      mathfieldRef.current = mathfield;
    };

    initMathfield();

    return () => {
      if (mathfield) {
        mathfield.removeEventListener("input", handleInput);
        mathfield.remove();
      }
    };
  }, [placeholder, disabled, handleInput, value]);

  useEffect(() => {
    if (mathfieldRef.current && mathfieldRef.current.getValue("latex") !== value) {
      mathfieldRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div ref={containerRef} className="min-h-[60px]" />
      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
        LaTeX: {value || "(비어있음)"}
      </div>
    </div>
  );
}
