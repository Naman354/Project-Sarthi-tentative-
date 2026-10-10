"use client";

import React from "react";
import type { ConceptualArea } from "../../../types/brief";

interface UniversalVisualModelProps {
  areas: ConceptualArea[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
}

export default function UniversalVisualModel({
  areas,
  selectedAreaId,
  onSelectArea,
}: UniversalVisualModelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span>🧩</span>
          <span>Modular Component Topology</span>
        </span>
        <span>Universal Baseline • Select a module to trace responsibility</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {areas.map((area, idx) => {
          const isSelected = area.id === selectedAreaId;
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onSelectArea(area.id)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    {idx + 1}
                  </span>
                  {area.associatedFiles.length > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                      {area.associatedFiles.length} file{area.associatedFiles.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <h5
                  className={`text-sm font-bold mb-1.5 ${
                    isSelected
                      ? "text-indigo-900 dark:text-indigo-200"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {area.name}
                </h5>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {area.role}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}>
                  {isSelected ? "● Selected" : "Inspect"}
                </span>
                {area.nextStep && (
                  <span className="text-zinc-400 truncate max-w-[140px] text-[10px]">
                    ✦ Next step
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
