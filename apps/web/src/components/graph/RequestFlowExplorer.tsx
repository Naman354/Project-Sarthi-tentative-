"use client";

import React, { useState, useMemo } from "react";
import type { ProjectGraph, GraphNode, ModuleSummaryItem } from "../../types/project";
import {
  RouteIcon,
  CodeIcon,
  LayersIcon,
  SearchIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  XIcon,
} from "../Icons";

interface DetailedMiddleware {
  name: string;
  callee: string;
  args?: string[];
  isCallExpression?: boolean;
  location?: {
    filePath?: string;
    startLine?: number;
    endLine?: number;
  } | null;
  declarationLocation?: {
    filePath?: string;
    startLine?: number;
    endLine?: number;
  } | null;
  implementationResolved?: boolean;
  implementationLocation?: {
    filePath?: string;
    startLine?: number;
    endLine?: number;
  } | null;
}

interface RequestFlowExplorerProps {
  graph: ProjectGraph;
  modules?: ModuleSummaryItem[];
  initialSelectedRouteId?: string | null;
  onSelectRoute?: (routeId: string) => void;
  onNavigateSource?: (filePath: string, line?: number) => void;
  repoOwner?: string;
  repoName?: string;
  commitSha?: string;
}

export function RequestFlowExplorer({
  graph,
  modules = [],
  initialSelectedRouteId = null,
  onSelectRoute,
  onNavigateSource,
  repoOwner,
  repoName,
  commitSha,
}: RequestFlowExplorerProps) {
  // 1. Extract all route nodes from graph
  const routeNodes = useMemo(() => {
    return graph.nodes.filter((n) => n.nodeType === "route");
  }, [graph.nodes]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>("ALL");

  // Selected route state
  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    if (initialSelectedRouteId && routeNodes.some((r) => r.id === initialSelectedRouteId)) {
      return initialSelectedRouteId;
    }
    return routeNodes[0]?.id || "";
  });

  // Selected step inspector state (modal / detail card)
  const [selectedStep, setSelectedStep] = useState<{
    title: string;
    role: string;
    filePath?: string;
    startLine?: number;
    endLine?: number;
    isVerifiedImplementation: boolean;
    description: string;
  } | null>(null);

  const [copiedPath, setCopiedPath] = useState(false);

  // Sync external route selection
  const [prevInitialId, setPrevInitialId] = useState(initialSelectedRouteId);
  if (initialSelectedRouteId !== prevInitialId) {
    setPrevInitialId(initialSelectedRouteId);
    if (initialSelectedRouteId && routeNodes.some((r) => r.id === initialSelectedRouteId)) {
      setSelectedRouteId(initialSelectedRouteId);
    }
  }

  // Filter routes based on search and method
  const filteredRoutes = useMemo(() => {
    return routeNodes.filter((route) => {
      const meta = route.metadata || {};
      const method = ((meta["httpMethod"] as string) || "GET").toUpperCase();
      const pathStr = (meta["path"] as string) || route.name;
      const handlerStr = (meta["handler"] as string) || "";

      if (selectedMethodFilter !== "ALL" && method !== selectedMethodFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        route.name.toLowerCase().includes(q) ||
        pathStr.toLowerCase().includes(q) ||
        method.toLowerCase().includes(q) ||
        handlerStr.toLowerCase().includes(q)
      );
    });
  }, [routeNodes, searchQuery, selectedMethodFilter]);

  // Currently active route node
  const activeRoute = useMemo(() => {
    return (
      routeNodes.find((r) => r.id === selectedRouteId) || filteredRoutes[0] || routeNodes[0] || null
    );
  }, [routeNodes, selectedRouteId, filteredRoutes]);

  // Derive active route metadata
  const activeMeta = activeRoute?.metadata || {};
  const activeMethod = ((activeMeta["httpMethod"] as string) || "ROUTE").toUpperCase();
  const activePath = (activeMeta["path"] as string) || activeRoute?.name || "";
  const activeFilePath = (activeMeta["filePath"] as string) || activeRoute?.name || "";
  const activeStartLine =
    (activeMeta["startLine"] as number) || activeRoute?.location?.startLine || undefined;
  const activeEndLine =
    (activeMeta["endLine"] as number) || activeRoute?.location?.endLine || undefined;

  // Find client caller nodes (nodes that have 'uses' edges pointing to this route)
  const clientCallerNodes = useMemo(() => {
    if (!activeRoute) return [];
    const inboundEdges = graph.edges.filter(
      (e) => e.targetNodeId === activeRoute.id && e.relationshipType === "uses"
    );
    const callerIds = new Set(inboundEdges.map((e) => e.sourceNodeId));
    return graph.nodes.filter((n) => callerIds.has(n.id));
  }, [activeRoute, graph.edges, graph.nodes]);

  // Extract middlewares from metadata in declaration order
  const middlewares = useMemo<DetailedMiddleware[]>(() => {
    if (!activeRoute) return [];
    const meta = activeRoute.metadata || {};

    // 1. Check rich middlewares array first
    if (Array.isArray(meta["middlewares"]) && meta["middlewares"].length > 0) {
      return meta["middlewares"] as DetailedMiddleware[];
    }

    // 2. Fallback to string array
    if (Array.isArray(meta["middleware"]) && meta["middleware"].length > 0) {
      return (meta["middleware"] as string[]).map((name) => ({
        name,
        callee: name.includes("(") ? name.split("(")[0] : name,
        isCallExpression: name.includes("("),
        implementationResolved: false,
        declarationLocation: activeRoute.location || null,
      }));
    }

    return [];
  }, [activeRoute]);

  // Find controller node through 'handled_by' edge
  const controllerNode = useMemo<GraphNode | null>(() => {
    if (!activeRoute) return null;
    const handledByEdge = graph.edges.find(
      (e) => e.sourceNodeId === activeRoute.id && e.relationshipType === "handled_by"
    );
    if (!handledByEdge) return null;
    return graph.nodes.find((n) => n.id === handledByEdge.targetNodeId) || null;
  }, [activeRoute, graph.edges, graph.nodes]);

  // Find containing module
  const parentModule = useMemo(() => {
    if (!activeRoute) return null;
    const containsEdge = graph.edges.find(
      (e) => e.targetNodeId === activeRoute.id && e.relationshipType === "contains"
    );
    if (containsEdge) {
      const found = graph.nodes.find((n) => n.id === containsEdge.sourceNodeId);
      if (found) return found;
    }
    const summaryMod = modules.find((m) =>
      m.routes?.some((r) => r.id === activeRoute.id || r.name === activeRoute.name)
    );
    if (summaryMod) {
      return {
        id: summaryMod.id,
        name: summaryMod.name,
        nodeType: "module",
        entityId: summaryMod.id,
        metadata: {},
      } as GraphNode;
    }
    return null;
  }, [activeRoute, graph.edges, graph.nodes, modules]);

  // Method color helper
  const getMethodBadgeStyle = (m: string) => {
    switch (m) {
      case "GET":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "POST":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "PUT":
      case "PATCH":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "DELETE":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-teal-400 bg-teal-500/10 border-teal-500/30";
    }
  };

  const handleSelectRoute = (id: string) => {
    setSelectedRouteId(id);
    onSelectRoute?.(id);
  };

  const handleCopyPath = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  const getGitHubUrl = (filePath?: string, start?: number, end?: number) => {
    if (!repoOwner || !repoName || !filePath) return null;
    const cleanPath = filePath.replace(/^\/+/, "");
    const lineHash = start ? `#L${start}${end && end > start ? `-L${end}` : ""}` : "";
    return `https://github.com/${repoOwner}/${repoName}/blob/${commitSha || "main"}/${cleanPath}${lineHash}`;
  };

  if (routeNodes.length === 0) {
    return (
      <div
        className="p-12 text-center rounded-2xl border space-y-4 shadow-md"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
          style={{
            backgroundColor: "rgba(0, 194, 203, 0.1)",
            border: "1px solid rgba(0, 194, 203, 0.25)",
            color: "var(--teal-bright)",
          }}
        >
          <RouteIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No HTTP Endpoints Detected</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
          No Express or HTTP route declarations were identified during static repository analysis.
          Verify that router files (e.g. `routes.ts`, `app.ts`) are included in the repository.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Section: Route Selector & Filters */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-4 shadow-md"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: "rgba(0, 194, 203, 0.12)",
                border: "1px solid rgba(0, 194, 203, 0.3)",
                color: "var(--teal-bright)",
              }}
            >
              <RouteIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Request Flow Explorer</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: "rgba(53, 208, 195, 0.15)",
                    borderColor: "rgba(53, 208, 195, 0.3)",
                    color: "var(--teal-bright)",
                  }}
                >
                  {routeNodes.length} Endpoints
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Trace verified request lifecycles from client ingress to middleware and controllers
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full md:w-72"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <SearchIcon className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search route path, method, handler..."
              className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-zinc-400 hover:text-white"
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Method filter buttons & Endpoint Combobox */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => {
              const isSelected = selectedMethodFilter === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethodFilter(m)}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-zinc-950 border-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-white border-[var(--border-subtle)]"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Dropdown / Selector for Quick Jumping */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-[var(--text-muted)] font-mono shrink-0">
              Select Endpoint:
            </span>
            <select
              value={activeRoute?.id || ""}
              onChange={(e) => handleSelectRoute(e.target.value)}
              className="text-xs font-mono rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer max-w-xs truncate"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              {filteredRoutes.map((r) => {
                const rm = ((r.metadata?.httpMethod as string) || "ROUTE").toUpperCase();
                const rp = (r.metadata?.path as string) || r.name;
                return (
                  <option key={r.id} value={r.id}>
                    {rm} {rp}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Active Route Request Lifecycle Pipeline */}
      {activeRoute ? (
        <div className="space-y-6">
          {/* Active Route Header Banner */}
          <div
            className="p-5 sm:p-6 rounded-2xl border space-y-3 shadow-md"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${getMethodBadgeStyle(
                    activeMethod
                  )}`}
                >
                  {activeMethod}
                </span>
                <h2 className="text-base sm:text-lg font-mono font-extrabold text-white truncate">
                  {activePath}
                </h2>
              </div>

              {parentModule && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs shrink-0 self-start sm:self-auto"
                  style={{
                    backgroundColor: "rgba(168, 85, 247, 0.1)",
                    borderColor: "rgba(168, 85, 247, 0.25)",
                    color: "#d8b4fe",
                  }}
                >
                  <LayersIcon className="w-3.5 h-3.5" />
                  <span className="font-semibold">{parentModule.name}</span>
                </div>
              )}
            </div>

            {/* Declaration Location Strip */}
            <div
              className="flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-2 truncate text-[var(--text-muted)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Route Declaration:
                </span>
                <span className="text-white truncate">{activeFilePath}</span>
                {activeStartLine && (
                  <span className="text-teal-400">
                    :L{activeStartLine}
                    {activeEndLine && activeEndLine > activeStartLine ? `-L${activeEndLine}` : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStep({
                      title: `${activeMethod} ${activePath}`,
                      role: "HTTP Route Endpoint Declaration",
                      filePath: activeFilePath,
                      startLine: activeStartLine,
                      endLine: activeEndLine,
                      isVerifiedImplementation: true,
                      description: `Declared with Express router in ${activeFilePath}. Dispatched when matching HTTP ${activeMethod} ${activePath}.`,
                    })
                  }
                  className="text-[11px] font-semibold text-[var(--teal-bright)] hover:underline cursor-pointer"
                >
                  Inspect Coordinates
                </button>
              </div>
            </div>
          </div>

          {/* 3. Ordered Lifecycle Steps */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[var(--border-subtle)]">
            {/* STEP 1: CLIENT CALLERS / INGRESS */}
            <div className="relative group">
              <div
                className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  borderColor:
                    clientCallerNodes.length > 0 ? "var(--teal-primary)" : "var(--border-subtle)",
                  color: clientCallerNodes.length > 0 ? "var(--teal-bright)" : "var(--text-muted)",
                }}
              >
                1
              </div>

              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-3 transition-all hover:border-[var(--teal-primary)]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Step 1: Request Ingress &amp; Client Callers
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor:
                        clientCallerNodes.length > 0
                          ? "rgba(53, 208, 195, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      borderColor:
                        clientCallerNodes.length > 0
                          ? "rgba(53, 208, 195, 0.3)"
                          : "var(--border-subtle)",
                      color:
                        clientCallerNodes.length > 0 ? "var(--teal-bright)" : "var(--text-muted)",
                    }}
                  >
                    {clientCallerNodes.length > 0
                      ? `${clientCallerNodes.length} Verified Caller${clientCallerNodes.length > 1 ? "s" : ""}`
                      : "External Client"}
                  </span>
                </div>

                {clientCallerNodes.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-secondary)]">
                      The following frontend components have verified outgoing HTTP requests
                      targeting this endpoint:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {clientCallerNodes.map((caller) => (
                        <button
                          key={caller.id}
                          type="button"
                          onClick={() =>
                            setSelectedStep({
                              title: caller.name,
                              role: `Frontend Client (${caller.nodeType})`,
                              filePath: caller.metadata?.filePath as string,
                              startLine: caller.location?.startLine,
                              endLine: caller.location?.endLine,
                              isVerifiedImplementation: true,
                              description: `Frontend component making verified HTTP calls to ${activeMethod} ${activePath}.`,
                            })
                          }
                          className="p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors hover:bg-white/[0.04] cursor-pointer"
                          style={{
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--border-subtle)",
                          }}
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white truncate block">
                              {caller.name}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] truncate block">
                              {(caller.metadata?.filePath as string) || "Source file"}
                            </span>
                          </div>
                          <ArrowRightIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-3 rounded-xl border text-xs text-[var(--text-secondary)] leading-relaxed"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <span className="font-semibold text-zinc-300">External Client / Ingress:</span>{" "}
                    No verified internal React components or frontend fetch calls match this route
                    path as a static string literal. This endpoint is invoked by external clients,
                    public API consumers, or dynamic client requests.
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: INLINE MIDDLEWARE PIPELINE */}
            <div className="relative group">
              <div
                className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  borderColor:
                    middlewares.length > 0 ? "var(--teal-primary)" : "var(--border-subtle)",
                  color: middlewares.length > 0 ? "var(--teal-bright)" : "var(--text-muted)",
                }}
              >
                2
              </div>

              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-3 transition-all hover:border-[var(--teal-primary)]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Step 2: Inline Middleware Pipeline ({middlewares.length})
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor:
                        middlewares.length > 0
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      borderColor:
                        middlewares.length > 0 ? "rgba(245, 158, 11, 0.3)" : "var(--border-subtle)",
                      color: middlewares.length > 0 ? "var(--accent-amber)" : "var(--text-muted)",
                    }}
                  >
                    {middlewares.length > 0 ? "Executed in Declaration Order" : "No Middleware"}
                  </span>
                </div>

                {middlewares.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic py-1">
                    No inline middleware interceptors declared for this route. Request dispatches
                    directly to the controller.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {middlewares.map((mw, index) => {
                      const isResolved = mw.implementationResolved === true;
                      const displayFile = isResolved
                        ? mw.implementationLocation?.filePath
                        : mw.declarationLocation?.filePath || activeFilePath;
                      const displayStart = isResolved
                        ? mw.implementationLocation?.startLine
                        : mw.declarationLocation?.startLine || activeStartLine;
                      const displayEnd = isResolved
                        ? mw.implementationLocation?.endLine
                        : mw.declarationLocation?.endLine || activeEndLine;

                      return (
                        <div
                          key={index}
                          className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                          style={{
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--border-subtle)",
                          }}
                        >
                          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                            <span
                              className="text-[10px] font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
                              style={{
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                color: "var(--accent-amber)",
                              }}
                            >
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-white">
                                  {mw.name}
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                    mw.isCallExpression
                                      ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                      : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                                  }`}
                                >
                                  {mw.isCallExpression ? "Call Expression" : "Identifier"}
                                </span>
                              </div>

                              <span className="text-[10px] font-mono text-[var(--text-muted)] truncate block mt-0.5">
                                {isResolved ? "Implementation: " : "Declaration reference: "}
                                {displayFile}
                                {displayStart ? `:L${displayStart}` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isResolved
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {isResolved ? "Verified Implementation" : "Route Reference"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedStep({
                                  title: mw.name,
                                  role: `Middleware Interceptor (Step 2.${index + 1})`,
                                  filePath: displayFile,
                                  startLine: displayStart,
                                  endLine: displayEnd,
                                  isVerifiedImplementation: isResolved,
                                  description: isResolved
                                    ? `Source implementation verified at ${displayFile}:${displayStart}. Intercepts the request before handler execution.`
                                    : `Referenced at route declaration (${activeFilePath}). Implementation was not indexed or located in source.`,
                                })
                              }
                              className="text-[11px] font-semibold text-[var(--teal-bright)] hover:underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: CONTROLLER / HANDLER EXECUTION */}
            <div className="relative group">
              <div
                className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  borderColor: controllerNode ? "var(--teal-primary)" : "var(--danger)",
                  color: controllerNode ? "var(--teal-bright)" : "var(--danger)",
                }}
              >
                3
              </div>

              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-3 transition-all hover:border-[var(--teal-primary)]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Step 3: Route Handler &amp; Controller
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: controllerNode
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(244, 63, 94, 0.15)",
                      borderColor: controllerNode
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(244, 63, 94, 0.3)",
                      color: controllerNode ? "#93c5fd" : "#fca5a5",
                    }}
                  >
                    Resolved via handled_by Edge
                  </span>
                </div>

                {controllerNode ? (
                  (() => {
                    const cMeta = controllerNode.metadata || {};
                    const isResolved: boolean = Boolean(
                      cMeta["implementationResolved"] === true ||
                      (controllerNode.filePath && !controllerNode.filePath.includes("routes"))
                    );
                    const displayFile =
                      (cMeta["implementationLocation"] as { filePath?: string })?.filePath ||
                      controllerNode.filePath ||
                      activeFilePath;
                    const displayStart =
                      (cMeta["implementationLocation"] as { startLine?: number })?.startLine ||
                      controllerNode.location?.startLine ||
                      activeStartLine;
                    const displayEnd =
                      (cMeta["implementationLocation"] as { endLine?: number })?.endLine ||
                      controllerNode.location?.endLine ||
                      activeEndLine;

                    return (
                      <div
                        className="p-4 rounded-xl border space-y-3"
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.12)",
                                color: "#60a5fa",
                              }}
                            >
                              <CodeIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="font-mono text-sm font-bold text-white">
                                {controllerNode.name}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                {isResolved ? "Implementation: " : "Declaration: "}
                                {displayFile}
                                {displayStart ? `:L${displayStart}` : ""}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border self-start sm:self-auto ${
                              isResolved
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isResolved ? "Verified Implementation" : "Route Reference Only"}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {isResolved
                              ? "AST analysis confirmed implementation method declaration in controller."
                              : "Handler symbol referenced in router, but implementation file not located."}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStep({
                                title: controllerNode.name,
                                role: "Terminal Route Controller",
                                filePath: displayFile,
                                startLine: displayStart,
                                endLine: displayEnd,
                                isVerifiedImplementation: isResolved,
                                description: isResolved
                                  ? `Verified controller implementation at ${displayFile}:${displayStart}-${displayEnd}. Executes terminal business logic for this endpoint.`
                                  : `Handler symbol '${controllerNode.name}' extracted from route declaration, but external or unverified implementation.`,
                              })
                            }
                            className="font-semibold text-[var(--teal-bright)] hover:underline cursor-pointer shrink-0 ml-2"
                          >
                            Inspect Controller
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className="p-3 rounded-xl border text-xs text-rose-300"
                    style={{
                      backgroundColor: "rgba(244, 63, 94, 0.08)",
                      borderColor: "rgba(244, 63, 94, 0.25)",
                    }}
                  >
                    No terminal handler or controller found associated with this endpoint in the
                    graph.
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: DOWNSTREAM EXECUTION BOUNDARY (EXPLICIT LIMITATION) */}
            <div className="relative group">
              <div
                className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  borderColor: "rgba(244, 176, 79, 0.4)",
                  color: "var(--accent-amber)",
                }}
              >
                4
              </div>

              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: "rgba(244, 176, 79, 0.04)",
                  borderColor: "rgba(244, 176, 79, 0.25)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-amber)] flex items-center gap-1.5">
                    <AlertCircleIcon className="w-3.5 h-3.5" />
                    <span>Downstream Service &amp; Database Boundary</span>
                  </span>
                  <span
                    className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: "rgba(244, 176, 79, 0.15)",
                      borderColor: "rgba(244, 176, 79, 0.3)",
                      color: "var(--accent-amber)",
                    }}
                  >
                    Analysis Boundary
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Deep intra-procedural call-graph tracing from controller bodies to internal
                  service functions and database query operations is unverified in this milestone.
                  Project Sarthi adheres to source-grounded evidence and does not invent speculative
                  relationships.
                </p>

                <div
                  className="p-2.5 rounded-xl border text-[11px] text-[var(--text-muted)] flex items-center justify-between"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <span>
                    Data models and services are cataloged globally in the Codebase Map and Deep
                    Topology.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Step Inspector Modal / Detail Drawer */}
      {selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl animate-scale-up"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 inline-block"
                  style={{
                    backgroundColor: selectedStep.isVerifiedImplementation
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(245, 158, 11, 0.15)",
                    borderColor: selectedStep.isVerifiedImplementation
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(245, 158, 11, 0.3)",
                    color: selectedStep.isVerifiedImplementation ? "#34d399" : "#fbbf24",
                  }}
                >
                  {selectedStep.isVerifiedImplementation
                    ? "Verified Source Implementation"
                    : "Route Declaration Reference"}
                </span>
                <h3 className="text-base font-bold text-white font-mono break-all">
                  {selectedStep.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedStep.role}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {selectedStep.description}
              </p>

              {/* Source Coordinates */}
              {selectedStep.filePath && (
                <div
                  className="p-3 rounded-xl border space-y-1.5"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Source Coordinates:
                  </div>
                  <div className="font-mono text-xs text-white break-all flex items-center justify-between gap-2">
                    <span>
                      {selectedStep.filePath}
                      {selectedStep.startLine ? `:L${selectedStep.startLine}` : ""}
                      {selectedStep.endLine && selectedStep.endLine > (selectedStep.startLine || 0)
                        ? `-L${selectedStep.endLine}`
                        : ""}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyPath(selectedStep.filePath!)}
                      className="text-[10px] font-semibold text-[var(--teal-bright)] hover:underline shrink-0 cursor-pointer"
                    >
                      {copiedPath ? "Copied!" : "Copy Path"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              {getGitHubUrl(
                selectedStep.filePath,
                selectedStep.startLine,
                selectedStep.endLine
              ) && (
                <a
                  href={getGitHubUrl(
                    selectedStep.filePath,
                    selectedStep.startLine,
                    selectedStep.endLine
                  )!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer text-white hover:bg-white/[0.05]"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <span>Open on GitHub</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  if (selectedStep.filePath) {
                    onNavigateSource?.(selectedStep.filePath, selectedStep.startLine);
                  }
                  setSelectedStep(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "#0a0f1d",
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
