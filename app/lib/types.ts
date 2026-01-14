export type ComparisonEngine = "sympy" | "lambda" | "compute-engine";

export interface ComparisonResult {
  isEqual: boolean | null;
  expr1Canonical: string;
  expr2Canonical: string;
  simplifiedDiff: string;
  processingTimeMs: number;
  engine: ComparisonEngine;
  error?: string;
}

export interface LambdaApiResponse {
  expr_srepr: string;
  expr_str: string;
  latex: string;
}

export interface TestCase {
  id: string;
  category: "algebra" | "trigonometry" | "exponential" | "calculus";
  difficulty: "easy" | "medium" | "hard";
  latex1: string;
  latex2: string;
  expectedEqual: boolean;
  description: string;
}

export type PyodideStatus = "idle" | "loading" | "ready" | "error";

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export interface PyodideWorkerMessage {
  type: "init" | "compare" | "parse";
  payload?: {
    latex1?: string;
    latex2?: string;
    latex?: string;
  };
}

export interface PyodideWorkerResponse {
  type: "init-complete" | "compare-result" | "parse-result" | "error" | "log";
  payload?: ComparisonResult | string | LogEntry;
  error?: string;
}
