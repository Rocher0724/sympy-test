/// <reference lib="webworker" />

import type { PyodideInterface } from "pyodide";
import type { PyodideWorkerMessage } from "../lib/types";

declare const self: DedicatedWorkerGlobalScope & {
  loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
};

let pyodide: PyodideInterface | null = null;

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";

const SYMPY_COMPARISON_CODE = String.raw`
from sympy import simplify, Symbol, sympify, symbols, sin, cos, tan, exp, log, ln, sqrt, pi, E, I, oo
from sympy import Integral, Derivative, Limit
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import json
import re

transformations = standard_transformations + (implicit_multiplication_application,)

def latex_to_sympy(latex_str: str):
    s = latex_str.strip()
    
    # Debug: print what we receive
    print(f"DEBUG latex_to_sympy input: {repr(s)}")
    
    # Step 1: Handle constants FIRST (before any structural changes)
    # In LaTeX from MathLive, backslash comes as literal backslash
    # Use explicit multiplication to avoid ambiguity like "ipi" being parsed wrong
    s = s.replace('\\pi', '*pi')
    s = s.replace('\\infty', ' oo ')
    
    # Handle imaginary unit: standalone 'i' should be I (imaginary unit)
    # This must be done carefully to not affect variables like 'sin', 'exp', etc.
    import re as regex
    s = regex.sub(r'\bi\b', 'I', s)
    
    # Step 2: Handle fractions (may contain constants)
    s = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'((\g<1>)/(\g<2>))', s)
    
    # Step 3: Handle sqrt
    s = re.sub(r'\\sqrt\{([^}]+)\}', r'sqrt(\g<1>)', s)
    
    # Step 4: Handle trig functions with powers
    s = re.sub(r'\\sin\^2\s*[\(\{]([^\)\}]+)[\)\}]', r'sin(\g<1>)**2', s)
    s = re.sub(r'\\cos\^2\s*[\(\{]([^\)\}]+)[\)\}]', r'cos(\g<1>)**2', s)
    
    # Step 5: Handle trig functions
    s = re.sub(r'\\sin[\(\{]([^\)\}]+)[\)\}]', r'sin(\g<1>)', s)
    s = re.sub(r'\\cos[\(\{]([^\)\}]+)[\)\}]', r'cos(\g<1>)', s)
    s = re.sub(r'\\tan[\(\{]([^\)\}]+)[\)\}]', r'tan(\g<1>)', s)
    
    # Step 6: Handle log/ln/exp
    s = re.sub(r'\\ln[\(\{]([^\)\}]+)[\)\}]', r'log(\g<1>)', s)
    s = re.sub(r'\\log[\(\{]([^\)\}]+)[\)\}]', r'log(\g<1>)', s)
    s = re.sub(r'\\exp[\(\{]([^\)\}]+)[\)\}]', r'exp(\g<1>)', s)
    
    # Step 7: Handle e^{...} -> exp(...) - must be after constants
    s = re.sub(r'e\^\{([^}]+)\}', r'exp(\g<1>)', s)
    
    # Step 8: Handle other exponents with braces
    s = re.sub(r'([a-zA-Z0-9])\^\{([^}]+)\}', r'\g<1>**(\g<2>)', s)
    
    # Step 9: Handle simple exponents
    s = re.sub(r'([a-zA-Z0-9])\^([0-9]+)', r'\g<1>**\g<2>', s)
    
    # Step 10: Cleanup
    s = re.sub(r'\\cdot', '*', s)
    s = s.replace('^', '**')
    s = s.replace('\\,', '')
    s = re.sub(r'\s+', '', s)  # Remove all whitespace
    
    print(f"DEBUG after processing: {repr(s)}")
    
    # Handle limits - match original string first
    lim_match = re.match(r'\\lim_\{([a-z])\\to([^}]+)\}(.+)', latex_str.strip())
    if lim_match:
        var, point, expr_str = lim_match.groups()
        point = point.replace('\\infty', 'oo').replace('0', '0')
        inner = latex_to_sympy(expr_str)
        return Limit(inner, Symbol(var), sympify(point))
    
    # Handle definite integrals
    int_match = re.match(r'\\int_([^\^]+)\^([^\s]+)(.+?)d([a-z])', latex_str.strip())
    if int_match:
        lower, upper, expr_str, var = int_match.groups()
        inner = latex_to_sympy(expr_str)
        return Integral(inner, (Symbol(var), sympify(lower), sympify(upper)))
    
    # Handle indefinite integrals
    indef_match = re.match(r'\\int(.+?)d([a-z])', latex_str.strip())
    if indef_match:
        expr_str, var = indef_match.groups()
        inner = latex_to_sympy(expr_str)
        return Integral(inner, Symbol(var))
    
    # Handle derivatives
    deriv_match = re.match(r'\\frac\{d\}\{d([a-z])\}(.+)', latex_str.strip())
    if deriv_match:
        var, expr_str = deriv_match.groups()
        inner = latex_to_sympy(expr_str)
        return Derivative(inner, Symbol(var))
    
    return parse_expr(s, transformations=transformations)

def compare_latex(latex1: str, latex2: str) -> dict:
    from sympy import trigsimp, expand, N, Abs, re as real_part, im as imag_part
    try:
        expr1 = latex_to_sympy(latex1)
        expr2 = latex_to_sympy(latex2)
        
        # Evaluate derivatives, integrals, limits
        if hasattr(expr1, 'doit'):
            expr1 = expr1.doit()
        if hasattr(expr2, 'doit'):
            expr2 = expr2.doit()
        
        diff = expr1 - expr2
        
        # Try multiple simplification strategies
        simplified_diff = simplify(diff)
        is_equal = simplified_diff == 0 or simplified_diff.is_zero
        
        # If not zero, try trigsimp (helps with Euler's formula)
        if not is_equal:
            trig_simplified = trigsimp(simplified_diff)
            is_equal = trig_simplified == 0 or trig_simplified.is_zero
            if is_equal:
                simplified_diff = trig_simplified
        
        # If still not zero, try expand + simplify
        if not is_equal:
            expanded = simplify(expand(diff))
            is_equal = expanded == 0 or expanded.is_zero
            if is_equal:
                simplified_diff = expanded
        
        # Try rewrite with exp and simplify (for Euler's formula)
        if not is_equal:
            try:
                from sympy import cos, sin
                rewritten = simplify(diff.rewrite(cos, sin))
                is_equal = rewritten == 0 or rewritten.is_zero
                if is_equal:
                    simplified_diff = rewritten
            except:
                pass
        
        # If still not zero, try numerical evaluation (for complex numbers like e^(i*pi))
        if not is_equal:
            try:
                numerical_diff = N(simplified_diff)
                # For complex numbers, check both real and imaginary parts
                if hasattr(numerical_diff, 'is_number') and numerical_diff.is_number:
                    real_val = abs(float(real_part(numerical_diff).evalf()))
                    imag_val = abs(float(imag_part(numerical_diff).evalf()))
                    if real_val < 1e-10 and imag_val < 1e-10:
                        is_equal = True
                        simplified_diff = 0
            except:
                pass
        
        return {
            "isEqual": bool(is_equal) if is_equal is not None else None,
            "expr1Canonical": str(expr1),
            "expr2Canonical": str(expr2),
            "simplifiedDiff": str(simplified_diff),
            "engine": "sympy",
            "error": None
        }
    except Exception as e:
        return {
            "isEqual": None,
            "expr1Canonical": "",
            "expr2Canonical": "",
            "simplifiedDiff": "",
            "engine": "sympy",
            "error": str(e)
        }

def parse_single_latex(latex: str) -> dict:
    try:
        expr = latex_to_sympy(latex)
        if hasattr(expr, 'doit'):
            expr = expr.doit()
        return {
            "success": True,
            "result": str(expr),
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "result": None,
            "error": str(e)
        }
`;

async function initPyodide() {
  if (pyodide) return;

  self.postMessage({ type: "log", payload: { message: "Pyodide 로딩 시작...", type: "info" } });

  importScripts(`${PYODIDE_CDN}pyodide.js`);
  pyodide = await self.loadPyodide({ indexURL: PYODIDE_CDN });

  self.postMessage({ type: "log", payload: { message: "Pyodide 로드 완료", type: "success" } });
  self.postMessage({ type: "log", payload: { message: "SymPy 패키지 설치 중...", type: "info" } });

  await pyodide.loadPackage(["sympy"]);

  self.postMessage({ type: "log", payload: { message: "SymPy 설치 완료", type: "success" } });

  pyodide.runPython(SYMPY_COMPARISON_CODE);

  self.postMessage({ type: "log", payload: { message: "비교 함수 준비 완료", type: "success" } });
}

self.onmessage = async (event: MessageEvent<PyodideWorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    if (type === "init") {
      await initPyodide();
      self.postMessage({ type: "init-complete" });
      return;
    }

    if (!pyodide) {
      await initPyodide();
    }

    if (type === "compare" && payload?.latex1 && payload?.latex2) {
      const startTime = performance.now();

      self.postMessage({
        type: "log",
        payload: { message: `parse_latex("${payload.latex1}")`, type: "info" },
      });
      self.postMessage({
        type: "log",
        payload: { message: `parse_latex("${payload.latex2}")`, type: "info" },
      });

      const result = pyodide!.runPython(`
import json
result = compare_latex(${JSON.stringify(payload.latex1)}, ${JSON.stringify(payload.latex2)})
json.dumps(result)
      `);

      const parsed = JSON.parse(result);
      parsed.processingTimeMs = Math.round(performance.now() - startTime);

      self.postMessage({ type: "compare-result", payload: parsed });
    }

    if (type === "parse" && payload?.latex) {
      const result = pyodide!.runPython(`
import json
result = parse_single_latex(${JSON.stringify(payload.latex)})
json.dumps(result)
      `);

      self.postMessage({ type: "parse-result", payload: JSON.parse(result) });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
