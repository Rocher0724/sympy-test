"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "../lib/types";

interface ProcessLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function ProcessLog({ logs, onClear }: ProcessLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-zinc-600 dark:text-zinc-400";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-700 dark:text-zinc-300">
          📜 처리 로그
        </h3>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            지우기
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="h-[200px] overflow-y-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-zinc-500">로그가 비어있습니다</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-500 shrink-0">
                [{formatTime(log.timestamp)}]
              </span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
