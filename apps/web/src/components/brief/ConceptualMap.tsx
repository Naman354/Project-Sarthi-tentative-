"use client";

import React, { useState } from "react";
import type { ConceptualArea, ConceptualRelationship, EvidenceRecord } from "../../types/brief";

interface ConceptualMapProps {
  areas: ConceptualArea[];
  relationships: ConceptualRelationship[];
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
  owner: string;
  repo: string;
}

export default function ConceptualMap({
  areas,
  relationships,
  evidenceMap,
  commitSha,
  owner,
  repo,
}: ConceptualMapProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(areas[0]?.id || null);

  const selectedArea = areas.find((a) => a.id === selectedAreaId) || areas[0];

  // Find relationships involving the selected area
  const outgoingRels = relationships.filter((r) => r.fromAreaId === selectedArea?.id);
  const incomingRels = relationships.filter((r) => r.toAreaId === selectedArea?.id);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Conceptual Project Architecture</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {areas.length} Areas
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            High-level architectural parts and how they relate across the codebase
          </p>
        </div>

        <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline-block">
          Select an area below to inspect its responsibility and source files
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conceptual Areas Interactive Nodes */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Major Conceptual Areas
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {areas.map((area, index) => {
              const isSelected = area.id === selectedArea?.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setSelectedAreaId(area.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-sm ring-1 ring-indigo-500/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-zinc-200/80 dark:bg-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {index + 1}
                      </span>
                      {area.associatedFiles.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-400">
                          {area.associatedFiles.length} file
                          {area.associatedFiles.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-bold mb-1.5 ${isSelected ? "text-indigo-900 dark:text-indigo-200" : "text-zinc-900 dark:text-zinc-100"}`}
                    >
                      {area.name}
                    </h4>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {area.role}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-between text-[11px] font-semibold">
                    <span
                      className={
                        isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"
                      }
                    >
                      {isSelected ? "Active Area" : "Click to inspect"}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-indigo-500 translate-x-0.5" : "text-zinc-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Relationships Overview */}
          {relationships.length > 0 && (
            <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                Key Architectural Connections
              </span>
              <div className="space-y-2">
                {relationships.map((rel, idx) => {
                  const fromArea = areas.find((a) => a.id === rel.fromAreaId);
                  const toArea = areas.find((a) => a.id === rel.toAreaId);
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/50 text-xs flex flex-wrap items-center gap-2"
                    >
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {fromArea?.name || rel.fromAreaId}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[11px]">
                        → {rel.label} →
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {toArea?.name || rel.toAreaId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Area Inspection Drawer */}
        <div className="lg:col-span-5 bg-zinc-50/70 dark:bg-zinc-800/40 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700/60 flex flex-col justify-between">
          {selectedArea ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  Area Details
                </span>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedArea.name}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                  {selectedArea.role}
                </p>
              </div>

              {/* Connected Relationships for this area */}
              {(outgoingRels.length > 0 || incomingRels.length > 0) && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Area Interactions
                  </span>
                  <div className="space-y-1.5">
                    {outgoingRels.map((r, i) => {
                      const target = areas.find((a) => a.id === r.toAreaId);
                      return (
                        <div
                          key={`out-${i}`}
                          className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5"
                        >
                          <span className="text-indigo-500 font-bold">↳</span>
                          <span>{r.label}</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {target?.name || r.toAreaId}
                          </span>
                        </div>
                      );
                    })}
                    {incomingRels.map((r, i) => {
                      const source = areas.find((a) => a.id === r.fromAreaId);
                      return (
                        <div
                          key={`in-${i}`}
                          className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5"
                        >
                          <span className="text-emerald-500 font-bold">↰</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {source?.name || r.fromAreaId}
                          </span>
                          <span>{r.label} this area</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Associated Files */}
              {selectedArea.associatedFiles.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                    Associated Source Files
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedArea.associatedFiles.map((file) => {
                      const fileUrl = `https://github.com/${owner}/${repo}/blob/${commitSha}/${file.replace(/^\/+/, "")}`;
                      return (
                        <a
                          key={file}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 transition-colors group"
                        >
                          <span className="truncate">{file}</span>
                          <svg
                            className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evidence references */}
              {selectedArea.evidenceIds.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Supporting Verified Evidence
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedArea.evidenceIds.map((id) => {
                      const ev = evidenceMap[id];
                      return ev ? (
                        <span
                          key={id}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                          title={ev.description}
                        >
                          {ev.filePath}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Select an area to inspect details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
