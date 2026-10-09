"use client";

import React from "react";
import type { GraphNode, GraphEdge, InsightItem } from "../../types/project";
import {
  XIcon,
  CompassIcon,
  RouteIcon,
  DatabaseIcon,
  LayersIcon,
  CodeIcon,
  FileTextIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "../Icons";

interface ContextPanelProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  insights: InsightItem[];
  onClose: () => void;
  onSelectNode: (node: GraphNode) => void;
}

export function ContextPanel({
  node,
  edges,
  allNodes,
  insights,
  onClose,
  onSelectNode,
}: ContextPanelProps) {
  if (!node) return null;

  // Find incoming & outgoing edges for this node
  const incomingEdges = edges.filter((e) => e.targetNodeId === node.id);
  const outgoingEdges = edges.filter((e) => e.sourceNodeId === node.id);

  // Map to nodes
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const incomingNodes = incomingEdges
    .map((e) => ({ edge: e, node: nodeMap.get(e.sourceNodeId) }))
    .filter((item): item is { edge: GraphEdge; node: GraphNode } => Boolean(item.node));
  const outgoingNodes = outgoingEdges
    .map((e) => ({ edge: e, node: nodeMap.get(e.targetNodeId) }))
    .filter((item): item is { edge: GraphEdge; node: GraphNode } => Boolean(item.node));

  // Find insights matching this node or module
  const nodeInsights = insights.filter(
    (i) =>
      i.relatedNodeId === node.id ||
      (i.relatedModule && i.relatedModule.toLowerCase() === node.name.toLowerCase())
  );

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "module":
        return <LayersIcon className="w-4 h-4 text-purple-500" />;
      case "route":
        return <RouteIcon className="w-4 h-4 text-blue-500" />;
      case "model":
        return <DatabaseIcon className="w-4 h-4 text-emerald-500" />;
      case "service":
      case "controller":
      case "component":
        return <CodeIcon className="w-4 h-4 text-amber-500" />;
      case "doc":
        return <FileTextIcon className="w-4 h-4 text-cyan-500" />;
      default:
        return <CompassIcon className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getNodeBadgeClass = (type: string) => {
    switch (type) {
      case "module":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "route":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "model":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "service":
      case "controller":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "doc":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  const metadata = node.metadata || {};
  const filePath = (metadata["filePath"] as string) || (metadata["path"] as string) || null;
  const httpMethod = (metadata["httpMethod"] as string) || (metadata["method"] as string) || null;

  return (
    <aside className="w-80 sm:w-96 flex flex-col h-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-l border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
            {getNodeIcon(node.nodeType)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getNodeBadgeClass(
                  node.nodeType
                )}`}
              >
                {node.nodeType}
              </span>
              {httpMethod && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {httpMethod}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
              {node.name}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Body content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* File Path / Location */}
        {filePath && (
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Source Location
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all select-all">
              {filePath}
            </div>
          </div>
        )}

        {/* Graph Degree Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
              Inbound Edges
            </span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {incomingEdges.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
              Outbound Edges
            </span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {outgoingEdges.length}
            </span>
          </div>
        </div>

        {/* Associated Architectural Insights */}
        {nodeInsights.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircleIcon className="w-3.5 h-3.5 text-amber-500" />
                Architectural Signals ({nodeInsights.length})
              </span>
            </div>
            <div className="space-y-2">
              {nodeInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-xl border text-xs ${
                    insight.severity === "critical"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
                      : insight.severity === "high"
                        ? "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{insight.title}</span>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider">
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outbound Relationships */}
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Outgoing Dependencies ({outgoingNodes.length})
          </span>
          {outgoingNodes.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No outgoing dependencies</p>
          ) : (
            <div className="space-y-1.5">
              {outgoingNodes.map(({ edge, node: targetNode }) => (
                <button
                  key={edge.id}
                  type="button"
                  onClick={() => onSelectNode(targetNode)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/60 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getNodeIcon(targetNode.nodeType)}
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {targetNode.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 text-zinc-400 group-hover:text-indigo-500">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      {edge.relationshipType}
                    </span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inbound Relationships */}
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Inbound Consumers ({incomingNodes.length})
          </span>
          {incomingNodes.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No inbound consumers</p>
          ) : (
            <div className="space-y-1.5">
              {incomingNodes.map(({ edge, node: sourceNode }) => (
                <button
                  key={edge.id}
                  type="button"
                  onClick={() => onSelectNode(sourceNode)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/60 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getNodeIcon(sourceNode.nodeType)}
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {sourceNode.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 text-zinc-400 group-hover:text-indigo-500">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      {edge.relationshipType}
                    </span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
