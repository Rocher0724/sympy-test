"use client";

import type { ComparisonResult } from "../lib/types";

interface ResultDisplayProps {
  result: ComparisonResult | null;
  isLoading: boolean;
}

export function ResultDisplay({ result, isLoading }: ResultDisplayProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-blue-700 dark:text-blue-300 font-medium">
            수식 비교 중...
          </span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-zinc-500 dark:text-zinc-400">
        두 수식을 입력하고 비교 버튼을 클릭하세요
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚠️</span>
          <span className="text-red-700 dark:text-red-300 font-bold text-lg">
            비교 실패
          </span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm font-mono">
          {result.error}
        </p>
        {result.engine && (
          <p className="text-red-500 dark:text-red-500 text-xs mt-2">
            사용 엔진: {result.engine}
          </p>
        )}
      </div>
    );
  }

  const isEqual = result.isEqual;
  const borderColor = isEqual
    ? "border-green-300 dark:border-green-700"
    : "border-red-300 dark:border-red-700";
  const bgColor = isEqual
    ? "bg-green-50 dark:bg-green-950"
    : "bg-red-50 dark:bg-red-950";

  return (
    <div className={`rounded-xl border-2 ${borderColor} ${bgColor} p-6`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-3xl">{isEqual ? "✅" : "❌"}</span>
        <span
          className={`font-bold text-xl ${
            isEqual
              ? "text-green-700 dark:text-green-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {isEqual ? "수학적으로 동등합니다!" : "수학적으로 다릅니다"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            수식 1 (Canonical)
          </div>
          <div className="font-mono text-sm text-zinc-800 dark:text-zinc-200">
            {result.expr1Canonical}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            수식 2 (Canonical)
          </div>
          <div className="font-mono text-sm text-zinc-800 dark:text-zinc-200">
            {result.expr2Canonical}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            차이 (단순화)
          </div>
          <div className="font-mono text-sm text-zinc-800 dark:text-zinc-200">
            {result.simplifiedDiff}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <span>처리 시간: {result.processingTimeMs}ms</span>
          <span>엔진: {result.engine}</span>
        </div>
      </div>
    </div>
  );
}
