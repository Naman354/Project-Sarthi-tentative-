"use client";

import React, { useState } from "react";
import type { ProjectBrief, EvidenceSummary } from "../../types/brief";
import CodebaseMapWorkbench from "./CodebaseMapWorkbench";
import ProjectDescriptionSection from "./ProjectDescriptionSection";
import GuidedReadingTimeline from "./GuidedReadingTimeline";
import ArchitectureHealthSection from "./ArchitectureHealthSection";
import CapabilityIndex from "./CapabilityIndex";
import AdaptiveVisualModel from "./visual-models/AdaptiveVisualModel";
import { ExternalLinkIcon } from "../Icons";

interface ProjectBriefViewProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing?: boolean;
}

export default function ProjectBriefView({
  brief,
  evidenceSummary,
  onRefresh,
  onReset,
  isRefreshing = false,
}: ProjectBriefViewProps) {
  const [activeNavSection, setActiveNavSection] = useState("overview");
  const [focusedAreaId, setFocusedAreaId] = useState<string | null>(null);

  const commitShort = brief.commitSha ? brief.commitSha.substring(0, 7) : "HEAD";
  const commitUrl = `https://github.com/${brief.owner}/${brief.repo}/tree/${brief.commitSha}`;

  const handleSelectNavSection = (section: string) => {
    setActiveNavSection(section);
    if (section === "map" || section === "overview") {
      const mapEl = document.getElementById("map-section");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const el = document.getElementById(`${section}-section`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleInspectAreaInMap = (areaId: string) => {
    setFocusedAreaId(areaId);
    setActiveNavSection("map");
    const mapEl = document.getElementById("map-section");
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-24">
      {/* =========================================================
          1. SLIM WORKBENCH STATUS & SNAPSHOT BAR
          ========================================================= */}
      <div
        className="p-3 sm:px-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            id="brief-explore-another-btn"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:text-white"
            style={{
              backgroundColor: "var(--bg-workspace)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span>←</span>
            <span>Explore Another</span>
          </button>

          <div
            className="h-4 w-px hidden sm:block"
            style={{ backgroundColor: "var(--border-default)" }}
          />

          {/* Repo Link */}
          <a
            href={brief.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors group"
            style={{ color: "var(--text-primary)" }}
          >
            <span className="group-hover:text-[var(--teal-bright)]">
              {brief.owner} / {brief.repo}
            </span>
            <ExternalLinkIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          </a>

          {/* Pinned Commit */}
          <a
            href={commitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono transition-colors"
            style={{
              backgroundColor: "var(--bg-workspace)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
            title="View this exact repository snapshot on GitHub"
          >
            <span style={{ color: "var(--text-muted)" }}>sha:</span>
            <span style={{ color: "var(--teal-bright)" }}>{commitShort}</span>
          </a>
        </div>

        {/* Right Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {brief.cached && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "rgba(85,184,121,0.12)",
                color: "var(--accent-green)",
                border: "1px solid rgba(85,184,121,0.25)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Cached Snapshot</span>
            </span>
          )}

          <button
            type="button"
            id="brief-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 hover:text-white"
            style={{
              backgroundColor: "var(--bg-workspace)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
            title="Re-run analysis and refresh"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[var(--teal-bright)]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? "Analyzing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Deterministic Fallback Alert if applicable */}
      {brief.generatedBy === "deterministic-fallback" && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            backgroundColor: "rgba(244,176,79,0.08)",
            border: "1px solid rgba(244,176,79,0.3)",
            color: "var(--accent-amber)",
          }}
        >
          <div className="shrink-0 mt-0.5 text-base">ℹ</div>
          <div className="flex-1 text-xs sm:text-sm">
            <p className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
              Analysis generated from repository manifests
            </p>
            <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {brief.limitationsAndGaps[0] ||
                "AI synthesis was unavailable. This overview was generated directly from repository manifests, documentation, and source inventory."}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          LEVEL 1: UNIFIED REPOSITORY HERO
          Technical Overview (Default) + Codebase Map (Alternate View)
          ========================================================= */}
      <section id="map-section" aria-label="Repository Explorer Workbench">
        <CodebaseMapWorkbench
          brief={brief}
          evidenceSummary={evidenceSummary}
          onExploreAnother={onReset}
          activeNavSection={activeNavSection}
          onSelectNavSection={handleSelectNavSection}
          focusedAreaId={focusedAreaId}
          onSelectArea={(id) => setFocusedAreaId(id)}
        />
      </section>

      {/* =========================================================
          LEVEL 2: WHAT THIS PROJECT IS ABOUT
          Editorial description of purpose, audience, and core behaviors
          ========================================================= */}
      <ProjectDescriptionSection
        brief={brief}
        onExploreCapabilities={() => handleSelectNavSection("capabilities")}
        onInspectArea={handleInspectAreaInMap}
      />

      {/* =========================================================
          LEVEL 3: WHERE TO START READING CODE
          Sequential guided reading timeline through entrypoints & core files
          ========================================================= */}
      {brief.guidedTour.length > 0 && (
        <GuidedReadingTimeline
          steps={brief.guidedTour}
          owner={brief.owner}
          repo={brief.repo}
          commitSha={brief.commitSha}
        />
      )}

      {/* =========================================================
          LEVEL 4: ARCHITECTURE HEALTH ASSESSMENT
          Rigorous calculated signals: Docs, Coupling, Balance, Cycles, Connectivity
          ========================================================= */}
      <ArchitectureHealthSection
        brief={brief}
        evidenceSummary={evidenceSummary}
        onNavigateToTopology={() => handleSelectNavSection("topology")}
      />

      {/* =========================================================
          LEVEL 5: CONCRETE CAPABILITIES INDEX
          Domain-grouped capabilities with evidence badges
          ========================================================= */}
      {brief.capabilities.length > 0 && (
        <CapabilityIndex
          capabilities={brief.capabilities}
          areas={brief.conceptualMap.areas}
          onInspectArea={handleInspectAreaInMap}
        />
      )}

      {/* =========================================================
          LEVEL 6: DEEP ARCHITECTURAL TOPOLOGY
          Deep structural topology adapted to repository category
          ========================================================= */}
      <section id="topology-section" aria-label="Deep Architectural Topology">
        <AdaptiveVisualModel
          areas={brief.conceptualMap.areas}
          relationships={brief.conceptualMap.relationships}
          projectCategory={brief.technicalOverview.projectCategory}
          evidenceMap={brief.evidenceMap}
          commitSha={brief.commitSha}
          owner={brief.owner}
          repo={brief.repo}
        />
      </section>

      {/* =========================================================
          LEVEL 7: ANALYSIS GAPS & KNOWN LIMITATIONS
          ========================================================= */}
      {brief.limitationsAndGaps.length > 0 && brief.generatedBy !== "deterministic-fallback" && (
        <section
          className="rounded-2xl p-5 sm:p-6 space-y-2.5"
          style={{
            backgroundColor: "rgba(244,176,79,0.05)",
            border: "1px solid rgba(244,176,79,0.25)",
          }}
        >
          <h3
            className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: "var(--accent-amber)" }}
          >
            <span>Analysis Gaps &amp; Known Limitations</span>
          </h3>
          <ul
            className="list-disc list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {brief.limitationsAndGaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
