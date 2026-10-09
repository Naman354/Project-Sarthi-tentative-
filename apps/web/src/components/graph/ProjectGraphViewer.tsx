"use client";

import React, { useState, useMemo, useRef } from "react";
import type { ProjectGraph, GraphNode, InsightItem, ModuleSummaryItem } from "../../types/project";
import { ContextPanel } from "./ContextPanel";
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
    <div className="relative w-full h-[720px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden select-none flex flex-col shadow-inner">
      {/* Top Toolbar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        {/* Modes Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("module");
              setFilterPreset("all");
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "module"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Modules ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("flow")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "flow"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Request Flow
          </button>
          <button
            type="button"
            onClick={() => setMode("dependency")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "dependency"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Components
          </button>
          <button
            type="button"
            onClick={() => setMode("health")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === "health"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Health &amp; Risks
          </button>
        </div>

        {/* Search & Presets */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Preset Filters (Milestone 9) */}
          {mode !== "module" && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-800/90 border border-zinc-700/70 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterPreset("all")}
                className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterPreset === "all"
                    ? "bg-zinc-700 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
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
                    : "text-zinc-400 hover:text-zinc-200"
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
                    : "text-zinc-400 hover:text-zinc-200"
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
                    : "text-zinc-400 hover:text-zinc-200"
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
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                At Risk
              </button>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300">
              <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Find node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-24 sm:w-32"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1 z-30 space-y-1">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      handleSearchSelect(res.id);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-zinc-800 text-xs flex items-center justify-between text-zinc-200"
                  >
                    <span className="truncate font-medium">{res.name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">{res.nodeType}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type filters (in non-module mode) */}
          {mode !== "module" && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
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

      {/* Breadcrumb / Location Bar (Milestone 9) */}
      {selectedNode && (
        <div className="z-10 flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-zinc-500">Project</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">
              {selectedNode.nodeType}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-indigo-400 font-bold truncate">{selectedNode.name}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleToggleFocus(selectedNode.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                isFocusMode && focusedNodeId === selectedNode.id
                  ? "bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30"
                  : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
              }`}
            >
              <TargetIcon className="w-3.5 h-3.5" />
              <span>
                {isFocusMode && focusedNodeId === selectedNode.id ? "Exit Focus" : "Focus Subgraph"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Canvas & SVG Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 overflow-hidden cursor-${isPanning ? "grabbing" : "grab"}`}
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Floating Focus Mode Banner (Milestone 9) */}
        {isFocusMode && focusedNode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-purple-950/90 border border-purple-500/60 shadow-2xl backdrop-blur-md animate-fade-in text-white text-xs">
            <TargetIcon className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>
              Focus Mode: <strong className="text-purple-200">{focusedNode.name}</strong> • Showing{" "}
              {visibleNodes.length} related entities
            </span>
            <button
              type="button"
              onClick={handleExitFocus}
              className="ml-2 px-2.5 py-0.5 rounded-full bg-purple-800 hover:bg-purple-700 text-[11px] font-semibold border border-purple-400/40 text-purple-100 transition-colors cursor-pointer"
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
                <polygon points="0 0, 8 3, 0 6" fill="#6366f1" opacity="0.6" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="9"
                markerHeight="7"
                refX="8"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 9 3.5, 0 7" fill="#a855f7" />
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
                    stroke={isHighlighted ? "#a855f7" : "#4f46e5"}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeOpacity={isHighlighted ? 1 : selectedNodeId ? 0.15 : 0.5}
                    strokeDasharray={isHighlighted ? "6 3" : undefined}
                    className={isHighlighted ? "animate-edge-flow" : ""}
                    markerEnd={isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead-normal)"}
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
                    ? "bg-zinc-900 border-indigo-500 shadow-2xl ring-2 ring-indigo-500/50 scale-105 z-20"
                    : isConnected
                      ? "bg-zinc-900/90 border-purple-500/80 shadow-lg z-10"
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850"
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
        <div className="graph-ctrl absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 shadow-xl text-zinc-300">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomInIcon className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-2 text-zinc-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOutIcon className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            title="Reset View"
          >
            <ResetIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Mini-map Widget */}
        <div className="hidden sm:block absolute bottom-4 right-4 z-20 w-36 h-28 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 shadow-xl pointer-events-none">
          <div className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mb-1">
            Overview Minimap
          </div>
          <div className="relative w-full h-[76px] bg-zinc-950/80 rounded-lg border border-zinc-800/80 overflow-hidden">
            {layoutNodes.map((n) => (
              <div
                key={n.id}
                className={`absolute w-1.5 h-1 rounded-sm ${
                  selectedNodeId === n.id ? "bg-indigo-400" : "bg-zinc-600"
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
    </div>
  );
}
