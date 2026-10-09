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
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Evaluated Health Score:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {health.overallScore}/100
              </strong>{" "}
              ({health.status})
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            {health.metrics.length} architectural signals evaluated
          </span>
        </div>
      )}

      {/* KPI Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "critical" ? "all" : "critical")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            severityFilter === "critical"
              ? "bg-rose-500/10 border-rose-500 shadow-sm ring-1 ring-rose-500"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Critical
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {counts.critical}
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Immediate action</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "high" ? "all" : "high")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            severityFilter === "high"
              ? "bg-orange-500/10 border-orange-500 shadow-sm ring-1 ring-orange-500"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              High Risk
            </span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{counts.high}</div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Cycles &amp; coupling</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "medium" ? "all" : "medium")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            severityFilter === "medium"
              ? "bg-amber-500/10 border-amber-500 shadow-sm ring-1 ring-amber-500"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Medium
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {counts.medium}
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Docs &amp; balance</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "low" ? "all" : "low")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            severityFilter === "low"
              ? "bg-blue-500/10 border-blue-500 shadow-sm ring-1 ring-blue-500"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Low / Info
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{counts.low}</div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Minor observations</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterIcon className="w-4 h-4 text-zinc-400 mr-1" />
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                severityFilter === sev
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {sev === "all" ? "All Severities" : sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs w-full sm:w-64">
          <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 w-full"
          />
        </div>
      </div>

      {/* Insights Cards List */}
      {filteredInsights.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <ShieldCheckIcon className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            No Insights Found
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery || severityFilter !== "all"
              ? "No insights match your selected filters."
              : "Repository adheres cleanly to architectural patterns with zero detected anomalies."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-5 rounded-2xl border transition-all ${
                insight.severity === "critical"
                  ? "bg-rose-500/5 border-rose-500/20"
                  : insight.severity === "high"
                    ? "bg-orange-500/5 border-orange-500/20"
                    : insight.severity === "medium"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-blue-500/5 border-blue-500/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        insight.severity === "critical"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          : insight.severity === "high"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                            : insight.severity === "medium"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {insight.severity}
                    </span>
                    {insight.relatedModule && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        Module: {insight.relatedModule}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {insight.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
                    {insight.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start flex-shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onLocateInGraph(insight.relatedNodeId || insight.relatedModule || "")
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <span>Locate Node</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
