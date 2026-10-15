"use client";

import React, { useState, useMemo } from "react";
import type { ProjectBrief, EvidenceSummary } from "../../types/brief";
import type { InsightItem } from "../../types/project";
import {
  ShieldCheckIcon,
  ArrowRightIcon,
  NetworkGraphIcon,
  SparklesIcon,
  SearchIcon,
} from "../Icons";

interface ArchitectureHealthSectionProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  storedInsights?: InsightItem[];
  onNavigateToTopology?: () => void;
  onLocateInGraph?: (nodeOrModule: string) => void;
}

export type HealthSignalStatus = "healthy" | "needs-attention" | "insufficient-data";

export interface ArchitecturalSignal {
  id: string;
  name: string;
  score: number | null; // null if insufficient data
  status: HealthSignalStatus;
  statusLabel: string;
  metricLabel: string;
  explanation: string;
  whyItMatters: string;
  details?: Record<string, unknown>;
}

// DFS Cycle detection on directed module connections
function detectDependencyCycles(
  areas: ProjectBrief["conceptualMap"]["areas"],
  relationships: ProjectBrief["conceptualMap"]["relationships"]
): string[][] {
  const adj = new Map<string, string[]>();
  const nameMap = new Map<string, string>();

  areas.forEach((a) => {
    adj.set(a.id, []);
    nameMap.set(a.id, a.name);
  });

  relationships.forEach((r) => {
    if (adj.has(r.fromAreaId)) {
      adj.get(r.fromAreaId)?.push(r.toAreaId);
    }
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  const dfs = (curr: string, path: string[]) => {
    visited.add(curr);
    recStack.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        dfs(next, path);
      } else if (recStack.has(next)) {
        const cycleStartIndex = path.indexOf(next);
        if (cycleStartIndex !== -1) {
          const cycleNames = path.slice(cycleStartIndex).map((id) => nameMap.get(id) || id);
          cycleNames.push(nameMap.get(next) || next);
          cycles.push(cycleNames);
        }
      }
    }

    path.pop();
    recStack.delete(curr);
  };

  areas.forEach((a) => {
    if (!visited.has(a.id)) {
      dfs(a.id, []);
    }
  });

  return cycles;
}

export function evaluateArchitectureHealth(brief: ProjectBrief, evidenceSummary?: EvidenceSummary) {
  const areas = brief.conceptualMap.areas || [];
  const relationships = brief.conceptualMap.relationships || [];
  const totalFiles = evidenceSummary?.totalFiles || brief.technicalOverview.totalFiles || 0;
  const capabilities = brief.capabilities || [];

  // 1. Documentation Coverage
  const docFilesCount =
    evidenceSummary?.fileCategories?.find((c) => c.category === "documentation")?.count ??
    Object.values(brief.evidenceMap).filter((e) => e.type === "documentation").length;
  const documentedCaps = capabilities.filter((c) => c.evidenceStatus === "documented").length;
  const totalCaps = capabilities.length;

  let docScore: number | null = null;
  let docStatus: HealthSignalStatus = "insufficient-data";
  let docExplanation = "";

  if (totalFiles === 0 && totalCaps === 0) {
    docStatus = "insufficient-data";
    docExplanation =
      "Repository analysis did not catalog files or capabilities for documentation checking.";
  } else if (docFilesCount === 0 && documentedCaps === 0) {
    docScore = 0;
    docStatus = "needs-attention";
    docExplanation =
      "No dedicated documentation files (README or docs/) or verified documented capabilities detected.";
  } else {
    const capRatio = totalCaps > 0 ? (documentedCaps / totalCaps) * 60 : 30;
    const docFileRatio = docFilesCount > 0 ? 40 : 10;
    docScore = Math.min(100, Math.round(capRatio + docFileRatio));
    docStatus = docScore >= 65 ? "healthy" : "needs-attention";
    docExplanation =
      docScore >= 65
        ? `${docFilesCount} doc file(s) and ${documentedCaps}/${totalCaps} documented capabilities verified.`
        : `Partial documentation: ${documentedCaps}/${totalCaps} capabilities documented with ${docFilesCount} guide files.`;
  }

  const docSignal: ArchitecturalSignal = {
    id: "doc-coverage",
    name: "Documentation Coverage",
    score: docScore,
    status: docStatus,
    statusLabel:
      docStatus === "healthy"
        ? "Healthy"
        : docStatus === "needs-attention"
          ? "Needs Attention"
          : "Insufficient Data",
    metricLabel: docScore !== null ? `${docScore}%` : "N/A",
    explanation: docExplanation,
    whyItMatters:
      "High documentation coverage reduces onboarding friction and clarifies architectural intent across modules.",
    details: { docFilesCount, documentedCaps, totalCaps },
  };

  // 2. Dependency Complexity
  let complexityScore: number | null = null;
  let complexityStatus: HealthSignalStatus = "insufficient-data";
  let complexityExplanation = "";
  const avgDegree =
    areas.length > 0 ? Math.round((relationships.length / areas.length) * 10) / 10 : 0;
  const totalExternalDeps =
    (brief.technicalOverview.dependencies?.length || 0) +
    (brief.technicalOverview.devDependencies?.length || 0);

  if (areas.length <= 1) {
    complexityStatus = "insufficient-data";
    complexityExplanation =
      "Single-module or flat repository; inter-module graph degree cannot be reliably computed.";
  } else {
    if (avgDegree <= 2.2) {
      complexityScore = 95;
      complexityStatus = "healthy";
      complexityExplanation = `Clean separation. Subsystems average ${avgDegree} outgoing/incoming relationships.`;
    } else if (avgDegree <= 4.0) {
      complexityScore = 80;
      complexityStatus = "healthy";
      complexityExplanation = `Moderate interconnectivity (${avgDegree} relationships per subsystem across ${areas.length} modules).`;
    } else {
      complexityScore = Math.max(30, Math.round(100 - (avgDegree - 4.0) * 18));
      complexityStatus = "needs-attention";
      complexityExplanation = `High subsystem coupling: average degree is ${avgDegree}, increasing ripple risk during changes.`;
    }
  }

  const complexitySignal: ArchitecturalSignal = {
    id: "dep-complexity",
    name: "Dependency Complexity",
    score: complexityScore,
    status: complexityStatus,
    statusLabel:
      complexityStatus === "healthy"
        ? "Healthy"
        : complexityStatus === "needs-attention"
          ? "Needs Attention"
          : "Insufficient Data",
    metricLabel:
      complexityScore !== null
        ? `${complexityScore}% (${avgDegree} avg degree)`
        : "Insufficient Data",
    explanation: complexityExplanation,
    whyItMatters:
      "Loose coupling between modules prevents cascade regressions when modifying core subsystems.",
    details: { avgDegree, relationshipsCount: relationships.length, totalExternalDeps },
  };

  // 3. Module Balance & Size
  let balanceScore: number | null = null;
  let balanceStatus: HealthSignalStatus = "insufficient-data";
  let balanceExplanation = "";

  if (areas.length <= 1) {
    balanceStatus = "insufficient-data";
    balanceExplanation =
      "Repository does not have multiple partitioned modules to assess file distribution.";
  } else {
    const fileCounts = areas.map((a) => a.associatedFiles?.length || 1);
    const totalAssigned = fileCounts.reduce((a, b) => a + b, 0);
    const maxFiles = Math.max(...fileCounts);
    const dominantRatio = maxFiles / Math.max(1, totalAssigned);
    const dominantArea = areas.find((a) => (a.associatedFiles?.length || 1) === maxFiles);

    if (dominantRatio > 0.65) {
      balanceScore = Math.max(35, Math.round(100 - dominantRatio * 70));
      balanceStatus = "needs-attention";
      balanceExplanation = `Imbalance: '${dominantArea?.name || "Core"}' holds ${Math.round(dominantRatio * 100)}% of subsystem files (potential god-module).`;
    } else {
      balanceScore = 90;
      balanceStatus = "healthy";
      balanceExplanation = `Balanced distribution across ${areas.length} subsystems (largest is ${Math.round(dominantRatio * 100)}% of assigned files).`;
    }
  }

  const balanceSignal: ArchitecturalSignal = {
    id: "module-balance",
    name: "Module Balance & Size",
    score: balanceScore,
    status: balanceStatus,
    statusLabel:
      balanceStatus === "healthy"
        ? "Healthy"
        : balanceStatus === "needs-attention"
          ? "Needs Attention"
          : "Insufficient Data",
    metricLabel: balanceScore !== null ? `${balanceScore}%` : "Insufficient Data",
    explanation: balanceExplanation,
    whyItMatters:
      "Even module boundaries prevent single modules from accumulating disproportionate cognitive load.",
    details: { moduleCount: areas.length },
  };

  // 4. Circular Dependencies
  const detectedCycles = detectDependencyCycles(areas, relationships);
  let cycleScore: number | null = null;
  let cycleStatus: HealthSignalStatus = "insufficient-data";
  let cycleExplanation = "";

  if (areas.length <= 1 || relationships.length === 0) {
    cycleStatus = "insufficient-data";
    cycleExplanation = "No directed subsystem relationships detected to trace cyclic dependencies.";
  } else if (detectedCycles.length === 0) {
    cycleScore = 100;
    cycleStatus = "healthy";
    cycleExplanation = `Acyclic architecture: 0 dependency cycles found across ${relationships.length} module connections.`;
  } else if (detectedCycles.length === 1) {
    cycleScore = 60;
    cycleStatus = "needs-attention";
    cycleExplanation = `1 circular dependency detected: ${detectedCycles[0].join(" → ")}.`;
  } else {
    cycleScore = Math.max(25, 100 - detectedCycles.length * 30);
    cycleStatus = "needs-attention";
    cycleExplanation = `${detectedCycles.length} circular dependency cycles detected among architectural subsystems.`;
  }

  const cycleSignal: ArchitecturalSignal = {
    id: "circular-deps",
    name: "Circular Dependencies",
    score: cycleScore,
    status: cycleStatus,
    statusLabel:
      cycleStatus === "healthy"
        ? "Healthy"
        : cycleStatus === "needs-attention"
          ? "Needs Attention"
          : "Insufficient Data",
    metricLabel:
      cycleScore !== null
        ? detectedCycles.length === 0
          ? "0 Cycles (Acyclic)"
          : `${detectedCycles.length} Cycles`
        : "Insufficient Data",
    explanation: cycleExplanation,
    whyItMatters:
      "Circular dependencies between modules lead to tight coupling, memory leaks, and complex build orders.",
    details: { cycles: detectedCycles },
  };

  // 5. Architecture Connectivity (Orphan Detection)
  let connectivityScore: number | null = null;
  let connectivityStatus: HealthSignalStatus = "insufficient-data";
  let connectivityExplanation = "";

  if (areas.length <= 1) {
    connectivityStatus = "insufficient-data";
    connectivityExplanation =
      "Fewer than 2 subsystems identified; cannot assess architectural connectivity.";
  } else {
    const connectedAreaIds = new Set<string>();
    relationships.forEach((r) => {
      connectedAreaIds.add(r.fromAreaId);
      connectedAreaIds.add(r.toAreaId);
    });

    const orphanAreas = areas.filter((a) => !connectedAreaIds.has(a.id));
    const orphanRatio = orphanAreas.length / areas.length;

    if (orphanAreas.length === 0) {
      connectivityScore = 100;
      connectivityStatus = "healthy";
      connectivityExplanation = `All ${areas.length} detected subsystems participate in data or control flows.`;
    } else if (orphanRatio <= 0.25) {
      connectivityScore = 80;
      connectivityStatus = "healthy";
      connectivityExplanation = `${orphanAreas.length} standalone subsystem(s) detected (e.g. utilities or configs).`;
    } else {
      connectivityScore = Math.max(25, Math.round((1 - orphanRatio) * 100));
      connectivityStatus = "needs-attention";
      connectivityExplanation = `${orphanAreas.length} of ${areas.length} subsystems are isolated from the relationship graph.`;
    }
  }

  const connectivitySignal: ArchitecturalSignal = {
    id: "connectivity",
    name: "Architecture Connectivity",
    score: connectivityScore,
    status: connectivityStatus,
    statusLabel:
      connectivityStatus === "healthy"
        ? "Healthy"
        : connectivityStatus === "needs-attention"
          ? "Needs Attention"
          : "Insufficient Data",
    metricLabel: connectivityScore !== null ? `${connectivityScore}%` : "Insufficient Data",
    explanation: connectivityExplanation,
    whyItMatters:
      "Integrated modules ensure the system behaves as a cohesive application rather than disjointed scripts.",
    details: { totalAreas: areas.length },
  };

  const signals = [docSignal, complexitySignal, balanceSignal, cycleSignal, connectivitySignal];

  // Compute Overall Composite Score
  const scoredSignals = signals.filter((s) => s.score !== null);
  let overallScore: number | null = null;
  let overallStatus: HealthSignalStatus = "insufficient-data";

  if (scoredSignals.length >= 2) {
    overallScore = Math.round(
      scoredSignals.reduce((acc, s) => acc + (s.score as number), 0) / scoredSignals.length
    );
    overallStatus =
      overallScore >= 75 ? "healthy" : overallScore >= 45 ? "needs-attention" : "needs-attention";
  }

  return {
    signals,
    overallScore,
    overallStatus,
    scoredSignalsCount: scoredSignals.length,
    detectedCycles,
  };
}

export default function ArchitectureHealthSection({
  brief,
  evidenceSummary,
  storedInsights = [],
  onNavigateToTopology,
  onLocateInGraph,
}: ArchitectureHealthSectionProps) {
  const [showDetailedInsights, setShowDetailedInsights] = useState(false);
  const [insightSeverityFilter, setInsightSeverityFilter] = useState<string>("all");
  const [insightSearchQuery, setInsightSearchQuery] = useState("");

  const evaluation = useMemo(
    () => evaluateArchitectureHealth(brief, evidenceSummary),
    [brief, evidenceSummary]
  );

  const { signals, overallScore, overallStatus, detectedCycles } = evaluation;

  const filteredStoredInsights = useMemo(() => {
    return storedInsights.filter((item) => {
      const matchesSeverity =
        insightSeverityFilter === "all" || item.severity === insightSeverityFilter;
      const q = insightSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.relatedModule && item.relatedModule.toLowerCase().includes(q));
      return matchesSeverity && matchesQuery;
    });
  }, [storedInsights, insightSeverityFilter, insightSearchQuery]);

  // Status badge styling helper
  const getBadgeStyle = (status: HealthSignalStatus) => {
    switch (status) {
      case "healthy":
        return {
          bg: "rgba(53,208,195,0.12)",
          color: "var(--teal-bright)",
          border: "rgba(53,208,195,0.35)",
        };
      case "needs-attention":
        return {
          bg: "rgba(244,176,79,0.12)",
          color: "var(--accent-amber)",
          border: "rgba(244,176,79,0.35)",
        };
      case "insufficient-data":
      default:
        return {
          bg: "rgba(129,145,150,0.12)",
          color: "var(--accent-slate)",
          border: "rgba(129,145,150,0.3)",
        };
    }
  };

  return (
    <section
      id="health-section"
      aria-label="Architecture Health Assessment"
      className="rounded-2xl p-6 sm:p-7 space-y-6"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Section Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              <ShieldCheckIcon className="w-4 h-4" />
            </span>
            <h3
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Architecture Health Assessment
            </h3>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
            Calculated architectural signals evaluating documentation, inter-module coupling,
            balance, acyclicity, and connectivity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailedInsights(!showDetailedInsights)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto hover:text-white"
          style={{
            backgroundColor: "var(--bg-workspace)",
            color: "var(--teal-bright)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span>{showDetailedInsights ? "Hide Detailed Findings" : "View Detailed Insights"}</span>
          <ArrowRightIcon
            className={`w-3.5 h-3.5 transition-transform ${showDetailedInsights ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* Two-Part Layout: Overall Assessment & Architectural Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Overall Assessment */}
        <div
          className="lg:col-span-4 p-5 sm:p-6 rounded-2xl flex flex-col justify-between"
          style={{
            backgroundColor: "var(--bg-workspace)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Overall Assessment
              </span>
              <span
                className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: getBadgeStyle(overallStatus).bg,
                  color: getBadgeStyle(overallStatus).color,
                  borderColor: getBadgeStyle(overallStatus).border,
                }}
              >
                {overallStatus === "healthy"
                  ? "Healthy"
                  : overallStatus === "needs-attention"
                    ? "Needs Attention"
                    : "Insufficient Data"}
              </span>
            </div>

            {/* Circular Gauge / Score Display */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                  />
                  {overallScore !== null && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={
                        overallStatus === "healthy" ? "var(--teal-bright)" : "var(--accent-amber)"
                      }
                      strokeWidth="8"
                      strokeDasharray={251.32}
                      strokeDashoffset={251.32 - (251.32 * overallScore) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className="text-3xl sm:text-4xl font-black font-mono tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {overallScore !== null ? overallScore : "—"}
                  </span>
                  <span
                    className="text-[11px] uppercase font-bold tracking-wider mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {overallScore !== null ? "out of 100" : "Data Pending"}
                  </span>
                </div>
              </div>
            </div>

            <p
              className="text-xs sm:text-sm leading-relaxed text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              {overallScore !== null
                ? "Weighted composite across verified documentation, coupling complexity, module balance, acyclicity, and architecture connectivity."
                : "Insufficient multi-module topology to establish an authoritative overall composite score."}
            </p>
          </div>

          <div
            className="pt-4 mt-4 border-t text-[11px] flex items-center justify-between"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span>Based on repository snapshot</span>
            <span className="font-mono">{signals.length} signals active</span>
          </div>
        </div>

        {/* Right Column (8 cols): 5 Architectural Signals */}
        <div className="lg:col-span-8 space-y-3.5">
          {signals.map((sig) => {
            const badge = getBadgeStyle(sig.status);
            const scoreVal = sig.score ?? 0;

            return (
              <div
                key={sig.id}
                className="p-4 rounded-xl space-y-2.5 transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: badge.color }}
                    />
                    <h4
                      className="text-sm font-bold tracking-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sig.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className="text-[11px] font-bold uppercase px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        borderColor: badge.border,
                      }}
                    >
                      {sig.statusLabel}
                    </span>
                    <span
                      className="text-xs font-mono font-bold min-w-[50px] text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {sig.metricLabel}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  {sig.score !== null ? (
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(5, scoreVal))}%`,
                        backgroundColor:
                          sig.status === "healthy"
                            ? "var(--teal-bright)"
                            : sig.status === "needs-attention"
                              ? "var(--accent-amber)"
                              : "var(--accent-slate)",
                      }}
                    />
                  ) : (
                    <div
                      className="h-full w-full opacity-30"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, transparent, transparent 4px, var(--accent-slate) 4px, var(--accent-slate) 8px)",
                      }}
                    />
                  )}
                </div>

                {/* Explanation */}
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {sig.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Architectural Findings Breakdown */}
      {showDetailedInsights && (
        <div
          className="p-5 sm:p-6 rounded-2xl space-y-4 animate-fade-in border"
          style={{
            backgroundColor: "var(--bg-workspace)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="flex items-center justify-between pb-3 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--teal-bright)" }}>
                <SparklesIcon className="w-4 h-4" />
              </span>
              <h4
                className="text-sm sm:text-base font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Architectural Findings Breakdown
              </h4>
            </div>
            {onNavigateToTopology && (
              <button
                type="button"
                onClick={onNavigateToTopology}
                className="text-xs font-semibold flex items-center gap-1 transition-colors hover:underline"
                style={{ color: "var(--teal-bright)" }}
              >
                <span>Inspect in Deep Topology</span>
                <NetworkGraphIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Finding 1: Dependency Cycles */}
            <div
              className="p-4 rounded-xl space-y-2"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="font-bold uppercase tracking-wider text-[11px] block"
                style={{ color: "var(--text-muted)" }}
              >
                Dependency Graph Cycles
              </span>
              {detectedCycles.length === 0 ? (
                <p className="leading-relaxed" style={{ color: "var(--accent-green)" }}>
                  ✓ No circular dependency paths detected. Module invocation graph is directed and
                  acyclic.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <p style={{ color: "var(--accent-amber)" }}>
                    ⚠ The following module cycle paths were detected:
                  </p>
                  <ul className="space-y-1 font-mono text-[11px] pl-2 border-l border-amber-500/30">
                    {detectedCycles.map((cycle, i) => (
                      <li key={i} style={{ color: "var(--text-primary)" }}>
                        {cycle.join(" → ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Finding 2: Subsystem Partitioning */}
            <div
              className="p-4 rounded-xl space-y-2"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="font-bold uppercase tracking-wider text-[11px] block"
                style={{ color: "var(--text-muted)" }}
              >
                Subsystems &amp; File Boundaries
              </span>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {brief.conceptualMap.areas.length} functional areas identified across{" "}
                {evidenceSummary?.totalFiles || brief.technicalOverview.totalFiles || "repository"}{" "}
                files.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {brief.conceptualMap.areas.slice(0, 6).map((a) => (
                  <span
                    key={a.id}
                    className="px-2 py-0.5 rounded text-[11px] font-mono"
                    style={{
                      backgroundColor: "var(--bg-workspace)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {a.name} ({a.associatedFiles?.length || 1}f)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Insights & Diagnostics (From Persisted Repository Analysis) */}
      {storedInsights.length > 0 && (
        <div
          className="p-5 sm:p-6 rounded-2xl space-y-4 animate-fade-in border"
          style={{
            backgroundColor: "var(--bg-workspace)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--teal-bright)" }}>
                <ShieldCheckIcon className="w-4 h-4" />
              </span>
              <h4
                className="text-sm sm:text-base font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Actionable Diagnostics &amp; Insights
              </h4>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold ml-1"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  color: "var(--teal-bright)",
                }}
              >
                {storedInsights.length} findings
              </span>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["all", "critical", "high", "medium", "low"] as const).map((sev) => {
                const isSelected = insightSeverityFilter === sev;
                const count =
                  sev === "all"
                    ? storedInsights.length
                    : storedInsights.filter((i) => i.severity === sev).length;

                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setInsightSeverityFilter(sev)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: isSelected ? "var(--teal-primary)" : "var(--bg-elevated)",
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                      border: isSelected
                        ? "1px solid var(--teal-bright)"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    {sev} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full max-w-sm"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <SearchIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search findings or related modules..."
              value={insightSearchQuery}
              onChange={(e) => setInsightSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-500"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Findings List */}
          <div className="space-y-3 pt-1">
            {filteredStoredInsights.length === 0 ? (
              <p className="text-xs italic py-4 text-center" style={{ color: "var(--text-muted)" }}>
                No architectural insights match the selected filter.
              </p>
            ) : (
              filteredStoredInsights.map((insight) => {
                const sevColor =
                  insight.severity === "critical"
                    ? "var(--danger)"
                    : insight.severity === "high"
                      ? "var(--accent-orange)"
                      : insight.severity === "medium"
                        ? "var(--accent-amber)"
                        : "var(--accent-green)";

                const targetNodeOrModule = insight.relatedModule || insight.relatedNodeId || "";

                return (
                  <div
                    key={insight.id}
                    className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-all"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${sevColor}15`,
                            color: sevColor,
                            borderColor: `${sevColor}40`,
                          }}
                        >
                          {insight.severity}
                        </span>

                        {insight.relatedModule && (
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--bg-workspace)",
                              color: "var(--teal-bright)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {insight.relatedModule}
                          </span>
                        )}

                        <h5
                          className="text-xs sm:text-sm font-bold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {insight.title}
                        </h5>
                      </div>

                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {insight.description}
                      </p>
                    </div>

                    {onLocateInGraph && targetNodeOrModule && (
                      <button
                        type="button"
                        onClick={() => onLocateInGraph(targetNodeOrModule)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 self-start hover:brightness-110"
                        style={{
                          backgroundColor: "rgba(15,138,131,0.15)",
                          color: "var(--teal-bright)",
                          border: "1px solid rgba(53,208,195,0.3)",
                        }}
                      >
                        <span>Locate in Graph</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
