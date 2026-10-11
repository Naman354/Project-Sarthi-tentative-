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
  // Categorize areas into Public API Surface vs Internal Core vs Test Harness
  const publicApiAreas = areas.filter(
    (a) =>
      /api|export|public|entry|interface|surface|type|error|macro|trait/i.test(a.name) ||
      a.associatedFiles.some((f) => f.includes("lib.rs") || f.includes("index.ts"))
  );

  const testHarnessAreas = areas.filter(
    (a) =>
      /test|spec|bench|qa|verify|harness/i.test(a.name) ||
      a.associatedFiles.some((f) => f.includes("tests") || f.includes("test"))
  );

  const internalCoreAreas = areas.filter(
    (a) => !publicApiAreas.includes(a) && !testHarnessAreas.includes(a)
  );

  const sections = [
    {
      id: "public-contract",
      title: "Public API Surface & Exported Contracts",
      subtitle:
        "Callable interfaces, types, macros, and entrypoints consumed by downstream projects",
      badge: "Exported Interface",
      badgeColor:
        "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800",
      accent: "border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20",
      items: publicApiAreas.length > 0 ? publicApiAreas : areas.slice(0, 1),
    },
    {
      id: "internal-core",
      title: "Internal Engine & Module Subsystems",
      subtitle: "Implementation logic, state management, algorithm routines, and helper internals",
      badge: "Internal Core",
      badgeColor:
        "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
      accent: "border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20",
      items:
        internalCoreAreas.length > 0
          ? internalCoreAreas
          : areas.slice(1, Math.max(2, areas.length - 1)),
    },
    {
      id: "verification-qa",
      title: "Test Harness & Build Contract",
      subtitle: "Integration tests, compiler specifications, feature gates, and benchmarks",
      badge: "Specification & QA",
      badgeColor:
        "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
      accent: "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20",
      items:
        testHarnessAreas.length > 0 ? testHarnessAreas : areas.slice(Math.max(1, areas.length - 1)),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span>📦</span>
          <span>Library &amp; Reusable SDK Public Contract</span>
        </span>
        <span className="text-[11px] font-mono">
          Public Exports ➔ Internal Module Subsystems ➔ Test Contract
        </span>
      </div>

      {/* Structured Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`p-4 rounded-2xl border ${section.accent} shadow-2xs space-y-3`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {section.title}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border ${section.badgeColor}`}
                >
                  {section.badge}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {section.items.length} {section.items.length === 1 ? "module" : "modules"}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{section.subtitle}</p>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {section.items.map((item) => {
                const isSelected = item.id === selectedAreaId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectArea(item.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-purple-600 dark:border-purple-500 bg-white dark:bg-zinc-800 shadow-md ring-2 ring-purple-500/20"
                        : "border-zinc-200/90 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-500 hover:shadow-2xs"
                    }`}
                  >
                    <div>
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
                      <span
                        className={
                          isSelected
                            ? "text-purple-600 dark:text-purple-400 font-bold"
                            : "text-zinc-400"
                        }
                      >
                        {isSelected ? "● Selected" : "Inspect interface"}
                      </span>
                      {item.nextStep && (
                        <span className="text-zinc-400 truncate max-w-[120px]">
                          ➔ {item.nextStep}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
