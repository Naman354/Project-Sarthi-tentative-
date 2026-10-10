"use client";

import React, { useState } from "react";
import type { ProjectCapability, EvidenceRecord, EvidenceStatus } from "../../types/brief";

interface CapabilityCardProps {
  capability: ProjectCapability;
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
  owner: string;
  repo: string;
}

const STATUS_CONFIG: Record<
  EvidenceStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  documented: {
    label: "Documented",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  implementation_found: {
    label: "Implementation Found",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    dot: "bg-indigo-500",
  },
  test_found: {
    label: "Test Verified",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
    dot: "bg-cyan-500",
  },
  inferred: {
    label: "Inferred",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  unresolved: {
    label: "Unresolved",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
};

export default function CapabilityCard({
  capability,
  evidenceMap,
  commitSha,
  owner,
  repo,
}: CapabilityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[capability.evidenceStatus] || STATUS_CONFIG.inferred;

  const relevantEvidence = capability.evidenceIds
    .map((id) => evidenceMap[id])
    .filter(Boolean) as EvidenceRecord[];

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:shadow-xs transition-all p-4 sm:p-5 flex flex-col justify-between group">
      <div>
        {/* Header: Title & Subtle Status Indicator */}
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {capability.name}
          </h4>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${status.bg} ${status.text} ${status.border}`}
            title={`Claim verified: ${status.label}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span>{status.label}</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
          {capability.description}
        </p>

        {/* Primary Supporting Files */}
        {capability.primaryFiles.length > 0 && (
          <div className="mb-4">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
              Source Evidence Files
            </span>
            <div className="flex flex-wrap gap-1.5">
              {capability.primaryFiles.map((file) => {
                const targetUrl = `https://github.com/${owner}/${repo}/blob/${commitSha}/${file.replace(/^\/+/, "")}`;
                return (
                  <a
                    key={file}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-mono transition-colors"
                    title={`Open ${file} on GitHub pinned to ${commitSha.substring(0, 7)}`}
                  >
                    <span>{file}</span>
                    <svg
                      className="w-3 h-3 opacity-60"
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
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Supporting Evidence Toggle */}
      {relevantEvidence.length > 0 && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 transition-colors cursor-pointer"
          >
            <span>
              {expanded
                ? "Hide supporting evidence"
                : `Show ${relevantEvidence.length} supporting evidence item${relevantEvidence.length > 1 ? "s" : ""}`}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="mt-3 space-y-2.5 animate-fade-in">
              {relevantEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {ev.filePath}
                      {ev.startLine
                        ? ` (L${ev.startLine}${ev.endLine && ev.endLine !== ev.startLine ? `-L${ev.endLine}` : ""})`
                        : ""}
                    </span>
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-1 font-medium"
                      >
                        <span>GitHub</span>
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 text-[12px] mb-2">
                    {ev.description}
                  </p>
                  {ev.snippet && (
                    <pre className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-zinc-200 dark:border-zinc-800">
                      {ev.snippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
