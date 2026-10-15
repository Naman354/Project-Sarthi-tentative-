"use client";

import React, { useState, useMemo } from "react";
import type { InsightItem, ProjectHealthReport } from "../../types/project";
import { ShieldCheckIcon, ArrowRightIcon, FilterIcon, SearchIcon } from "../Icons";

interface InsightsTabProps {
  insights: InsightItem[];
  health: ProjectHealthReport | null;
  onLocateInGraph: (nodeNameOrId: string) => void;
}

export function InsightsTab({ insights, health, onLocateInGraph }: InsightsTabProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = useMemo(() => {
    return {
      critical: insights.filter((i) => i.severity === "critical").length,
      high: insights.filter((i) => i.severity === "high").length,
      medium: insights.filter((i) => i.severity === "medium").length,
      low: insights.filter((i) => i.severity === "low").length,
    };
  }, [insights]);

  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.relatedModule && item.relatedModule.toLowerCase().includes(q));

      return matchesSeverity && matchesQuery;
    });
  }, [insights, severityFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {health && (
        <div
          className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "rgba(0, 194, 203, 0.12)",
                border: "1px solid rgba(0, 194, 203, 0.3)",
                color: "var(--teal-bright)",
              }}
            >
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Evaluated Health Score:{" "}
                <strong className="text-white font-mono text-sm ml-1">
                  {health.overallScore}/100
                </strong>
              </span>
              <span
                className="ml-2.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor:
                    health.status === "healthy"
                      ? "rgba(16, 185, 129, 0.1)"
                      : health.status === "warning"
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(244, 63, 94, 0.1)",
                  borderColor:
                    health.status === "healthy"
                      ? "rgba(16, 185, 129, 0.3)"
                      : health.status === "warning"
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(244, 63, 94, 0.3)",
                  color:
                    health.status === "healthy"
                      ? "var(--accent-green)"
                      : health.status === "warning"
                        ? "var(--accent-amber)"
                        : "var(--danger)",
                }}
              >
                {health.status}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {health.metrics.length} architectural signals evaluated
          </span>
        </div>
      )}

      {/* KPI Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "critical" ? "all" : "critical")}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer"
          style={{
            backgroundColor:
              severityFilter === "critical" ? "rgba(244, 63, 94, 0.12)" : "var(--bg-elevated)",
            borderColor: severityFilter === "critical" ? "var(--danger)" : "var(--border-default)",
            boxShadow: severityFilter === "critical" ? "0 0 15px rgba(244, 63, 94, 0.2)" : "none",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Critical
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
          </div>
          <div className="text-2xl font-mono font-black text-white">{counts.critical}</div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Immediate action</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "high" ? "all" : "high")}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer"
          style={{
            backgroundColor:
              severityFilter === "high" ? "rgba(249, 115, 22, 0.12)" : "var(--bg-elevated)",
            borderColor: severityFilter === "high" ? "rgb(249, 115, 22)" : "var(--border-default)",
            boxShadow: severityFilter === "high" ? "0 0 15px rgba(249, 115, 22, 0.2)" : "none",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              High Risk
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
          </div>
          <div className="text-2xl font-mono font-black text-white">{counts.high}</div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Cycles &amp; coupling
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "medium" ? "all" : "medium")}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer"
          style={{
            backgroundColor:
              severityFilter === "medium" ? "rgba(245, 158, 11, 0.12)" : "var(--bg-elevated)",
            borderColor:
              severityFilter === "medium" ? "var(--accent-amber)" : "var(--border-default)",
            boxShadow: severityFilter === "medium" ? "0 0 15px rgba(245, 158, 11, 0.2)" : "none",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Medium
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          </div>
          <div className="text-2xl font-mono font-black text-white">{counts.medium}</div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Docs &amp; balance
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "low" ? "all" : "low")}
          className="p-4 rounded-2xl border text-left transition-all cursor-pointer"
          style={{
            backgroundColor:
              severityFilter === "low" ? "rgba(59, 130, 246, 0.12)" : "var(--bg-elevated)",
            borderColor: severityFilter === "low" ? "rgb(59, 130, 246)" : "var(--border-default)",
            boxShadow: severityFilter === "low" ? "0 0 15px rgba(59, 130, 246, 0.2)" : "none",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Low / Info
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          </div>
          <div className="text-2xl font-mono font-black text-white">{counts.low}</div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
            Minor observations
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <FilterIcon className="w-4 h-4 text-[var(--text-muted)] mr-1" />
          {["all", "critical", "high", "medium", "low"].map((sev) => {
            const isActive = severityFilter === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border"
                style={{
                  backgroundColor: isActive ? "var(--teal-primary)" : "var(--bg-surface)",
                  borderColor: isActive ? "var(--teal-bright)" : "var(--border-subtle)",
                  color: isActive ? "#0a0f1d" : "var(--text-secondary)",
                }}
              >
                {sev === "all" ? "All Severities" : sev}
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full sm:w-64"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <SearchIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-[var(--text-muted)] w-full"
          />
        </div>
      </div>

      {/* Insights Cards List */}
      {filteredInsights.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl border"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "var(--accent-green)",
            }}
          >
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Insights Found</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
            {searchQuery || severityFilter !== "all"
              ? "No insights match your selected filters."
              : "Repository adheres cleanly to architectural patterns with zero detected anomalies."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInsights.map((insight) => {
            const isCritical = insight.severity === "critical";
            const isHigh = insight.severity === "high";
            const isMedium = insight.severity === "medium";

            const badgeBg = isCritical
              ? "rgba(244, 63, 94, 0.1)"
              : isHigh
                ? "rgba(249, 115, 22, 0.1)"
                : isMedium
                  ? "rgba(245, 158, 11, 0.1)"
                  : "rgba(59, 130, 246, 0.1)";

            const badgeBorder = isCritical
              ? "rgba(244, 63, 94, 0.3)"
              : isHigh
                ? "rgba(249, 115, 22, 0.3)"
                : isMedium
                  ? "rgba(245, 158, 11, 0.3)"
                  : "rgba(59, 130, 246, 0.3)";

            const badgeColor = isCritical
              ? "#f87171"
              : isHigh
                ? "#fb923c"
                : isMedium
                  ? "#fbbf24"
                  : "#60a5fa";

            return (
              <div
                key={insight.id}
                className="p-5 rounded-2xl border transition-all"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: isCritical
                    ? "rgba(244, 63, 94, 0.35)"
                    : isHigh
                      ? "rgba(249, 115, 22, 0.35)"
                      : isMedium
                        ? "rgba(245, 158, 11, 0.35)"
                        : "var(--border-default)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: badgeBg,
                          borderColor: badgeBorder,
                          color: badgeColor,
                        }}
                      >
                        {insight.severity}
                      </span>
                      {insight.relatedModule && (
                        <span
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Module: {insight.relatedModule}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white">{insight.title}</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pt-0.5">
                      {insight.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start flex-shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onLocateInGraph(insight.relatedNodeId || insight.relatedModule || "")
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--teal-bright)",
                      }}
                    >
                      <span>Locate Node</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
