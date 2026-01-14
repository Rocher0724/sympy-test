"use client";

import type { PyodideStatus } from "../lib/types";

interface LoadingOverlayProps {
  status: PyodideStatus;
}

export function LoadingOverlay({ status }: LoadingOverlayProps) {
  if (status !== "loading") return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-2">
              Pyodide 로딩 중
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              SymPy 패키지를 설치하고 있습니다.
              <br />
              첫 로딩은 약 10~20초 소요됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
