"use client";

import React from "react";
import type { ConceptualArea } from "../../../types/brief";

interface WebSystemVisualModelProps {
  areas: ConceptualArea[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
}

export default function WebSystemVisualModel({
  areas,
  selectedAreaId,
  onSelectArea,
}: WebSystemVisualModelProps) {
  // Classify areas into web system architectural layers
  const frontendAreas = areas.filter((a) => a.category === "frontend");
  const apiAreas = areas.filter(
    (a) =>
      a.category === "api" ||
      /route|api|controller|endpoint|router|middleware|handler/i.test(a.name)
  );
  const dataAreas = areas.filter(
    (a) =>
      a.category === "data" ||
      /db|database|model|store|storage|repository|schema|prisma|sql/i.test(a.name)
  );
  const serviceAreas = areas.filter(
    (a) => !frontendAreas.includes(a) && !apiAreas.includes(a) && !dataAreas.includes(a)
  );

  const layers = [
    {
      id: "client-layer",
      name: "Client Ingress & Frontend Interface",
      tag: "Ingress",
      icon: "🌐",
      description: "User presentation, web components, and client-side requests",
      items: frontendAreas,
      color: "border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20 text-sky-900 dark:text-sky-200",
      accent: "bg-sky-500",
    },
    {
      id: "api-layer",
      name: "HTTP Routing & API Controller Surface",
      tag: "API & Gateway",
      icon: "⚡",
      description: "Endpoint routing, request validation, middleware pipelines, and controllers",
      items: apiAreas.length > 0 ? apiAreas : areas.slice(0, Math.ceil(areas.length / 2)),
      color: "border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200",
      accent: "bg-indigo-500",
    },
    {
      id: "service-layer",
      name: "Domain Logic & Application Services",
      tag: "Service Engine",
      icon: "⚙️",
      description: "Business workflows, worker processing, and orchestrators",
      items:
        serviceAreas.length > 0
          ? serviceAreas
          : areas.slice(Math.ceil(areas.length / 2)),
      color: "border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200",
      accent: "bg-purple-500",
    },
    {
      id: "data-layer",
      name: "Data Stores & Storage Persistence",
      tag: "Data Tier",
      icon: "🗄️",
      description: "ORM schemas, persistence queries, caches, and storage adapters",
      items: dataAreas,
      color: "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200",
      accent: "bg-emerald-500",
    },
  ].filter((layer) => layer.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span>⚡</span>
          <span>Web &amp; Backend Architectural Topology</span>
        </span>
        <span className="text-[11px] font-mono">
          Top-down request processing flow: Client ➔ Routing ➔ Services ➔ Data
        </span>
      </div>

      {/* Layer-by-layer architectural flow */}
      <div className="space-y-3 relative">
        {layers.map((layer, idx) => (
          <div key={layer.id} className="space-y-2">
            {/* Connection Arrow between layers */}
            {idx > 0 && (
              <div className="flex items-center justify-center -my-1.5">
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-500 shadow-2xs">
                  <svg className="w-3 h-3 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>
                    {idx === 1
                      ? "HTTP Requests & Route Dispatch"
                      : idx === 2
                        ? "Service Invocations & Domain Handlers"
                        : "Persistence Reads & Writes"}
                  </span>
                </div>
              </div>
            )}

            {/* Layer Enclosure */}
            <div className={`p-4 rounded-2xl border ${layer.color} shadow-2xs transition-all`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{layer.icon}</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{layer.name}</h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full text-white ${layer.accent}`}>
                    {layer.tag}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {layer.items.length} {layer.items.length === 1 ? "component" : "components"}
                </span>
              </div>

              {/* Subsystems within layer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {layer.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? "border-indigo-600 dark:border-indigo-500 bg-white dark:bg-zinc-800 shadow-md ring-2 ring-indigo-500/30"
                          : "border-zinc-200/90 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-2xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.associatedFiles.length > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 shrink-0">
                              {item.associatedFiles.length}f
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.role}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-[10px]">
                        <span className={isSelected ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-zinc-400"}>
                          {isSelected ? "● Active View" : "Click to inspect"}
                        </span>
                        {item.nextStep && (
                          <span className="text-zinc-400 truncate max-w-[120px] font-medium">
                            ➔ {item.nextStep}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
