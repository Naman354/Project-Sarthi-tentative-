"use client";

import React, { useState, useMemo, useRef } from "react";
import type { ProjectGraph, GraphNode, InsightItem, ModuleSummaryItem } from "../../types/project";
import { ContextPanel } from "./ContextPanel";
import { RequestFlowExplorer } from "./RequestFlowExplorer";
import { ZoomInIcon, ZoomOutIcon, ResetIcon, SearchIcon, TargetIcon } from "../Icons";

interface ProjectGraphViewerProps {
  graph: ProjectGraph;
  modules: ModuleSummaryItem[];
  insights: InsightItem[];
  initialSelectedNodeId?: string | null;
}

type GraphMode = "module" | "flow" | "dependency" | "health";
type FilterPreset = "all" | "api" | "database" | "frontend" | "risks";

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  width: number;
  height: number;
  tier: number;
}

export function ProjectGraphViewer({
  graph,
  modules,
  insights,
  initialSelectedNodeId,
}: ProjectGraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Graph viewing state
  const [mode, setMode] = useState<GraphMode>("module");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelectedNodeId || null
  );

  // Focus Mode state (Milestone 9)
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Preset Filters (Milestone 9)
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("all");

  // Sync selectedNodeId if initialSelectedNodeId changes via props
  const [prevInitialId, setPrevInitialId] = useState(initialSelectedNodeId);
  if (initialSelectedNodeId !== prevInitialId) {
    setPrevInitialId(initialSelectedNodeId);
    setSelectedNodeId(initialSelectedNodeId || null);
  }

  // Filters
  const [showRoutes, setShowRoutes] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showModels, setShowModels] = useState(true);
  const [showDocs, setShowDocs] = useState(true);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Calculate 1-hop neighborhood for Focus Mode
  const neighborhoodIds = useMemo(() => {
    if (!isFocusMode || !focusedNodeId) return null;
    const set = new Set<string>([focusedNodeId]);
    graph.edges.forEach((e) => {
      if (e.sourceNodeId === focusedNodeId) set.add(e.targetNodeId);
      if (e.targetNodeId === focusedNodeId) set.add(e.sourceNodeId);
    });
    return set;
  }, [isFocusMode, focusedNodeId, graph.edges]);

  // Nodes to display based on mode, focus mode, and filters
  const visibleNodes = useMemo(() => {
    let baseNodes = graph.nodes;

    // Isolate neighborhood when in Focus Mode
    if (neighborhoodIds) {
      baseNodes = baseNodes.filter((n) => neighborhoodIds.has(n.id));
    }

    // Apply Filter Preset
    if (filterPreset === "api") {
      baseNodes = baseNodes.filter((n) => ["route", "controller", "service"].includes(n.nodeType));
    } else if (filterPreset === "database") {
      baseNodes = baseNodes.filter((n) => ["model", "service"].includes(n.nodeType));
    } else if (filterPreset === "frontend") {
      baseNodes = baseNodes.filter((n) => ["component", "page"].includes(n.nodeType));
    } else if (filterPreset === "risks") {
      const riskNodeIds = new Set(
        insights.filter((i) => i.relatedNodeId).map((i) => i.relatedNodeId as string)
      );
      baseNodes = baseNodes.filter((n) => riskNodeIds.has(n.id));
    }

    if (mode === "module") {
      // In module view, nodes are modules
      return baseNodes.filter((n) => n.nodeType === "module");
    }

    return baseNodes.filter((n) => {
      if (n.nodeType === "route" && !showRoutes) return false;
      if (n.nodeType === "model" && !showModels) return false;
      if ((n.nodeType === "service" || n.nodeType === "controller") && !showServices) return false;
      if (n.nodeType === "doc" && !showDocs) return false;
      return true;
    });
  }, [
    graph.nodes,
    neighborhoodIds,
    filterPreset,
    mode,
    showRoutes,
    showModels,
    showServices,
    showDocs,
    insights,
  ]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  // Edges between visible nodes
  const visibleEdges = useMemo(() => {
    return graph.edges.filter(
      (e) => visibleNodeIds.has(e.sourceNodeId) && visibleNodeIds.has(e.targetNodeId)
    );
  }, [graph.edges, visibleNodeIds]);

  // Layered Auto-Layout Algorithm (DAG / Hierarchical Layout)
  const layoutNodes = useMemo<LayoutNode[]>(() => {
    if (visibleNodes.length === 0) return [];

    // Assign tiers based on node type
    // Tier 0: Module
    // Tier 1: Route
    // Tier 2: Controller / Service / Component
    // Tier 3: Model
    // Tier 4: Doc / Other
    const getTier = (type: string) => {
      switch (type) {
        case "module":
          return 0;
        case "route":
          return 1;
        case "controller":
        case "service":
        case "component":
          return 2;
        case "model":
          return 3;
        case "doc":
          return 4;
        default:
          return 2;
      }
    };

    // Group nodes by tier
    const tiers: Map<number, GraphNode[]> = new Map();
    visibleNodes.forEach((node) => {
      const tier = mode === "module" ? 0 : getTier(node.nodeType);
      const list = tiers.get(tier) || [];
      list.push(node);
      tiers.set(tier, list);
    });

    const result: LayoutNode[] = [];
    const nodeWidth = 240;
    const nodeHeight = 84;
    const xSpacing = 290;
    const ySpacing = 130;

    // Arrange tiers either horizontally or grid-based
    if (mode === "module") {
      // Grid arrangement for modules
      const cols = Math.max(2, Math.ceil(Math.sqrt(visibleNodes.length)));
      visibleNodes.forEach((node, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        result.push({
          ...node,
          x: col * (nodeWidth + 60) + 60,
          y: row * (nodeHeight + 70) + 60,
          width: nodeWidth,
          height: nodeHeight,
          tier: 0,
        });
      });
    } else {
      // Layered hierarchical columns
      const sortedTiers = Array.from(tiers.keys()).sort((a, b) => a - b);
      sortedTiers.forEach((tier, colIndex) => {
        const nodesInTier = tiers.get(tier) || [];
        nodesInTier.forEach((node, rowIndex) => {
          result.push({
            ...node,
            x: colIndex * xSpacing + 60,
            y: rowIndex * ySpacing + 60,
            width: nodeWidth,
            height: nodeHeight,
            tier,
          });
        });
      });
    }

    return result;
  }, [visibleNodes, mode]);

  const layoutMap = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes]);

  // Active highlighted relationships for selected node
  const activeConnections = useMemo(() => {
    if (!selectedNodeId) return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };

    const nodeIds = new Set<string>([selectedNodeId]);
    const edgeIds = new Set<string>();

    visibleEdges.forEach((edge) => {
      if (edge.sourceNodeId === selectedNodeId) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.targetNodeId);
      }
      if (edge.targetNodeId === selectedNodeId) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.sourceNodeId);
      }
    });

    return { nodeIds, edgeIds };
  }, [selectedNodeId, visibleEdges]);

  // Selected node object
  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) || null,
    [graph.nodes, selectedNodeId]
  );

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(".graph-node") ||
      (e.target as HTMLElement).closest(".graph-ctrl")
    ) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.3, prev * factor)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 80, y: 80 });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, z - 0.15));

  // Focus Mode handlers (Milestone 9)
  const handleToggleFocus = (nodeId: string) => {
    if (isFocusMode && focusedNodeId === nodeId) {
      setIsFocusMode(false);
      setFocusedNodeId(null);
    } else {
      setIsFocusMode(true);
      setFocusedNodeId(nodeId);
      setSelectedNodeId(nodeId);
      const target = layoutMap.get(nodeId);
      if (target && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPan({
          x: rect.width / 2 - target.x * zoom - (target.width * zoom) / 2,
          y: rect.height / 2 - target.y * zoom - (target.height * zoom) / 2,
        });
      }
    }
  };

  const handleExitFocus = () => {
    setIsFocusMode(false);
    setFocusedNodeId(null);
  };

  const focusedNode = useMemo(
    () => graph.nodes.find((n) => n.id === focusedNodeId) || null,
    [graph.nodes, focusedNodeId]
  );

  // Search node & focus
  const handleSearchSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const target = layoutMap.get(nodeId);
    if (target && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - target.x * zoom - (target.width * zoom) / 2,
        y: rect.height / 2 - target.y * zoom - (target.height * zoom) / 2,
      });
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return visibleNodes
      .filter((n) => n.name.toLowerCase().includes(q) || n.nodeType.toLowerCase().includes(q))
      .slice(0, 6);
  }, [visibleNodes, searchQuery]);

  return (
    <div
      className="relative w-full h-[720px] rounded-2xl border overflow-hidden select-none flex flex-col shadow-inner"
      style={{
        backgroundColor: "var(--bg-workspace)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Top Toolbar */}
      <div
        className="z-10 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 backdrop-blur-md border-b"
        style={{
          backgroundColor: "rgba(10, 15, 29, 0.95)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Modes Toggle */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl border text-xs"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("module");
              setFilterPreset("all");
            }}
            className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: mode === "module" ? "var(--teal-primary)" : "transparent",
              color: mode === "module" ? "#0a0f1d" : "var(--text-secondary)",
              boxShadow: mode === "module" ? "0 2px 8px rgba(0, 194, 203, 0.3)" : "none",
            }}
          >
            Modules ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("flow")}
            className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: mode === "flow" ? "var(--teal-primary)" : "transparent",
              color: mode === "flow" ? "#0a0f1d" : "var(--text-secondary)",
              boxShadow: mode === "flow" ? "0 2px 8px rgba(0, 194, 203, 0.3)" : "none",
            }}
          >
            Request Flow
          </button>
          <button
            type="button"
            onClick={() => setMode("dependency")}
            className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: mode === "dependency" ? "var(--teal-primary)" : "transparent",
              color: mode === "dependency" ? "#0a0f1d" : "var(--text-secondary)",
              boxShadow: mode === "dependency" ? "0 2px 8px rgba(0, 194, 203, 0.3)" : "none",
            }}
          >
            Components
          </button>
          <button
            type="button"
            onClick={() => setMode("health")}
            className="px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
            style={{
              backgroundColor: mode === "health" ? "var(--teal-primary)" : "transparent",
              color: mode === "health" ? "#0a0f1d" : "var(--text-secondary)",
              boxShadow: mode === "health" ? "0 2px 8px rgba(0, 194, 203, 0.3)" : "none",
            }}
          >
            Health &amp; Risks
          </button>
        </div>

        {/* Search & Presets */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Preset Filters */}
          {mode !== "module" && (
            <div
              className="flex items-center gap-1 p-0.5 rounded-lg border text-[11px]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setFilterPreset("all")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterPreset === "all"
                    ? "bg-zinc-700 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterPreset("api")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterPreset === "api"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                API Flow
              </button>
              <button
                type="button"
                onClick={() => setFilterPreset("database")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterPreset === "database"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                Database
              </button>
              <button
                type="button"
                onClick={() => setFilterPreset("frontend")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterPreset === "frontend"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                Frontend
              </button>
              <button
                type="button"
                onClick={() => setFilterPreset("risks")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterPreset === "risks"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                At Risk
              </button>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <SearchIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Find node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-[var(--text-muted)] w-24 sm:w-32"
              />
            </div>
            {searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-2xl p-1 z-30 space-y-1"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      handleSearchSelect(res.id);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[var(--bg-surface)] text-xs flex items-center justify-between text-white"
                  >
                    <span className="truncate font-medium">{res.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">
                      {res.nodeType}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type filters (in non-module mode) */}
          {mode !== "module" && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <button
                type="button"
                onClick={() => setShowRoutes(!showRoutes)}
                className={`px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  showRoutes
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-zinc-800/50 text-zinc-500 border-transparent opacity-60"
                }`}
              >
                Routes
              </button>
              <button
                type="button"
                onClick={() => setShowServices(!showServices)}
                className={`px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  showServices
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-zinc-800/50 text-zinc-500 border-transparent opacity-60"
                }`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => setShowModels(!showModels)}
                className={`px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  showModels
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-800/50 text-zinc-500 border-transparent opacity-60"
                }`}
              >
                Models
              </button>
              <button
                type="button"
                onClick={() => setShowDocs(!showDocs)}
                className={`px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  showDocs
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                    : "bg-zinc-800/50 text-zinc-500 border-transparent opacity-60"
                }`}
              >
                Docs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb / Location Bar */}
      {selectedNode && (
        <div
          className="z-10 flex items-center justify-between px-4 py-2 border-b text-xs text-[var(--text-secondary)]"
          style={{
            backgroundColor: "rgba(10, 15, 29, 0.8)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[var(--text-muted)]">Project</span>
            <span className="text-zinc-600">/</span>
            <span className="font-mono uppercase text-[10px] tracking-wider text-[var(--text-muted)]">
              {selectedNode.nodeType}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="font-bold truncate text-[var(--teal-bright)]">
              {selectedNode.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleToggleFocus(selectedNode.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer"
              style={{
                backgroundColor:
                  isFocusMode && focusedNodeId === selectedNode.id
                    ? "var(--accent-purple)"
                    : "rgba(168, 85, 247, 0.12)",
                borderColor:
                  isFocusMode && focusedNodeId === selectedNode.id
                    ? "var(--accent-purple)"
                    : "rgba(168, 85, 247, 0.3)",
                color: isFocusMode && focusedNodeId === selectedNode.id ? "#ffffff" : "#d8b4fe",
              }}
            >
              <TargetIcon className="w-3.5 h-3.5" />
              <span>
                {isFocusMode && focusedNodeId === selectedNode.id ? "Exit Focus" : "Focus Subgraph"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mode View: Request Flow vs Canvas */}
      {mode === "flow" ? (
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          style={{ backgroundColor: "var(--bg-workspace)" }}
        >
          <RequestFlowExplorer
            graph={graph}
            modules={modules}
            initialSelectedRouteId={
              selectedNodeId &&
              graph.nodes.find((n) => n.id === selectedNodeId)?.nodeType === "route"
                ? selectedNodeId
                : null
            }
            onSelectRoute={(id) => setSelectedNodeId(id)}
          />
        </div>
      ) : (
        <>
          {/* Main Canvas & SVG Area */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className={`relative flex-1 overflow-hidden cursor-${isPanning ? "grabbing" : "grab"}`}
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0, 194, 203, 0.1) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Floating Focus Mode Banner */}
            {isFocusMode && focusedNode && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md animate-fade-in text-white text-xs"
                style={{
                  backgroundColor: "rgba(10, 15, 29, 0.95)",
                  borderColor: "var(--teal-primary)",
                }}
              >
                <TargetIcon className="w-4 h-4 text-[var(--teal-bright)] animate-pulse" />
                <span>
                  Focus Mode:{" "}
                  <strong className="text-[var(--teal-bright)]">{focusedNode.name}</strong> •
                  Showing {visibleNodes.length} related entities
                </span>
                <button
                  type="button"
                  onClick={handleExitFocus}
                  className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "rgba(0, 194, 203, 0.15)",
                    borderColor: "rgba(0, 194, 203, 0.4)",
                    color: "var(--teal-bright)",
                  }}
                >
                  Exit Focus
                </button>
              </div>
            )}

            <div
              className="absolute inset-0 origin-top-left transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {/* SVG Connections / Edges Layer */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: "8000px", height: "8000px" }}
              >
                <defs>
                  <marker
                    id="arrowhead-normal"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#00c2cb" opacity="0.6" />
                  </marker>
                  <marker
                    id="arrowhead-active"
                    markerWidth="9"
                    markerHeight="7"
                    refX="8"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 9 3.5, 0 7" fill="#00e5ff" />
                  </marker>
                </defs>

                {visibleEdges.map((edge) => {
                  const src = layoutMap.get(edge.sourceNodeId);
                  const tgt = layoutMap.get(edge.targetNodeId);
                  if (!src || !tgt) return null;

                  const isHighlighted =
                    activeConnections.edgeIds.has(edge.id) ||
                    selectedNodeId === edge.sourceNodeId ||
                    selectedNodeId === edge.targetNodeId;

                  // Coordinates from right of source to left of target
                  const x1 = src.x + src.width;
                  const y1 = src.y + src.height / 2;
                  const x2 = tgt.x;
                  const y2 = tgt.y + tgt.height / 2;
                  const dx = Math.abs(x2 - x1) * 0.5;

                  const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isHighlighted ? "#00e5ff" : "rgba(0, 194, 203, 0.45)"}
                        strokeWidth={isHighlighted ? 3 : 1.5}
                        strokeOpacity={isHighlighted ? 1 : selectedNodeId ? 0.15 : 0.5}
                        strokeDasharray={isHighlighted ? "6 3" : undefined}
                        className={isHighlighted ? "animate-edge-flow" : ""}
                        markerEnd={
                          isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead-normal)"
                        }
                      />
                    </g>
                  );
                })}
              </svg>

              {/* HTML Nodes Layer */}
              {layoutNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnected = activeConnections.nodeIds.has(node.id);
                const isDimmed = selectedNodeId && !isSelected && !isConnected;

                const metadata = node.metadata || {};
                const method = (metadata["httpMethod"] as string) || (metadata["method"] as string);

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                    className={`graph-node absolute rounded-2xl cursor-pointer transition-all duration-200 border p-3.5 flex flex-col justify-between ${
                      isSelected
                        ? "bg-zinc-900 border-[var(--teal-bright)] shadow-2xl ring-2 ring-[var(--teal-primary)]/50 scale-105 z-20"
                        : isConnected
                          ? "bg-zinc-900/90 border-[var(--teal-primary)]/80 shadow-lg z-10"
                          : "bg-zinc-900/80 border-zinc-800 hover:border-[var(--teal-primary)]/40 hover:bg-zinc-850"
                    } ${isDimmed ? "opacity-25" : "opacity-100"}`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                      height: `${node.height}px`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            node.nodeType === "module"
                              ? "bg-purple-500"
                              : node.nodeType === "route"
                                ? "bg-blue-500"
                                : node.nodeType === "model"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                          }`}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          {node.nodeType}
                        </span>
                      </div>
                      {method && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {method}
                        </span>
                      )}
                      {node.nodeType === "module" && (
                        <span className="text-[10px] font-mono text-purple-400">
                          {node.outgoingCount ?? 0} items
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      <div className="text-xs font-bold text-zinc-100 truncate" title={node.name}>
                        {node.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Zoom & Controls Widget */}
            <div
              className="graph-ctrl absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-md border shadow-xl text-zinc-300"
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.95)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomInIcon className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-[var(--text-muted)]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOutIcon className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] hover:text-white transition-colors cursor-pointer"
                title="Reset View"
              >
                <ResetIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Mini-map Widget */}
            <div
              className="hidden sm:block absolute bottom-4 right-4 z-20 w-36 h-28 rounded-xl backdrop-blur-md border p-2 shadow-xl pointer-events-none"
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.95)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-1">
                Overview Minimap
              </div>
              <div
                className="relative w-full h-[76px] rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: "rgba(6, 9, 19, 0.8)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {layoutNodes.map((n) => (
                  <div
                    key={n.id}
                    className={`absolute w-1.5 h-1 rounded-sm ${
                      selectedNodeId === n.id ? "bg-[var(--teal-bright)]" : "bg-zinc-600"
                    }`}
                    style={{
                      left: `${(n.x / 2500) * 100}%`,
                      top: `${(n.y / 1800) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Floating Context Panel (Slide in from right) */}
          {selectedNode && (
            <div className="absolute top-0 right-0 bottom-0 z-30 animate-slide-in-right">
              <ContextPanel
                node={selectedNode}
                edges={graph.edges}
                allNodes={graph.nodes}
                insights={insights}
                isFocused={isFocusMode && focusedNodeId === selectedNode.id}
                onToggleFocus={handleToggleFocus}
                onClose={() => setSelectedNodeId(null)}
                onSelectNode={(n) => handleSearchSelect(n.id)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
