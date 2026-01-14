import type { ComparisonResult, LambdaApiResponse } from "./types";

export async function getCanonicalForm(
  latex: string
): Promise<LambdaApiResponse> {
  const response = await fetch(`/api/latex?str=${encodeURIComponent(latex)}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function compareWithLambda(
  latex1: string,
  latex2: string
): Promise<ComparisonResult> {
  const startTime = performance.now();

  try {
    const [result1, result2] = await Promise.all([
      getCanonicalForm(latex1),
      getCanonicalForm(latex2),
    ]);

    // Compare using expr_str (canonical form)
    const isEqual = result1.expr_str === result2.expr_str;

    return {
      isEqual,
      expr1Canonical: result1.expr_str,
      expr2Canonical: result2.expr_str,
      simplifiedDiff: isEqual
        ? "0"
        : `${result1.expr_str} - (${result2.expr_str})`,
      processingTimeMs: Math.round(performance.now() - startTime),
      engine: "lambda",
    };
  } catch (error) {
    return {
      isEqual: null,
      expr1Canonical: "",
      expr2Canonical: "",
      simplifiedDiff: "",
      processingTimeMs: Math.round(performance.now() - startTime),
      engine: "lambda",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
