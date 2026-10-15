"use client";

import React, { useState } from "react";
import type { ProjectBrief, EvidenceSummary } from "../../types/brief";
import type { ProjectGraph, ModuleSummaryItem, InsightItem } from "../../types/project";
import CodebaseMapWorkbench from "./CodebaseMapWorkbench";
import { ProjectGraphViewer } from "../graph/ProjectGraphViewer";
import { ModuleExplorerTab } from "../modules/ModuleExplorerTab";
import { NetworkGraphIcon, LayersIcon, ActivityIcon } from "../Icons";

export type CodeExplorerMode = "map" | "graph" | "modules";

interface CodeExplorerWorkbenchProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  graph?: ProjectGraph | null;
  modules?: ModuleSummaryItem[];
  insights?: InsightItem[];
  initialMode?: CodeExplorerMode;
  initialNodeId?: string | null;
  focusedAreaId?: string | null;
  onSelectArea?: (areaId: string) => void;
  onExploreAnother?: () => void;
}

export default function CodeExplorerWorkbench({
  brief,
  evidenceSummary,
  graph,
  modules = [],
  insights = [],
  initialMode = "map",
  initialNodeId = null,
  focusedAreaId,
  onSelectArea,
  onExploreAnother,
}: CodeExplorerWorkbenchProps) {
  const [mode, setMode] = useState<CodeExplorerMode>(initialMode);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(initialNodeId);

  const handleFocusModuleInGraph = (moduleName: string) => {
    setFocusedNodeId(moduleName);
    setMode("graph");
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Secondary Mode Selector Toolbar */}
      <div
        className="p-3 sm:px-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold uppercase tracking-wider px-1 text-zinc-400"
            style={{ color: "var(--text-muted)" }}
          >
            Explorer View:
          </span>

          <div
            className="inline-flex items-center p-1 rounded-xl gap-1"
            style={{
              backgroundColor: "var(--bg-workspace)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {/* Mode 1: Spatial Codebase Map */}
            <button
              type="button"
              id="code-explorer-mode-map-btn"
              onClick={() => setMode("map")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: mode === "map" ? "var(--teal-primary)" : "transparent",
                color: mode === "map" ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: mode === "map" ? "0 2px 8px rgba(15,138,131,0.3)" : "none",
              }}
            >
              <NetworkGraphIcon className="w-3.5 h-3.5" />
              <span>Map (Spatial Islands)</span>
            </button>

            {/* Mode 2: Interactive Relationship Graph */}
            <button
              type="button"
              id="code-explorer-mode-graph-btn"
              onClick={() => setMode("graph")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: mode === "graph" ? "var(--teal-primary)" : "transparent",
                color: mode === "graph" ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: mode === "graph" ? "0 2px 8px rgba(15,138,131,0.3)" : "none",
              }}
            >
              <ActivityIcon className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
              {graph?.stats?.totalNodes !== undefined && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                  style={{
                    backgroundColor:
                      mode === "graph" ? "rgba(255,255,255,0.2)" : "rgba(15,138,131,0.15)",
                    color: mode === "graph" ? "#fff" : "var(--teal-bright)",
                  }}
                >
                  {graph.stats.totalNodes} nodes
                </span>
              )}
            </button>

            {/* Mode 3: Searchable Module Explorer */}
            <button
              type="button"
              id="code-explorer-mode-modules-btn"
              onClick={() => setMode("modules")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: mode === "modules" ? "var(--teal-primary)" : "transparent",
                color: mode === "modules" ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: mode === "modules" ? "0 2px 8px rgba(15,138,131,0.3)" : "none",
              }}
            >
              <LayersIcon className="w-3.5 h-3.5" />
              <span>Module Explorer</span>
              {modules.length > 0 && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                  style={{
                    backgroundColor:
                      mode === "modules" ? "rgba(255,255,255,0.2)" : "rgba(15,138,131,0.15)",
                    color: mode === "modules" ? "#fff" : "var(--teal-bright)",
                  }}
                >
                  {modules.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {mode === "map" && "Spatial domain grouping & inspector"}
          {mode === "graph" &&
            (graph
              ? `${graph.stats.totalNodes} nodes • ${graph.stats.totalEdges} edges`
              : "AST Relationship Graph")}
          {mode === "modules" &&
            `${modules.length || brief.conceptualMap.areas.length} indexed modules`}
        </div>
      </div>

      {/* Mode View 1: Spatial Codebase Map */}
      {mode === "map" && (
        <div className="animate-fade-in">
          <CodebaseMapWorkbench
            brief={brief}
            evidenceSummary={evidenceSummary}
            onExploreAnother={onExploreAnother}
            activeNavSection="map"
            focusedAreaId={focusedAreaId}
            onSelectArea={onSelectArea}
            hideHeader={true}
            hideSidebar={true}
            initialMode="map"
          />
        </div>
      )}

      {/* Mode View 2: Interactive Relationship Graph */}
      {mode === "graph" && (
        <div className="animate-fade-in">
          {graph ? (
            <ProjectGraphViewer
              graph={graph}
              modules={modules}
              insights={insights}
              initialSelectedNodeId={focusedNodeId}
            />
          ) : (
            <div
              className="p-10 rounded-2xl border text-center space-y-4"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl"
                style={{
                  backgroundColor: "rgba(15,138,131,0.12)",
                  color: "var(--teal-bright)",
                  border: "1px solid rgba(53,208,195,0.3)",
                }}
              >
                <ActivityIcon className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  AST Dependency Graph Not Stored Yet
                </h3>
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  The deep node-and-edge AST dependency graph is generated when saving a repository
                  to your account for persistent index tracking. You can explore the spatial
                  Codebase Map right now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode("map")}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "var(--text-primary)",
                }}
              >
                Switch to Spatial Codebase Map
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode View 3: Searchable Module Explorer */}
      {mode === "modules" && (
        <div className="animate-fade-in">
          {modules.length > 0 ? (
            <ModuleExplorerTab
              modules={modules}
              insights={insights}
              onFocusModuleInGraph={handleFocusModuleInGraph}
            />
          ) : (
            <div
              className="p-10 rounded-2xl border text-center space-y-4"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl"
                style={{
                  backgroundColor: "rgba(15,138,131,0.12)",
                  color: "var(--teal-bright)",
                  border: "1px solid rgba(53,208,195,0.3)",
                }}
              >
                <LayersIcon className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Structured Module Details Not Stored Yet
                </h3>
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Fine-grained route-by-route and model-by-model module indexing is generated during
                  repository analysis. You can inspect the module islands in the Codebase Map.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode("map")}
                className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "var(--text-primary)",
                }}
              >
                Switch to Spatial Codebase Map
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
