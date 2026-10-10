"use client";

import React from "react";
import type { ConceptualArea, ConceptualRelationship, EvidenceRecord } from "../../types/brief";

interface ContextualDetailPanelProps {
  area: ConceptualArea | null;
  allAreas: ConceptualArea[];
  relationships: ConceptualRelationship[];
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
  owner: string;
  repo: string;
  onSelectArea: (areaId: string) => void;
  onClose: () => void;
}

export default function ContextualDetailPanel({
  area,
  allAreas,
  relationships,
  evidenceMap,
  commitSha,
  owner,
  repo,
  onSelectArea,
  onClose,
}: ContextualDetailPanelProps) {
  if (!area) return null;

  // Find relationships
  const outgoingRels = relationships.filter((r) => r.fromAreaId === area.id);
  const incomingRels = relationships.filter((r) => r.toAreaId === area.id);

  // First associated file permalink
  const primaryFile = area.associatedFiles[0];
  const primaryEvidence = area.evidenceIds
    .map((id) => evidenceMap[id])
    .find((e) => e && e.filePath);

  const fileTarget = primaryEvidence?.filePath || primaryFile;
  const lineStart = primaryEvidence?.startLine;
  const lineEnd = primaryEvidence?.endLine;

  const githubUrl = fileTarget
    ? `https://github/${owner}/${repo}/blob/${commitSha}/${fileTarget.replace(/^\/+/, "")}${
        lineStart ? `#L${lineStart}${lineEnd && lineEnd > lineStart ? `-L${lineEnd}` : ""}` : ""
      }`.replace("https://github/", "https://github.com/")
    : null;

  // Find target of first outgoing relationship for "Jump to Next Step"
  const nextTargetArea = outgoingRels[0]
    ? allAreas.find((a) => a.id === outgoingRels[0]!.toAreaId)
    : null;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-zinc-900 shadow-md p-5 space-y-4 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {area.category || "Building Block"}
            </span>
            {area.associatedFiles.length > 0 && (
              <span className="text-[11px] font-mono text-zinc-400">
                {area.associatedFiles.length} file{area.associatedFiles.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {area.name}
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title="Close detail panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Role Explanation */}
      <div className="space-y-1">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
          Architectural Responsibility
        </span>
        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {area.role}
        </p>
      </div>

      {/* Next Step Guidance Callout */}
      {area.nextStep && (
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <span>✦</span>
              <span>Next Step Exploration</span>
            </span>
            <p className="text-xs text-indigo-900 dark:text-indigo-200">
              {area.nextStep}
            </p>
          </div>

          {nextTargetArea && (
            <button
              type="button"
              onClick={() => onSelectArea(nextTargetArea.id)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Explore {nextTargetArea.name} →
            </button>
          )}
        </div>
      )}

      {/* Connected Architecture Relationships */}
      {(outgoingRels.length > 0 || incomingRels.length > 0) && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Connected Subsystems
          </span>

          <div className="space-y-1.5 text-xs">
            {outgoingRels.map((rel, idx) => {
              const target = allAreas.find((a) => a.id === rel.toAreaId);
              if (!target) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-zinc-400">Calls / uses:</span>
                    <button
                      type="button"
                      onClick={() => onSelectArea(target.id)}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate"
                    >
                      {target.name}
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded shrink-0">
                    {rel.label}
                  </span>
                </div>
              );
            })}

            {incomingRels.map((rel, idx) => {
              const source = allAreas.find((a) => a.id === rel.fromAreaId);
              if (!source) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-zinc-400">Called by:</span>
                    <button
                      type="button"
                      onClick={() => onSelectArea(source.id)}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate"
                    >
                      {source.name}
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-200/60 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded shrink-0">
                    {rel.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Source Files Link (Compact & Non-dominant) */}
      {fileTarget && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 truncate">
            <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">{fileTarget}</span>
            {lineStart && <span className="text-indigo-600 dark:text-indigo-400 font-semibold">:L{lineStart}</span>}
          </div>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors shrink-0"
            >
              <span>Inspect Code</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
