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
        return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
      case "warning":
        return "text-amber-500 border-amber-500/30 bg-amber-500/10";
      case "critical":
        return "text-rose-500 border-rose-500/30 bg-rose-500/10";
      default:
        return "text-indigo-500 border-indigo-500/30 bg-indigo-500/10";
    }
  };

  const getStrokeDashOffset = (score: number) => {
    // Circumference = 2 * PI * r = 2 * 3.14159 * 42 ≈ 263.89
    const circumference = 263.89;
    return circumference - (score / 100) * circumference;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Developer Briefing / Resume Session Card */}
      {resume && (
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-indigo-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <CompassIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Developer Briefing &amp; Next Steps
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                    {resume.timeSinceLastAnalysis}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  AI-synthesized orientation for onboarding and ongoing development.
                </p>
              </div>
            </div>

            {resume.suggestedStartingPoint && (
              <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-400">Suggested Start:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {resume.suggestedStartingPoint.moduleName}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Rationale / Orientation */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Architectural Rationale
              </span>
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {resume.suggestedStartingPoint?.rationale ||
                  "Review the core application modules and dependency relationships below."}
              </p>

              {resume.hasPreviousVersion && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-xs text-zinc-500">
                  <span>
                    Diff vs v{resume.previousVersionNumber}: +{resume.changesSummary.nodesAdded}{" "}
                    nodes, +{resume.changesSummary.edgesAdded} edges
                  </span>
                </div>
              )}

              {latestAnalysis?.summary && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  {latestAnalysis.summary}
                </div>
              )}
            </div>

            {/* Recommended Steps */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Action Recommendations
              </span>
              {resume.navigationRecommendations.slice(0, 2).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {rec.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">{rec.reason}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("modules")}
                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-indigo-500 flex-shrink-0"
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
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
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
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="263.89"
                    strokeDashoffset={getStrokeDashOffset(overallScore)}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${
                      healthStatus === "healthy"
                        ? "text-emerald-500"
                        : healthStatus === "warning"
                          ? "text-amber-500"
                          : "text-rose-500"
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {overallScore}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    out of 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-2">
            Weighted composite of documentation, cycles, module balance, and connectivity.
          </p>
        </div>

        {/* 5 Core Health Metrics Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Architectural Signals Evaluated
            </span>
            <span className="text-xs text-zinc-400">5 signals active</span>
          </div>

          <div className="space-y-4">
            {health?.metrics.map((metric) => (
              <div key={metric.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
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
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 w-10 text-right">
                      {metric.value}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      metric.status === "healthy"
                        ? "bg-emerald-500"
                        : metric.status === "warning"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Evaluated automatically on each code analysis</span>
            <button
              type="button"
              onClick={() => onNavigateTab("insights")}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View detailed insights <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Actionable Insights List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Key Engineering Insights ({insights.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("insights")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            See All Insights
          </button>
        </div>

        {insights.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <ShieldCheckIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              Clean Architecture
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              No architectural risks, circular dependencies, or orphan components detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        insight.severity === "critical"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          : insight.severity === "high"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {insight.severity}
                    </span>
                    {insight.relatedModule && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        Module: {insight.relatedModule}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">
                    {insight.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("graph")}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
          className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500/50 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ActivityIcon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Interactive Project Graph
          </h4>
          <p className="text-xs text-zinc-500 mt-1">
            Visualize {stats?.totalNodes ?? 0} entities and {stats?.totalEdges ?? 0} relationships
            with pan, zoom, and inspect.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("modules")}
          className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-500/50 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <LayersIcon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Module Explorer
          </h4>
          <p className="text-xs text-zinc-500 mt-1">
            Deep dive into {modules.length} logical modules, contained routes, and database models.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("insights")}
          className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500/50 hover:shadow-md transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            Architectural Insights &amp; Health
          </h4>
          <p className="text-xs text-zinc-500 mt-1">
            Review recommendations, circular dependencies, and documentation coverage metrics.
          </p>
        </button>
      </div>
    </div>
  );
}
