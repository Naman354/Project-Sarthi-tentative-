"use client";

import React, { useEffect, useState } from "react";
import { CheckIcon, RefreshIcon } from "../Icons";

interface AnalysisProgressModalProps {
  isOpen: boolean;
  onClose?: () => void;
  error?: string | null;
  isComplete: boolean;
}

const STAGES = [
  {
    id: 1,
    name: "Repository Synchronization",
    desc: "Cloning branch & checking git commit status",
  },
  { id: 2, name: "Technology Stack Detection", desc: "Detecting frameworks, runtimes & libraries" },
  {
    id: 3,
    name: "Static AST Code Parsing",
    desc: "Extracting routes, models, services & doc references",
  },
  {
    id: 4,
    name: "Graph Construction",
    desc: "Deduplicating entities & establishing relationship edges",
  },
  {
    id: 5,
    name: "Analysis Engine & Cycle Detection",
    desc: "Evaluating 5 health signals & running Tarjan cycle checks",
  },
  { id: 6, name: "Insight Synthesis", desc: "Generating actionable remediation advice & scoring" },
];

export function AnalysisProgressModal({ isOpen, error, isComplete }: AnalysisProgressModalProps) {
  const [activeStage, setActiveStage] = useState(1);

  useEffect(() => {
    if (!isOpen || isComplete) {
      return;
    }

    const interval = setInterval(() => {
      setActiveStage((prev) => (prev < 5 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen, isComplete]);

  const currentStage = isComplete ? 6 : activeStage;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <RefreshIcon className={`w-5 h-5 ${isComplete ? "" : "animate-spin"}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isComplete ? "Analysis Complete!" : "Analyzing Repository Architecture"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isComplete
                ? "Graph model, health metrics, and insights synthesized."
                : "Inspecting codebase structure and building relationships..."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <strong>Analysis Interrupted:</strong> {error}
          </div>
        )}

        <div className="space-y-3.5 my-6">
          {STAGES.map((stage) => {
            const isDone = isComplete || stage.id < currentStage;
            const isCurrent = !isComplete && stage.id === currentStage;

            return (
              <div
                key={stage.id}
                className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-800 dark:text-zinc-200"
                    : isCurrent
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200 shadow-sm shadow-indigo-500/10"
                      : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-800/60 opacity-50"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
                      {stage.id}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? "text-indigo-600 dark:text-indigo-400 font-bold"
                          : isDone
                            ? "text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-400"
                      }`}
                    >
                      {stage.name}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
