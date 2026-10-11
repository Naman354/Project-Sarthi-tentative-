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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-1 gap-1">
        <span
          className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>🧩</span>
          <span>Modular Component Topology</span>
        </span>
        <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          Universal Modular Organization • Select a module to trace responsibility
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {areas.map((area, idx) => {
          const isSelected = area.id === selectedAreaId;
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => onSelectArea(area.id)}
              className="text-left p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[80px]"
              style={{
                backgroundColor: isSelected ? "var(--bg-hover)" : "var(--bg-workspace)",
                border: isSelected
                  ? "1px solid var(--teal-bright)"
                  : "1px solid var(--border-subtle)",
                boxShadow: isSelected
                  ? "0 0 16px rgba(53,208,195,0.25)"
                  : "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono font-bold"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      color: isSelected ? "var(--teal-bright)" : "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  {area.associatedFiles.length > 0 && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {area.associatedFiles.length} file{area.associatedFiles.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <h5
                  className="text-xs sm:text-sm font-bold mb-1 truncate"
                  style={{
                    color: isSelected ? "var(--teal-bright)" : "var(--text-primary)",
                  }}
                >
                  {area.name}
                </h5>

                <p
                  className="text-xs line-clamp-2 leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {area.role}
                </p>
              </div>

              <div
                className="mt-3 pt-2 border-t flex items-center justify-between text-[10px]"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span
                  className="font-medium"
                  style={{
                    color: isSelected ? "var(--teal-bright)" : "var(--text-muted)",
                  }}
                >
                  {isSelected ? "● Selected" : "Inspect module"}
                </span>
                {area.nextStep && (
                  <span className="truncate max-w-[140px]" style={{ color: "var(--text-muted)" }}>
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
