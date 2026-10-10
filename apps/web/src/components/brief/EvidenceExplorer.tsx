"use client";

import React, { useState } from "react";
import type { EvidenceRecord } from "../../types/brief";

interface EvidenceExplorerProps {
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
}

const TYPE_LABELS: Record<string, string> = {
  all: "All Evidence",
  documentation: "Documentation",
  manifest: "Manifests",
  source: "Source Code",
  test: "Tests",
  parser_entity: "Parsed Symbols",
};

export default function EvidenceExplorer({ evidenceMap }: EvidenceExplorerProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allRecords = Object.values(evidenceMap);

  const filteredRecords = allRecords.filter((rec) => {
    const matchesType = activeFilter === "all" || rec.type === activeFilter;
    const matchesSearch =
      !searchQuery ||
      rec.filePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Verified Source Evidence Bundle</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {allRecords.length} Items
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Every material claim in the Project Brief is traceable to these verified repository
            records
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files or description..."
            className="w-full md:w-64 px-3 py-1.5 pl-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/20 flex items-center gap-1.5 overflow-x-auto">
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const isActive = activeFilter === key;
          const count =
            key === "all" ? allRecords.length : allRecords.filter((r) => r.type === key).length;

          if (key !== "all" && count === 0) return null;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-indigo-700 text-indigo-100"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Evidence Cards List */}
      <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {record.id}
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {record.filePath}
                      {record.startLine
                        ? ` (L${record.startLine}${record.endLine && record.endLine !== record.startLine ? `-L${record.endLine}` : ""})`
                        : ""}
                    </span>
                  </div>

                  {record.url && (
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/50 shadow-xs transition-colors"
                      title="Open verified location on GitHub pinned to commit"
                    >
                      <span>Open on GitHub</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-2 leading-relaxed">
                  {record.description}
                </p>

                {record.snippet && (
                  <pre className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-zinc-200 dark:border-zinc-800">
                    {record.snippet}
                  </pre>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-zinc-500">
            No evidence records match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
