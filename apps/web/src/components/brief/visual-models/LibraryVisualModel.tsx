"use client";

import React from "react";
import type { ConceptualArea } from "../../../types/brief";

interface LibraryVisualModelProps {
  areas: ConceptualArea[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
}

export default function LibraryVisualModel({
  areas,
  selectedAreaId,
  onSelectArea,
}: LibraryVisualModelProps) {
  // Categorize areas into Public API Surface vs Internal Core vs Configuration/Testing
  const publicApiAreas = areas.filter(
    (a) =>
      /api|export|public|entry|interface|surface|type|error|result/i.test(a.name) ||
      a.associatedFiles.some((f) => f.includes("lib.rs") || f.includes("index.ts"))
  );

  const internalCoreAreas = areas.filter(
    (a) => !publicApiAreas.includes(a) && !/test|spec|bench|config|feature|build/i.test(a.name)
  );

  const configTestingAreas = areas.filter(
    (a) =>
      /test|spec|bench|config|feature|build|flag|manifest/i.test(a.name) ||
      (!publicApiAreas.includes(a) && !internalCoreAreas.includes(a))
  );

  const columns = [
    {
      title: "Public API Surface",
      subtitle: "Exported traits, structs, functions & contracts for callers",
      badge: "External Contract",
      badgeColor: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
      items: publicApiAreas.length > 0 ? publicApiAreas : areas.slice(0, 1),
    },
    {
      title: "Core Engine & Algorithms",
      subtitle: "Internal routines, memory layout & processing logic",
      badge: "Internal Core",
      badgeColor: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
      items:
        internalCoreAreas.length > 0
          ? internalCoreAreas
          : areas.slice(1, Math.max(2, areas.length - 1)),
    },
    {
      title: "Configuration & Test Harness",
      subtitle: "Compile-time feature flags, options, and unit verifications",
      badge: "Extension & QA",
      badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
      items:
        configTestingAreas.length > 0
          ? configTestingAreas
          : areas.slice(Math.max(1, areas.length - 1)),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span>📦</span>
          <span>Library Surface &amp; Module Hierarchy</span>
        </span>
        <span>Public Contract ➔ Internal Processing ➔ Config/Verification</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-700/60 pb-2.5 mb-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${col.badgeColor}`}
                >
                  {col.badge}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {col.items.length} module{col.items.length > 1 ? "s" : ""}
                </span>
              </div>

              <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">
                {col.title}
              </h5>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mb-3">
                {col.subtitle}
              </p>

              {/* Module Cards */}
              <div className="space-y-2.5">
                {col.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-purple-600 dark:border-purple-500 bg-white dark:bg-zinc-800 shadow-md ring-2 ring-purple-500/20"
                          : "border-zinc-200 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.associatedFiles.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {colIdx < columns.length - 1 && (
              <div className="hidden md:flex justify-end pt-3 text-zinc-400">
                <span className="text-xs font-mono">➔</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
