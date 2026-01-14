"use client";

import { useEffect, useRef } from "react";
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
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  onChangeRef.current = onChange;

  useEffect(() => {
    let mathfield: MathfieldElement | null = null;
    let isMounted = true;

    const initMathfield = async () => {
      const mathlive = await import("mathlive");

      mathlive.MathfieldElement.fontsDirectory =
        "https://unpkg.com/mathlive@0.108.2/fonts/";

      if (!containerRef.current || !isMounted) return;

      mathfield = document.createElement("math-field") as MathfieldElement;
      mathfield.value = initialValueRef.current;
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

      const handleInput = () => {
        if (mathfieldRef.current) {
          onChangeRef.current(mathfieldRef.current.getValue("latex"));
        }
      };

      mathfield.addEventListener("input", handleInput);
      containerRef.current.appendChild(mathfield);
      mathfieldRef.current = mathfield;
    };

    initMathfield();

    return () => {
      isMounted = false;
      if (mathfield) {
        mathfield.remove();
      }
    };
  }, [placeholder, disabled]);

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
