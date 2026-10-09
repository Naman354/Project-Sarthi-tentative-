"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { ProjectGraph, ModuleSummaryItem, InsightItem } from "../../types/project";
import {
  SearchIcon,
  XIcon,
  CompassIcon,
  ActivityIcon,
  LayersIcon,
  SparklesIcon,
  CodeIcon,
  RefreshIcon,
  DatabaseIcon,
  FileTextIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "../Icons";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  graph: ProjectGraph | null;
  modules: ModuleSummaryItem[];
  insights: InsightItem[];
  onSelectNode: (nodeId: string) => void;
  onSelectModule: (moduleName: string) => void;
  onSelectTab: (tab: "overview" | "graph" | "modules" | "insights" | "entities") => void;
  onTriggerAnalysis: () => void;
}

interface SearchItem {
  id: string;
  category:
    | "Actions & Tabs"
    | "Modules"
    | "Endpoints & Routes"
    | "Components & Models"
    | "Insights & Risks";
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  graph,
  modules,
  insights,
  onSelectNode,
  onSelectModule,
  onSelectTab,
  onTriggerAnalysis,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global keyboard listener for closing on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Index all searchable items
  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];

    // 1. Navigation Actions & Tabs
    items.push(
      {
        id: "tab-overview",
        category: "Actions & Tabs",
        title: "Go to Project Overview",
        subtitle: "High-level metrics, health status, and session briefing",
        icon: <CompassIcon className="w-4 h-4 text-indigo-400" />,
        badge: "Tab",
        onSelect: () => {
          onSelectTab("overview");
          handleClose();
        },
      },
      {
        id: "tab-graph",
        category: "Actions & Tabs",
        title: "Open Interactive Project Graph",
        subtitle: "Visual topological canvas with pan, zoom & inspection",
        icon: <ActivityIcon className="w-4 h-4 text-purple-400" />,
        badge: "Tab",
        onSelect: () => {
          onSelectTab("graph");
          handleClose();
        },
      },
      {
        id: "tab-modules",
        category: "Actions & Tabs",
        title: "Explore Architectural Modules",
        subtitle: "Deep-dive into module boundaries and members",
        icon: <LayersIcon className="w-4 h-4 text-blue-400" />,
        badge: "Tab",
        onSelect: () => {
          onSelectTab("modules");
          handleClose();
        },
      },
      {
        id: "tab-insights",
        category: "Actions & Tabs",
        title: "View Insights & Health Report",
        subtitle: "Detected architectural anomalies, circular deps & metrics",
        icon: <SparklesIcon className="w-4 h-4 text-amber-400" />,
        badge: "Tab",
        onSelect: () => {
          onSelectTab("insights");
          handleClose();
        },
      },
      {
        id: "tab-entities",
        category: "Actions & Tabs",
        title: "Inspect Normalized AST Entities",
        subtitle: "Raw parsed routes, components, schemas and documents",
        icon: <CodeIcon className="w-4 h-4 text-cyan-400" />,
        badge: "Tab",
        onSelect: () => {
          onSelectTab("entities");
          handleClose();
        },
      },
      {
        id: "action-reanalyze",
        category: "Actions & Tabs",
        title: "Trigger Codebase Analysis",
        subtitle: "Re-clone repo, parse ASTs, and regenerate knowledge graph",
        icon: <RefreshIcon className="w-4 h-4 text-emerald-400" />,
        badge: "Action",
        onSelect: () => {
          handleClose();
          onTriggerAnalysis();
        },
      }
    );

    // 2. Modules
    modules.forEach((mod) => {
      items.push({
        id: `mod-${mod.name}`,
        category: "Modules",
        title: `Module: ${mod.name}`,
        subtitle: `${mod.routesCount} routes • ${mod.servicesCount} services • ${mod.modelsCount} models`,
        icon: <LayersIcon className="w-4 h-4 text-purple-400" />,
        badge: "Module",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        onSelect: () => {
          onSelectModule(mod.name);
          handleClose();
        },
      });
    });

    // 3. Graph Nodes (Routes, Services, Models, Docs)
    if (graph?.nodes) {
      graph.nodes.forEach((node) => {
        const metadata = node.metadata || {};
        const method = (metadata["httpMethod"] as string) || (metadata["method"] as string);

        if (node.nodeType === "route") {
          items.push({
            id: `node-${node.id}`,
            category: "Endpoints & Routes",
            title: node.name,
            subtitle: (metadata["path"] as string) || node.entityId,
            badge: method ? `${method}` : "ROUTE",
            badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
            icon: <CodeIcon className="w-4 h-4 text-blue-400" />,
            onSelect: () => {
              onSelectNode(node.id);
              handleClose();
            },
          });
        } else if (node.nodeType === "model") {
          items.push({
            id: `node-${node.id}`,
            category: "Components & Models",
            title: `Model: ${node.name}`,
            subtitle: node.entityId,
            badge: "MODEL",
            badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            icon: <DatabaseIcon className="w-4 h-4 text-emerald-400" />,
            onSelect: () => {
              onSelectNode(node.id);
              handleClose();
            },
          });
        } else if (node.nodeType === "service" || node.nodeType === "controller") {
          items.push({
            id: `node-${node.id}`,
            category: "Components & Models",
            title: `${node.nodeType.toUpperCase()}: ${node.name}`,
            subtitle: node.entityId,
            badge: node.nodeType.toUpperCase(),
            badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            icon: <CodeIcon className="w-4 h-4 text-amber-400" />,
            onSelect: () => {
              onSelectNode(node.id);
              handleClose();
            },
          });
        } else if (node.nodeType === "component" || node.nodeType === "page") {
          items.push({
            id: `node-${node.id}`,
            category: "Components & Models",
            title: `${node.nodeType.toUpperCase()}: ${node.name}`,
            subtitle: node.entityId,
            badge: node.nodeType.toUpperCase(),
            badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
            icon: <CodeIcon className="w-4 h-4 text-cyan-400" />,
            onSelect: () => {
              onSelectNode(node.id);
              handleClose();
            },
          });
        } else if (node.nodeType === "doc") {
          items.push({
            id: `node-${node.id}`,
            category: "Components & Models",
            title: `Doc: ${node.name}`,
            subtitle: node.entityId,
            badge: "DOC",
            badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
            icon: <FileTextIcon className="w-4 h-4 text-cyan-400" />,
            onSelect: () => {
              onSelectNode(node.id);
              handleClose();
            },
          });
        }
      });
    }

    // 4. Insights & Health Risks
    insights.forEach((ins) => {
      items.push({
        id: `ins-${ins.id}`,
        category: "Insights & Risks",
        title: ins.title,
        subtitle: ins.description,
        badge: ins.severity.toUpperCase(),
        badgeColor:
          ins.severity === "high"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
            : "bg-amber-500/10 text-amber-400 border-amber-500/30",
        icon: <AlertCircleIcon className="w-4 h-4 text-amber-400" />,
        onSelect: () => {
          onSelectTab("insights");
          handleClose();
        },
      });
    });

    return items;
  }, [
    graph,
    modules,
    insights,
    onSelectNode,
    onSelectModule,
    onSelectTab,
    onTriggerAnalysis,
    handleClose,
  ]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allItems.slice(0, 30);

    return allItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
        );
      })
      .slice(0, 40);
  }, [allItems, query]);

  // Handle arrow keys and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      setTimeout(() => {
        const el = listRef.current?.querySelector(
          `[data-index="${(selectedIndex + 1) % filteredItems.length}"]`
        );
        el?.scrollIntoView({ block: "nearest" });
      }, 10);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      setTimeout(() => {
        const el = listRef.current?.querySelector(
          `[data-index="${(selectedIndex - 1 + filteredItems.length) % filteredItems.length}"]`
        );
        el?.scrollIntoView({ block: "nearest" });
      }, 10);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeIdx = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1));
      const current = filteredItems[activeIdx];
      if (current) {
        current.onSelect();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
          <SearchIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search modules, routes, models, insights, or actions..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </div>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-800/40 select-none"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
                <SearchIcon className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-zinc-300">No matching concepts found</div>
              <div className="text-xs text-zinc-500 mt-1">
                Try searching for route paths, model names, components, or modules.
              </div>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-600/20 text-white border border-indigo-500/40"
                      : "text-zinc-300 hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                              item.badgeColor || "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRightIcon
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? "text-indigo-400 translate-x-0.5" : "text-zinc-600"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                ESC
              </kbd>{" "}
              Close
            </span>
          </div>
          <div className="text-[10px] font-mono text-indigo-400">Project Sarthi Omnibar</div>
        </div>
      </div>
    </div>
  );
}
