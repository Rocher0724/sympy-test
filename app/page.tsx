"use client";

import { useState, useCallback } from "react";
import { usePyodide } from "./hooks/usePyodide";
import { MathInput } from "./components/MathInput";
import { ResultDisplay } from "./components/ResultDisplay";
import { TestCaseSelector } from "./components/TestCaseSelector";
import { ProcessLog } from "./components/ProcessLog";
import { LoadingOverlay } from "./components/LoadingOverlay";
import type { ComparisonResult } from "./lib/types";

export default function Home() {
  const [latex1, setLatex1] = useState("");
  const [latex2, setLatex2] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const { status, logs, compare, clearLogs } = usePyodide();

  const handleCompare = useCallback(async () => {
    if (!latex1.trim() || !latex2.trim()) return;

    setIsComparing(true);
    setResult(null);

    try {
      const comparisonResult = await compare(latex1, latex2);
      setResult(comparisonResult);
    } catch (error) {
      setResult({
        isEqual: null,
        expr1Canonical: "",
        expr2Canonical: "",
        simplifiedDiff: "",
        processingTimeMs: 0,
        engine: "sympy",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    } finally {
      setIsComparing(false);
    }
  }, [latex1, latex2, compare]);

  const handleTestCaseSelect = useCallback((l1: string, l2: string) => {
    setLatex1(l1);
    setLatex2(l2);
    setResult(null);
  }, []);

  return (
    <>
      <LoadingOverlay status={status} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-zinc-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
              🔬 LaTeX 수식 동등성 비교
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Pyodide + SymPy를 활용한 수학적 수식 비교 프로토타입
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  status === "ready"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : status === "loading"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : status === "error"
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === "ready"
                      ? "bg-green-500"
                      : status === "loading"
                      ? "bg-blue-500 animate-pulse"
                      : status === "error"
                      ? "bg-red-500"
                      : "bg-zinc-400"
                  }`}
                />
                {status === "ready"
                  ? "준비됨"
                  : status === "loading"
                  ? "로딩 중..."
                  : status === "error"
                  ? "오류"
                  : "대기 중"}
              </span>
            </div>
          </header>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
                  📝 수식 입력
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <MathInput
                    value={latex1}
                    onChange={setLatex1}
                    label="수식 1 (정답)"
                    placeholder="예: x+1"
                  />
                  <MathInput
                    value={latex2}
                    onChange={setLatex2}
                    label="수식 2 (유저 답)"
                    placeholder="예: 1+x"
                  />
                </div>

                <button
                  onClick={handleCompare}
                  disabled={!latex1.trim() || !latex2.trim() || isComparing}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {isComparing ? "비교 중..." : "🔍 수식 비교하기"}
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
                  📊 비교 결과
                </h2>
                <ResultDisplay result={result} isLoading={isComparing} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
                  📋 테스트 케이스
                </h2>
                <TestCaseSelector onSelect={handleTestCaseSelect} />
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6">
                <ProcessLog logs={logs} onClear={clearLogs} />
              </div>
            </div>
          </div>

          <footer className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p>
              이 프로토타입은 Pyodide를 통해 브라우저에서 SymPy를 실행하여
              <br />
              LaTeX 수식의 수학적 동등성을 검증합니다.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
