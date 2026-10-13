"use client";

import React, { useState, useMemo } from "react";
import type { ModuleSummaryItem, InsightItem } from "../../types/project";
import {
  LayersIcon,
  RouteIcon,
  DatabaseIcon,
  CodeIcon,
  SearchIcon,
  ArrowRightIcon,
  ActivityIcon,
  AlertCircleIcon,
} from "../Icons";

interface ModuleExplorerTabProps {
  modules: ModuleSummaryItem[];
  insights: InsightItem[];
  onFocusModuleInGraph: (moduleName: string) => void;
}

export function ModuleExplorerTab({
  modules,
  insights,
  onFocusModuleInGraph,
}: ModuleExplorerTabProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase().trim();
    return modules.filter((m) => m.name.toLowerCase().includes(q));
  }, [modules, searchQuery]);

  const activeModule = useMemo(() => {
    return modules.find((m) => m.id === selectedModuleId) || modules[0] || null;
  }, [modules, selectedModuleId]);

  // Find insights related to active module
  const moduleInsights = useMemo(() => {
    if (!activeModule) return [];
    return insights.filter(
      (i) => i.relatedModule && i.relatedModule.toLowerCase() === activeModule.name.toLowerCase()
    );
  }, [activeModule, insights]);

  if (modules.length === 0) {
    return (
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
            backgroundColor: "rgba(0, 194, 203, 0.1)",
            border: "1px solid rgba(0, 194, 203, 0.25)",
            color: "var(--teal-bright)",
          }}
        >
          <LayersIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Modules Detected</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
          No architectural route modules or domains were discovered during static code parsing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      {/* Left Sidebar: Module List */}
      <div
        className="lg:col-span-4 rounded-2xl border p-4 space-y-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Architecture Modules ({modules.length})
          </span>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <SearchIcon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-[var(--text-muted)] w-full"
          />
        </div>

        {/* Modules List */}
        <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
          {filteredModules.map((mod) => {
            const isSelected = activeModule?.id === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
                className="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(0, 194, 203, 0.12)"
                    : "transparent",
                  borderColor: isSelected
                    ? "var(--teal-primary)"
                    : "transparent",
                  boxShadow: isSelected
                    ? "0 0 15px rgba(0, 194, 203, 0.1)"
                    : "none",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--teal-bright)"
                        : "var(--text-muted)",
                      boxShadow: isSelected
                        ? "0 0 6px var(--teal-bright)"
                        : "none",
                    }}
                  />
                  <span
                    className="text-xs truncate font-bold"
                    style={{
                      color: isSelected
                        ? "var(--teal-bright)"
                        : "var(--text-primary)",
                    }}
                  >
                    {mod.name}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border flex-shrink-0"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{mod.routesCount} routes</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content: Active Module Deep Dive */}
      {activeModule && (
        <div className="lg:col-span-8 space-y-5">
          {/* Module Banner */}
          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
            }}
          >
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(0, 194, 203, 0.12)",
                    border: "1px solid rgba(0, 194, 203, 0.3)",
                    color: "var(--teal-bright)",
                  }}
                >
                  <LayersIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      {activeModule.name} Module
                    </h3>
                    <span
                      className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: "rgba(0, 194, 203, 0.1)",
                        borderColor: "rgba(0, 194, 203, 0.3)",
                        color: "var(--teal-bright)",
                      }}
                    >
                      Logical Domain
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Encapsulates API routes, domain controllers, and corresponding schema models.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onFocusModuleInGraph(activeModule.name)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "#0a0f1d",
                  boxShadow: "0 2px 10px rgba(0, 194, 203, 0.25)",
                }}
              >
                <ActivityIcon className="w-4 h-4" />
                <span>Focus in Graph</span>
              </button>
            </div>

            {/* Compact Engineering Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div
                className="p-3 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Contained Routes
                </span>
                <span className="text-xl font-mono font-black text-blue-400 mt-1">
                  {activeModule.routesCount}
                </span>
              </div>
              <div
                className="p-3 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Services / Handlers
                </span>
                <span className="text-xl font-mono font-black text-amber-400 mt-1">
                  {activeModule.servicesCount}
                </span>
              </div>
              <div
                className="p-3 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Database Models
                </span>
                <span className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {activeModule.modelsCount}
                </span>
              </div>
              <div
                className="p-3 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Documentation Guides
                </span>
                <span className="text-xl font-mono font-black text-cyan-400 mt-1">
                  {activeModule.docsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Module-Specific Architectural Insights */}
          {moduleInsights.length > 0 && (
            <div
              className="p-4 rounded-2xl border text-xs space-y-2.5"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                borderColor: "rgba(245, 158, 11, 0.3)",
              }}
            >
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                <span>Signals affecting this module ({moduleInsights.length})</span>
              </div>
              <div className="space-y-2">
                {moduleInsights.map((i) => (
                  <div
                    key={i.id}
                    className="p-3 rounded-xl border text-[var(--text-primary)]"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "rgba(245, 158, 11, 0.2)",
                    }}
                  >
                    <div className="font-bold text-white text-xs">{i.title}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      {i.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contained Routes */}
          <div
            className="rounded-2xl border p-5 sm:p-6 space-y-3"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-blue-400" />
                Contained Routes ({activeModule.routes.length})
              </h4>
            </div>

            {activeModule.routes.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-2">
                No routes recorded for this module.
              </p>
            ) : (
              <div className="space-y-2">
                {activeModule.routes.map((rt) => {
                  const method = (rt.method || "ROUTE").toUpperCase();
                  const methodColor =
                    method === "GET"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      : method === "POST"
                        ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                        : method === "DELETE"
                          ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                          : "text-amber-400 bg-amber-500/10 border-amber-500/30";

                  return (
                    <div
                      key={rt.id}
                      className="p-3 rounded-xl border flex items-center justify-between text-xs transition-colors hover:border-[var(--teal-primary)]"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${methodColor}`}
                        >
                          {method}
                        </span>
                        <span className="font-mono text-xs font-medium text-white truncate">
                          {rt.path || rt.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onFocusModuleInGraph(rt.name)}
                        className="text-[11px] font-semibold text-[var(--teal-bright)] hover:underline flex items-center gap-1.5 flex-shrink-0 ml-3 cursor-pointer"
                      >
                        <span>Graph</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contained Models & Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Services */}
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <CodeIcon className="w-4 h-4 text-amber-400" />
                Services &amp; Handlers ({activeModule.services.length})
              </h4>
              {activeModule.services.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic py-2">
                  No services encapsulated.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeModule.services.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-lg border text-xs font-mono font-medium text-[var(--text-primary)] truncate"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Database Models */}
            <div
              className="rounded-2xl border p-5 space-y-3"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <DatabaseIcon className="w-4 h-4 text-emerald-400" />
                Database Models ({activeModule.models.length})
              </h4>
              {activeModule.models.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic py-2">
                  No direct models mapped.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeModule.models.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-lg border text-xs font-mono font-medium text-[var(--text-primary)] truncate"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      {m.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
