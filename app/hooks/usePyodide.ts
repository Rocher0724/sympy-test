"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  PyodideStatus,
  ComparisonResult,
  LogEntry,
  PyodideWorkerResponse,
} from "../lib/types";

interface UsePyodideReturn {
  status: PyodideStatus;
  logs: LogEntry[];
  compare: (latex1: string, latex2: string) => Promise<ComparisonResult>;
  initPyodide: () => Promise<void>;
  clearLogs: () => void;
}

export function usePyodide(): UsePyodideReturn {
  const [status, setStatus] = useState<PyodideStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const statusRef = useRef<PyodideStatus>("idle");
  const pendingResolve = useRef<((result: ComparisonResult) => void) | null>(null);
  const pendingReject = useRef<((error: Error) => void) | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const updateStatus = useCallback((newStatus: PyodideStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    setLogs((prev) => [...prev, { timestamp: new Date(), message, type }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const createWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(
      new URL("../workers/pyodide.worker.ts", import.meta.url)
    );

    worker.onmessage = (event: MessageEvent<PyodideWorkerResponse>) => {
      const { type, payload, error } = event.data;

      if (type === "log" && payload && typeof payload === "object" && "message" in payload) {
        const logPayload = payload as { message: string; type: string };
        addLog(logPayload.message, logPayload.type as LogEntry["type"]);
      }

      if (type === "init-complete") {
        updateStatus("ready");
        addLog("Pyodide 준비 완료", "success");
      }

      if (type === "compare-result" && pendingResolve.current) {
        const result = payload as ComparisonResult;
        if (result.isEqual === true) {
          addLog(`결과: 동등함 ✅ (${result.processingTimeMs}ms)`, "success");
        } else if (result.isEqual === false) {
          addLog(`결과: 다름 ❌ (${result.processingTimeMs}ms)`, "warning");
        } else {
          addLog(`결과: 비교 불가 ⚠️`, "error");
        }
        pendingResolve.current(result);
        pendingResolve.current = null;
        pendingReject.current = null;
      }

      if (type === "error" && pendingReject.current) {
        addLog(`에러: ${error}`, "error");
        pendingReject.current(new Error(error));
        pendingResolve.current = null;
        pendingReject.current = null;
      }
    };

    worker.onerror = (error) => {
      updateStatus("error");
      addLog(`Worker 에러: ${error.message}`, "error");
      if (pendingReject.current) {
        pendingReject.current(new Error(error.message));
        pendingResolve.current = null;
        pendingReject.current = null;
      }
    };

    workerRef.current = worker;
    return worker;
  }, [addLog, updateStatus]);

  const initPyodide = useCallback(async (): Promise<void> => {
    if (statusRef.current === "ready") return;
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = new Promise<void>((resolve) => {
      updateStatus("loading");
      const worker = createWorker();

      const handleReady = (event: MessageEvent<PyodideWorkerResponse>) => {
        if (event.data.type === "init-complete") {
          worker.removeEventListener("message", handleReady);
          resolve();
        }
      };

      worker.addEventListener("message", handleReady);
      worker.postMessage({ type: "init" });
    });

    return initPromiseRef.current;
  }, [createWorker, updateStatus]);

  const compare = useCallback(
    async (latex1: string, latex2: string): Promise<ComparisonResult> => {
      if (statusRef.current !== "ready") {
        await initPyodide();
      }

      return new Promise((resolve, reject) => {
        pendingResolve.current = resolve;
        pendingReject.current = reject;
        workerRef.current?.postMessage({
          type: "compare",
          payload: { latex1, latex2 },
        });
      });
    },
    [initPyodide]
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { status, logs, compare, initPyodide, clearLogs };
}
