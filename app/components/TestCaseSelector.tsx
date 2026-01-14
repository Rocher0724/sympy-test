"use client";

import { useState } from "react";
import { testCases, categoryLabels, difficultyLabels } from "../lib/test-cases";
import type { TestCase } from "../lib/types";

interface TestCaseSelectorProps {
  onSelect: (latex1: string, latex2: string) => void;
}

export function TestCaseSelector({ onSelect }: TestCaseSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TestCase["category"] | "all">("all");

  const categories: (TestCase["category"] | "all")[] = [
    "all",
    "algebra",
    "trigonometry",
    "exponential",
    "calculus",
  ];

  const filteredCases =
    activeCategory === "all"
      ? testCases
      : testCases.filter((tc) => tc.category === activeCategory);

  const getDifficultyColor = (difficulty: TestCase["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {cat === "all" ? "전체" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
        {filteredCases.map((tc) => (
          <button
            key={tc.id}
            onClick={() => onSelect(tc.latex1, tc.latex2)}
            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                {tc.description}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate mt-1">
                {tc.latex1} {tc.expectedEqual ? "=" : "≠"} {tc.latex2}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(
                  tc.difficulty
                )}`}
              >
                {difficultyLabels[tc.difficulty]}
              </span>
              <span className="text-lg">{tc.expectedEqual ? "✓" : "✗"}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
