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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 sm:p-8"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-3.5 mb-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: "rgba(0, 194, 203, 0.12)",
              border: "1px solid rgba(0, 194, 203, 0.3)",
              color: "var(--teal-bright)",
            }}
          >
            <RefreshIcon className={`w-5 h-5 ${isComplete ? "" : "animate-spin"}`} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              {isComplete ? "Analysis Complete!" : "Analyzing Repository Architecture"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isComplete
                ? "Graph model, health metrics, and insights synthesized."
                : "Inspecting codebase structure and building relationships..."}
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl border text-xs"
            style={{
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "#f87171",
            }}
          >
            <strong>Analysis Interrupted:</strong> {error}
          </div>
        )}

        <div className="space-y-3 my-6">
          {STAGES.map((stage) => {
            const isDone = isComplete || stage.id < currentStage;
            const isCurrent = !isComplete && stage.id === currentStage;

            return (
              <div
                key={stage.id}
                className="flex items-start gap-3.5 p-3 rounded-xl border transition-all duration-300"
                style={{
                  backgroundColor: isDone
                    ? "rgba(16, 185, 129, 0.06)"
                    : isCurrent
                      ? "rgba(0, 194, 203, 0.1)"
                      : "var(--bg-surface)",
                  borderColor: isDone
                    ? "rgba(16, 185, 129, 0.25)"
                    : isCurrent
                      ? "var(--teal-primary)"
                      : "var(--border-subtle)",
                  opacity: isDone || isCurrent ? 1 : 0.45,
                  boxShadow: isCurrent ? "0 0 15px rgba(0, 194, 203, 0.15)" : "none",
                }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-xs font-bold">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--teal-bright)] border-t-transparent animate-spin" />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] text-[var(--text-muted)] font-mono"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      {stage.id}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? "text-[var(--teal-bright)] font-bold"
                          : isDone
                            ? "text-white font-semibold"
                            : "text-[var(--text-muted)]"
                      }`}
                    >
                      {stage.name}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
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
