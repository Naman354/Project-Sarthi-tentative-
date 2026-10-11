"use client";

import React, { useMemo } from "react";
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
  const stages = useMemo(() => {
    const rawStages = [
      {
        id: "cli-input",
        phase: "Phase 01",
        title: "CLI Invocations & Flags",
        desc: "Terminal flags, options, configuration files, and shell environment",
        icon: "⌨️",
        color: "var(--accent-amber)",
        bg: "rgba(244,176,79,0.12)",
        border: "rgba(244,176,79,0.35)",
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
        title: "Command Dispatcher",
        desc: "Subcommand routing, handler mapping, and command execution trees",
        icon: "⚡",
        color: "var(--accent-blue)",
        bg: "rgba(77,159,216,0.12)",
        border: "rgba(77,159,216,0.35)",
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
        title: "Operations & Execution Engine",
        desc: "File processing, system routines, core algorithms, and operations",
        icon: "⚙️",
        color: "var(--accent-purple)",
        bg: "rgba(144,100,217,0.12)",
        border: "rgba(144,100,217,0.35)",
        badge: "Core Operations",
        items: areas.filter(
          (a) =>
            /engine|logic|process|service|tool|work|core/i.test(a.name) &&
            !/command|dispatch|arg/i.test(a.name)
        ),
      },
      {
        id: "cli-output",
        phase: "Phase 04",
        title: "Terminal Output & Reports",
        desc: "STDOUT rendering, color formatting, JSON exports, and errors",
        icon: "📄",
        color: "var(--accent-green)",
        bg: "rgba(85,184,121,0.12)",
        border: "rgba(85,184,121,0.35)",
        badge: "STDOUT / Output",
        items: areas.filter((a) => /output|format|render|log|result|view|print|exit/i.test(a.name)),
      },
    ];

    // Gather unassigned areas into engine phase only if unassigned
    const assignedIds = new Set(rawStages.flatMap((s) => s.items.map((i) => i.id)));
    const unassigned = areas.filter((a) => !assignedIds.has(a.id));
    if (unassigned.length > 0) {
      const engineStage = rawStages.find((s) => s.id === "cli-engine");
      if (engineStage) {
        engineStage.items.push(...unassigned);
      }
    }

    return rawStages.filter((s) => s.items.length > 0);
  }, [areas]);

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Visual Terminal Execution Banner */}
      <div
        className="p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-center gap-2 font-mono text-xs">
          <span style={{ color: "var(--teal-bright)" }}>$</span>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>
            cli-tool [subcommand] --options
          </span>
          <span style={{ color: "var(--text-muted)" }}>➔</span>
          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            Command Execution Pipeline
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          Invocations ➔ Command Dispatch ➔ Engine Operations ➔ Output
        </span>
      </div>

      {/* Execution Pipeline Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: `1px solid ${stage.border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <div>
              {/* Stage Header */}
              <div
                className="flex items-center justify-between pb-2 mb-2.5 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="flex items-center gap-1.5 font-mono text-xs font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span>{stage.icon}</span>
                  <span>{stage.phase}</span>
                </div>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: stage.bg,
                    color: stage.color,
                    border: `1px solid ${stage.border}`,
                  }}
                >
                  {stage.badge}
                </span>
              </div>

              <h5 className="text-xs font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                {stage.title}
              </h5>
              <p
                className="text-[11px] leading-tight mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
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
                      className="w-full text-left p-2.5 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? "var(--bg-hover)" : "var(--bg-workspace)",
                        border: isSelected
                          ? "1px solid var(--teal-bright)"
                          : "1px solid var(--border-subtle)",
                        boxShadow: isSelected
                          ? "0 0 14px rgba(53,208,195,0.25)"
                          : "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className="text-xs font-bold truncate"
                          style={{
                            color: isSelected ? "var(--teal-bright)" : "var(--text-primary)",
                          }}
                        >
                          {item.name}
                        </span>
                        {item.associatedFiles.length > 0 && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[10px] line-clamp-2 leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.role}
                      </p>
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
