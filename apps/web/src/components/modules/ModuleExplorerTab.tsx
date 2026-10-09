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
      <div className="p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <LayersIcon className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
          No Modules Detected
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          No architectural route modules or domains were discovered during static code parsing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      {/* Left Sidebar: Module List */}
      <div className="lg:col-span-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-300">
          <SearchIcon className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 w-full"
          />
        </div>

        {/* Modules List */}
        <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
          {filteredModules.map((mod) => {
            const isSelected = activeModule?.id === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200 shadow-sm shadow-purple-500/5 font-semibold"
                    : "bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isSelected ? "bg-purple-600 dark:bg-purple-400" : "bg-zinc-400"
                    }`}
                  />
                  <span className="text-xs truncate font-bold">{mod.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 flex-shrink-0">
                  <span>{mod.routesCount} routes</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content: Active Module Deep Dive */}
      {activeModule && (
        <div className="lg:col-span-8 space-y-6">
          {/* Module Banner */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <LayersIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                      {activeModule.name} Module
                    </h3>
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Logical Domain
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Encapsulates API routes, domain controllers, and corresponding schema models.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onFocusModuleInGraph(activeModule.name)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm shadow-purple-600/20 transition-all self-start sm:self-auto cursor-pointer"
              >
                <ActivityIcon className="w-3.5 h-3.5" />
                <span>Focus in Graph</span>
              </button>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Contained Routes
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {activeModule.routesCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Services / Handlers
                </span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {activeModule.servicesCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Database Models
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {activeModule.modelsCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Documentation Guides
                </span>
                <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                  {activeModule.docsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Module-Specific Architectural Insights */}
          {moduleInsights.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300 mb-2">
                <AlertCircleIcon className="w-4 h-4" />
                Signals affecting this module ({moduleInsights.length})
              </div>
              <div className="space-y-2">
                {moduleInsights.map((i) => (
                  <div
                    key={i.id}
                    className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-amber-500/20 text-zinc-800 dark:text-zinc-200"
                  >
                    <div className="font-bold">{i.title}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {i.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contained Routes */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-blue-500" />
              Contained Routes ({activeModule.routes.length})
            </h4>

            {activeModule.routes.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No routes recorded for this module.</p>
            ) : (
              <div className="space-y-2">
                {activeModule.routes.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {rt.method || "ROUTE"}
                      </span>
                      <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {rt.path || rt.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFocusModuleInGraph(rt.name)}
                      className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      Graph <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contained Models & Services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Services */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CodeIcon className="w-4 h-4 text-amber-500" />
                Services &amp; Controllers ({activeModule.services.length})
              </h4>
              {activeModule.services.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No services encapsulated.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeModule.services.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/80 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 truncate"
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Database Models */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <DatabaseIcon className="w-4 h-4 text-emerald-500" />
                Database Models ({activeModule.models.length})
              </h4>
              {activeModule.models.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No direct models mapped.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeModule.models.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/80 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 truncate"
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
