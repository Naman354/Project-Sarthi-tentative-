"use client";

import React from "react";
import type {
  Analysis,
  ProjectHealthReport,
  InsightItem,
  ResumeSessionBriefing,
  ModuleSummaryItem,
  GraphStats,
} from "../../types/project";
import {
  ActivityIcon,
  ShieldCheckIcon,
  CompassIcon,
  LayersIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "../Icons";

interface OverviewTabProps {
  latestAnalysis?: Analysis | null;
  health: ProjectHealthReport | null;
  insights: InsightItem[];
  resume: ResumeSessionBriefing | null;
  modules: ModuleSummaryItem[];
  stats: GraphStats | null;
  onNavigateTab: (tabId: "graph" | "modules" | "insights") => void;
}

export function OverviewTab({
  latestAnalysis,
  health,
  insights,
  resume,
  modules,
  stats,
  onNavigateTab,
}: OverviewTabProps) {
  const overallScore = health?.overallScore ?? 100;
  const healthStatus = health?.status ?? "healthy";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "warning":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "critical":
        return "text-rose-400 border-rose-500/30 bg-rose-500/10";
      default:
        return "text-teal-400 border-teal-500/30 bg-teal-500/10";
    }
  };

  const getStrokeDashOffset = (score: number) => {
    // Circumference = 2 * PI * r = 2 * 3.14159 * 42 ≈ 263.89
    const circumference = 263.89;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Developer Briefing / Resume Session Card */}
      {resume && (
        <div
          className="rounded-2xl p-6 sm:p-7 shadow-lg space-y-5"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  border: "1px solid rgba(53,208,195,0.3)",
                  color: "var(--teal-bright)",
                }}
              >
                <CompassIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-base sm:text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Developer Briefing &amp; Next Steps
                  </h2>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border"
                    style={{
                      backgroundColor: "rgba(15,138,131,0.15)",
                      color: "var(--teal-bright)",
                      borderColor: "rgba(53,208,195,0.3)",
                    }}
                  >
                    {resume.timeSinceLastAnalysis}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Orientation briefing generated for repository onboarding and active exploration.
                </p>
              </div>
            </div>

            {resume.suggestedStartingPoint && (
              <div
                className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Suggested Start:</span>
                <span className="font-bold" style={{ color: "var(--teal-bright)" }}>
                  {resume.suggestedStartingPoint.moduleName}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Rationale / Orientation */}
            <div
              className="lg:col-span-2 p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider block"
                style={{ color: "var(--text-muted)" }}
              >
                Architectural Rationale
              </span>
              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {resume.suggestedStartingPoint?.rationale ||
                  "Review the core application modules and dependency relationships below."}
              </p>

              {resume.hasPreviousVersion && (
                <div
                  className="mt-3 pt-3 border-t flex items-center gap-4 text-xs font-mono"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>
                    Diff vs v{resume.previousVersionNumber}: +{resume.changesSummary.nodesAdded}{" "}
                    nodes, +{resume.changesSummary.edgesAdded} edges
                  </span>
                </div>
              )}

              {latestAnalysis?.summary && (
                <div
                  className="mt-3 pt-3 border-t text-[11px] font-mono"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  {latestAnalysis.summary}
                </div>
              )}
            </div>

            {/* Recommended Steps */}
            <div className="space-y-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider block"
                style={{ color: "var(--text-muted)" }}
              >
                Action Recommendations
              </span>
              {resume.navigationRecommendations.slice(0, 2).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border text-xs flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {rec.title}
                    </div>
                    <div
                      className="text-[11px] truncate mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {rec.reason}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("modules")}
                    className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
                    style={{ color: "var(--teal-bright)" }}
                    title="View module in explorer"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Health Score & 5 Architectural Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Health Score Card */}
        <div
          className="rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Architectural Health Score
              </span>
              <span
                className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                  healthStatus
                )}`}
              >
                {healthStatus}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={
                      healthStatus === "healthy"
                        ? "var(--accent-green)"
                        : healthStatus === "warning"
                          ? "var(--accent-amber)"
                          : "var(--danger)"
                    }
                    strokeWidth="8"
                    strokeDasharray="263.89"
                    strokeDashoffset={getStrokeDashOffset(overallScore)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    className="text-3xl font-black font-mono tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {overallScore}
                  </span>
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    out of 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
            Weighted composite of documentation, cycles, module balance, and connectivity.
          </p>
        </div>

        {/* 5 Core Health Metrics Breakdown */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Architectural Signals Evaluated
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {health?.metrics.length ?? 5} signals evaluated
            </span>
          </div>

          <div className="space-y-3.5">
            {health?.metrics.map((metric) => (
              <div key={metric.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {metric.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${getStatusColor(
                        metric.status
                      )}`}
                    >
                      {metric.status}
                    </span>
                    <span
                      className="font-mono font-bold w-10 text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {metric.value}%
                    </span>
                  </div>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${metric.value}%`,
                      backgroundColor:
                        metric.status === "healthy"
                          ? "var(--accent-green)"
                          : metric.status === "warning"
                            ? "var(--accent-amber)"
                            : "var(--danger)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-4 pt-4 border-t flex items-center justify-between text-xs"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <span>Evaluated automatically on each code analysis</span>
            <button
              type="button"
              onClick={() => onNavigateTab("insights")}
              className="font-semibold hover:underline flex items-center gap-1 transition-colors"
              style={{ color: "var(--teal-bright)" }}
            >
              View detailed insights <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Actionable Insights List */}
      <div
        className="rounded-2xl p-6 shadow-sm space-y-4"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--teal-bright)" }}>
              <SparklesIcon className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Key Engineering Insights ({insights.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("insights")}
            className="text-xs font-semibold hover:underline transition-colors"
            style={{ color: "var(--teal-bright)" }}
          >
            See All Insights
          </button>
        </div>

        {insights.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center space-y-2"
            style={{
              backgroundColor: "rgba(85,184,121,0.06)",
              borderColor: "rgba(85,184,121,0.25)",
            }}
          >
            <ShieldCheckIcon className="w-8 h-8 mx-auto text-emerald-400" />
            <div className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>
              Clean Architecture
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              No architectural risks, circular dependencies, or orphan components detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor:
                    insight.severity === "critical"
                      ? "rgba(224,92,92,0.3)"
                      : insight.severity === "high"
                        ? "rgba(244,176,79,0.3)"
                        : "var(--border-subtle)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        insight.severity === "critical"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : insight.severity === "high"
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {insight.severity}
                    </span>
                    {insight.relatedModule && (
                      <span
                        className="text-[10px] font-mono truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Module: {insight.relatedModule}
                      </span>
                    )}
                  </div>
                  <h4
                    className="text-xs sm:text-sm font-bold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {insight.title}
                  </h4>
                  <p
                    className="text-xs line-clamp-3 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {insight.description}
                  </p>
                </div>

                <div
                  className="mt-3 pt-3 border-t flex items-center justify-end"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <button
                    type="button"
                    onClick={() => onNavigateTab("graph")}
                    className="text-[11px] font-semibold hover:underline flex items-center gap-1 transition-colors"
                    style={{ color: "var(--teal-bright)" }}
                  >
                    Locate in Graph <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab("graph")}
          className="p-5 rounded-2xl border transition-all text-left group cursor-pointer hover:border-teal-500/50"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: "rgba(15,138,131,0.15)",
              border: "1px solid rgba(53,208,195,0.3)",
              color: "var(--teal-bright)",
            }}
          >
            <ActivityIcon className="w-5 h-5" />
          </div>
          <h4
            className="text-sm font-bold group-hover:text-teal-300 transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            Interactive Project Graph
          </h4>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Visualize {stats?.totalNodes ?? 0} entities and {stats?.totalEdges ?? 0} relationships
            with pan, zoom, and inspect.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("modules")}
          className="p-5 rounded-2xl border transition-all text-left group cursor-pointer hover:border-purple-500/50"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.3)",
              color: "#c084fc",
            }}
          >
            <LayersIcon className="w-5 h-5" />
          </div>
          <h4
            className="text-sm font-bold group-hover:text-purple-300 transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            Module Explorer
          </h4>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Deep dive into {modules.length} logical modules, contained routes, and database models.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("insights")}
          className="p-5 rounded-2xl border transition-all text-left group cursor-pointer hover:border-amber-500/50"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: "rgba(244,176,79,0.15)",
              border: "1px solid rgba(244,176,79,0.3)",
              color: "var(--accent-amber)",
            }}
          >
            <SparklesIcon className="w-5 h-5" />
          </div>
          <h4
            className="text-sm font-bold group-hover:text-amber-300 transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            Architectural Insights &amp; Health
          </h4>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Review recommendations, circular dependencies, and documentation coverage metrics.
          </p>
        </button>
      </div>
    </div>
  );
}
