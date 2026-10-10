"use client";

import React, { useState } from "react";
import type { TechnicalOverview, EvidenceSummary } from "../../types/brief";

interface TechnicalOverviewPanelProps {
  overview: TechnicalOverview;
  evidenceSummary?: EvidenceSummary;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-emerald-500",
  Rust: "bg-orange-500",
  Go: "bg-cyan-500",
  Java: "bg-red-500",
  Ruby: "bg-rose-500",
  PHP: "bg-indigo-500",
  HTML: "bg-amber-500",
  CSS: "bg-purple-500",
  Markdown: "bg-zinc-400",
  Other: "bg-zinc-300",
};

export default function TechnicalOverviewPanel({
  overview,
  evidenceSummary,
}: TechnicalOverviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const languages = evidenceSummary?.languages || [];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Technical Overview &amp; Ecosystem Facts</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {overview.primaryLanguage} • {overview.ecosystem}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Languages, declared dependencies, runtime scripts, and project inventory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-6 animate-fade-in">
          {/* Language Breakdown Bar */}
          {languages.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                Language Distribution
              </span>
              {/* Multi-colored bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800 mb-2.5">
                {languages.map((l) => (
                  <div
                    key={l.language}
                    style={{ width: `${Math.max(l.percentage, 3)}%` }}
                    className={`${LANGUAGE_COLORS[l.language] || "bg-indigo-400"} transition-all`}
                    title={`${l.language}: ${l.percentage}% (${l.fileCount} files)`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                {languages.map((l) => (
                  <div key={l.language} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${LANGUAGE_COLORS[l.language] || "bg-indigo-400"}`} />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{l.language}</span>
                    <span className="text-zinc-400 text-[11px] font-mono">{l.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Total Files</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {overview.totalFiles}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Directories</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {overview.totalDirectories}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Dependencies</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {overview.dependencies.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">Ecosystem</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize mt-1 block">
                {overview.ecosystem}
              </span>
            </div>
          </div>

          {/* Entrypoints */}
          {overview.entryPoints.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Application Entry Points
              </span>
              <div className="flex flex-wrap gap-1.5">
                {overview.entryPoints.map((ep) => (
                  <span
                    key={ep}
                    className="font-mono text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium"
                  >
                    {ep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Declared Scripts */}
          {overview.scripts.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Declared Build &amp; Runtime Scripts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {overview.scripts.map((script) => (
                  <span
                    key={script}
                    className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                  >
                    {script}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies List */}
          {overview.dependencies.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Key Dependencies
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {overview.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
