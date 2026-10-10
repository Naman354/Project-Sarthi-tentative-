"use client";

import React from "react";
import type { ConceptualArea } from "../../../types/brief";

interface CliToolVisualModelProps {
  areas: ConceptualArea[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
}

export default function CliToolVisualModel({
  areas,
  selectedAreaId,
  onSelectArea,
}: CliToolVisualModelProps) {
  // Sort or map areas into execution stages
  const stages = [
    {
      stage: "01",
      title: "Input & Arguments",
      subtitle: "CLI flags, options, environment variables",
      icon: "⌨️",
      items: areas.filter(
        (a) =>
          /arg|flag|input|config|env|parse/i.test(a.name) ||
          a.category === "cli" ||
          a.category === "config"
      ),
    },
    {
      stage: "02",
      title: "Command Dispatch",
      subtitle: "Main routine & subcommand router",
      icon: "⚡",
      items: areas.filter(
        (a) => /command|dispatch|router|entry|core/i.test(a.name) && !/arg|flag|input/i.test(a.name)
      ),
    },
    {
      stage: "03",
      title: "Execution Engine",
      subtitle: "Underlying operations, data processing, system calls",
      icon: "⚙️",
      items: areas.filter(
        (a) =>
          /engine|logic|process|service|tool|work/i.test(a.name) &&
          !/command|dispatch/i.test(a.name)
      ),
    },
    {
      stage: "04",
      title: "Terminal Output",
      subtitle: "Formatted results, exit codes, stderr",
      icon: "📄",
      items: areas.filter((a) => /output|format|render|log|result|view/i.test(a.name)),
    },
  ];

  // Distribute unassigned areas evenly across stages if needed
  const assignedIds = new Set(stages.flatMap((s) => s.items.map((i) => i.id)));
  const unassigned = areas.filter((a) => !assignedIds.has(a.id));

  unassigned.forEach((area, index) => {
    const targetStageIndex = (index + 1) % stages.length;
    stages[targetStageIndex]?.items.push(area);
  });

  const activeStages = stages.filter((s) => s.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span>&gt;_</span>
          <span>CLI Execution Pipeline</span>
        </span>
        <span className="font-mono text-[11px]">
          Command Path: Invocations → Execution → Terminal STDOUT
        </span>
      </div>

      {/* Horizontal Pipeline Steps on desktop, vertical on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {activeStages.map((stage, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5 font-mono text-xs text-amber-400 font-bold">
                  <span>{stage.icon}</span>
                  <span>{stage.stage}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                  Phase
                </span>
              </div>

              <h5 className="text-xs font-bold text-zinc-100 mb-0.5">{stage.title}</h5>
              <p className="text-[10px] text-zinc-400 leading-tight mb-3">{stage.subtitle}</p>

              {/* Items in this stage */}
              <div className="space-y-2">
                {stage.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer font-sans ${
                        isSelected
                          ? "border-amber-400 bg-amber-950/40 text-amber-100 shadow-xs ring-1 ring-amber-400/30"
                          : "border-zinc-800 bg-zinc-800/60 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate">{item.name}</span>
                        {item.associatedFiles.length > 0 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-700 text-zinc-300">
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step indicator arrow to next stage */}
            {idx < activeStages.length - 1 && (
              <div className="hidden md:flex justify-end pt-2 text-zinc-600">
                <span className="font-mono text-xs">➔</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
