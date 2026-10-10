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
  const stages = [
    {
      id: "cli-input",
      phase: "Phase 01",
      title: "CLI Invocations & Argument Parsing",
      desc: "Terminal flags, options, config files, and shell environment",
      icon: "⌨️",
      accent: "border-amber-500/40 bg-amber-500/5",
      badge: "Input & Flags",
      items: areas.filter(
        (a) =>
          /arg|flag|input|config|env|parse|opt/i.test(a.name) ||
          a.category === "cli" ||
          a.category === "config"
      ),
    },
    {
      id: "cli-dispatch",
      phase: "Phase 02",
      title: "Command Dispatcher & Subcommands",
      desc: "Subcommand routing, handler mapping, and command execution trees",
      icon: "⚡",
      accent: "border-blue-500/40 bg-blue-500/5",
      badge: "Command Router",
      items: areas.filter(
        (a) =>
          /command|dispatch|router|entry|subcommand/i.test(a.name) &&
          !/arg|flag|input/i.test(a.name)
      ),
    },
    {
      id: "cli-engine",
      phase: "Phase 03",
      title: "Execution Engine & Core Operations",
      desc: "File processing, system calls, business routines, and subprocesses",
      icon: "⚙️",
      accent: "border-purple-500/40 bg-purple-500/5",
      badge: "Operations Engine",
      items: areas.filter(
        (a) =>
          /engine|logic|process|service|tool|work|core/i.test(a.name) &&
          !/command|dispatch|arg/i.test(a.name)
      ),
    },
    {
      id: "cli-output",
      phase: "Phase 04",
      title: "Formatted Terminal Output & Exit Codes",
      desc: "STDOUT rendering, color formatting, JSON exports, and STDERR errors",
      icon: "📄",
      accent: "border-emerald-500/40 bg-emerald-500/5",
      badge: "STDOUT / STDERR",
      items: areas.filter((a) => /output|format|render|log|result|view|print|exit/i.test(a.name)),
    },
  ];

  // Distribute unassigned areas
  const assignedIds = new Set(stages.flatMap((s) => s.items.map((i) => i.id)));
  const unassigned = areas.filter((a) => !assignedIds.has(a.id));
  unassigned.forEach((area, index) => {
    const targetIndex = (index + 1) % stages.length;
    stages[targetIndex]?.items.push(area);
  });

  const activeStages = stages.filter((s) => s.items.length > 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Visual Terminal Execution Banner */}
      <div className="p-3.5 rounded-2xl bg-zinc-950 text-zinc-100 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 font-mono text-xs text-amber-400">
          <span className="text-zinc-500">$</span>
          <span className="font-bold">cli-tool [subcommand] --options</span>
          <span className="text-zinc-500">➔</span>
          <span className="text-zinc-400 text-[11px]">Terminal Pipeline Flow</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          Invocations ➔ Command Dispatch ➔ Engine Operations ➔ Formatted Output
        </span>
      </div>

      {/* Execution Pipeline Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {activeStages.map((stage, idx) => (
          <div
            key={stage.id}
            className={`p-4 rounded-2xl border ${stage.accent} bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between space-y-3`}
          >
            <div>
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <span>{stage.icon}</span>
                  <span>{stage.phase}</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {stage.badge}
                </span>
              </div>

              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">
                {stage.title}
              </h5>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mb-3">
                {stage.desc}
              </p>

              {/* Items in Stage */}
              <div className="space-y-2">
                {stage.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-zinc-950 dark:text-zinc-100 shadow-xs ring-1 ring-amber-500/30 font-semibold"
                          : "border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate">{item.name}</span>
                        {item.associatedFiles.length > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {idx < activeStages.length - 1 && (
              <div className="hidden lg:flex justify-end pt-2 text-zinc-400 font-mono text-xs">
                <span>➔ Next Phase</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
