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
    <div
      className="rounded-2xl p-5 space-y-4 animate-fade-in"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top Header */}
      <div
        className="flex items-start justify-between gap-3 pb-3 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              {area.category || "Subsystem"}
            </span>
            {area.associatedFiles.length > 0 && (
              <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                {area.associatedFiles.length} file{area.associatedFiles.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h4
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {area.name}
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg transition-colors cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          title="Close detail panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Role Explanation */}
      <div className="space-y-1">
        <span
          className="text-[11px] font-bold uppercase tracking-wider block"
          style={{ color: "var(--text-muted)" }}
        >
          Role in this project
        </span>
        <p
          className="text-xs sm:text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {area.role}
        </p>
      </div>

      {/* Next Step Guidance Callout */}
      {area.nextStep && (
        <div
          className="p-3 rounded-xl flex items-start justify-between gap-3"
          style={{
            backgroundColor: "rgba(15,138,131,0.08)",
            border: "1px solid rgba(15,138,131,0.25)",
          }}
        >
          <div className="space-y-0.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
              style={{ color: "var(--teal-bright)" }}
            >
              <span>✦</span>
              <span>Where to explore next</span>
            </span>
            <p className="text-xs" style={{ color: "var(--text-primary)" }}>
              {area.nextStep}
            </p>
          </div>

          {nextTargetArea && (
            <button
              type="button"
              onClick={() => onSelectArea(nextTargetArea.id)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                backgroundColor: "var(--teal-primary)",
                color: "var(--text-primary)",
              }}
            >
              Explore {nextTargetArea.name} →
            </button>
          )}
        </div>
      )}

      {/* Connected Architecture Relationships */}
      {(outgoingRels.length > 0 || incomingRels.length > 0) && (
        <div className="space-y-2 pt-1">
          <span
            className="text-[11px] font-bold uppercase tracking-wider block"
            style={{ color: "var(--text-muted)" }}
          >
            How it connects
          </span>

          <div className="space-y-1.5 text-xs">
            {outgoingRels.map((rel, idx) => {
              const target = allAreas.find((a) => a.id === rel.toAreaId);
              if (!target) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span style={{ color: "var(--text-muted)" }}>Calls / uses:</span>
                    <button
                      type="button"
                      onClick={() => onSelectArea(target.id)}
                      className="font-semibold transition-colors cursor-pointer truncate"
                      style={{ color: "var(--teal-bright)" }}
                    >
                      {target.name}
                    </button>
                  </div>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: "var(--text-secondary)",
                    }}
                  >
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
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span style={{ color: "var(--text-muted)" }}>Called by:</span>
                    <button
                      type="button"
                      onClick={() => onSelectArea(source.id)}
                      className="font-semibold transition-colors cursor-pointer truncate"
                      style={{ color: "var(--accent-orange)" }}
                    >
                      {source.name}
                    </button>
                  </div>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {rel.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Source Files Link */}
      {fileTarget && (
        <div
          className="pt-2 border-t flex items-center justify-between"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="flex items-center gap-1.5 font-mono text-[11px] truncate"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="truncate">{fileTarget}</span>
            {lineStart && <span style={{ color: "var(--teal-bright)" }}>:L{lineStart}</span>}
          </div>

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0"
              style={{
                color: "var(--teal-bright)",
                backgroundColor: "rgba(15,138,131,0.1)",
              }}
            >
              <span>Inspect Code</span>
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
      )}
    </div>
  );
}
