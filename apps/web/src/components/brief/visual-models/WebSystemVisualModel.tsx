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
  // Categorize areas into tiers
  const frontendAreas = areas.filter((a) => a.category === "frontend");
  const apiAreas = areas.filter((a) => a.category === "api");
  const serviceAreas = areas.filter(
    (a) =>
      a.category === "service" ||
      a.category === "config" ||
      a.category === "cli" ||
      (a.category === "core" && !apiAreas.includes(a))
  );
  const dataAreas = areas.filter((a) => a.category === "data");

  // Fallback if specific tiers are empty: distribute nicely
  const tiers = [
    {
      title: "Client & Presentation Tier",
      icon: "🖥️",
      items: frontendAreas.length > 0 ? frontendAreas : [],
      color: "border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-200",
      activeRing: "ring-sky-500",
    },
    {
      title: "API Gateway & Routing Tier",
      icon: "⚡",
      items: apiAreas.length > 0 ? apiAreas : areas.slice(0, Math.ceil(areas.length / 3)),
      color: "border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200",
      activeRing: "ring-indigo-500",
    },
    {
      title: "Services & Domain Logic Tier",
      icon: "⚙️",
      items:
        serviceAreas.length > 0
          ? serviceAreas
          : areas.slice(Math.ceil(areas.length / 3), Math.ceil((2 * areas.length) / 3)),
      color: "border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200",
      activeRing: "ring-purple-500",
    },
    {
      title: "Data Layer & Persistence Tier",
      icon: "🗄️",
      items:
        dataAreas.length > 0 ? dataAreas : areas.slice(Math.ceil((2 * areas.length) / 3)),
      color: "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200",
      activeRing: "ring-emerald-500",
    },
  ].filter((tier) => tier.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider">
          Multi-Tier System Topology
        </span>
        <span>Click any tier node to inspect architectural connections</span>
      </div>

      <div className="space-y-3 relative">
        {tiers.map((tier, tierIdx) => (
          <div key={tierIdx} className="space-y-2">
            {/* Connector arrow between tiers */}
            {tierIdx > 0 && (
              <div className="flex items-center justify-center -my-1">
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-500">
                  <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>
                    {tierIdx === 1 ? "HTTP Requests" : tierIdx === 2 ? "Service Invocations" : "Database Queries"}
                  </span>
                </div>
              </div>
            )}

            {/* Tier Group */}
            <div className="p-3.5 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span>{tier.icon}</span>
                  <span>{tier.title}</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {tier.items.length} component{tier.items.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Tier Nodes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {tier.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? `border-indigo-600 dark:border-indigo-500 bg-white dark:bg-zinc-800 shadow-md ring-2 ${tier.activeRing}`
                          : "border-zinc-200 dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-2xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h5
                            className={`text-xs font-bold truncate ${
                              isSelected
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {item.name}
                          </h5>
                          {item.associatedFiles.length > 0 && (
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded shrink-0">
                              {item.associatedFiles.length}f
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.role}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-[10px] font-semibold">
                        <span className={isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}>
                          {isSelected ? "● Selected" : "Inspect"}
                        </span>
                        {item.nextStep && (
                          <span className="text-zinc-400 truncate max-w-[120px]">
                            ✦ Next step
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
