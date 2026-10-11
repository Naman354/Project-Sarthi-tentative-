"use client";

import React, { useMemo } from "react";
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
  // Classify areas into web system architectural layers truthfully
  const frontendAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        a.category === "frontend" || /ui|component|page|view|frontend|client|render/i.test(a.name)
    );
  }, [areas]);

  const apiAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        !frontendAreas.includes(a) &&
        (a.category === "api" ||
          /route|api|controller|endpoint|router|middleware|handler|dispatch/i.test(a.name))
    );
  }, [areas, frontendAreas]);

  const dataAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        !frontendAreas.includes(a) &&
        !apiAreas.includes(a) &&
        (a.category === "data" ||
          /db|database|model|store|storage|repository|schema|prisma|sql|redis|cache/i.test(a.name))
    );
  }, [areas, frontendAreas, apiAreas]);

  const serviceAreas = useMemo(() => {
    return areas.filter(
      (a) => !frontendAreas.includes(a) && !apiAreas.includes(a) && !dataAreas.includes(a)
    );
  }, [areas, frontendAreas, apiAreas, dataAreas]);

  const layers = useMemo(() => {
    const list = [
      {
        id: "client-layer",
        name: "Client Ingress & Presentation Layer",
        tag: "Client Ingress",
        icon: "🌐",
        description: "User presentation, components, and client-side requests",
        items: frontendAreas,
        color: "var(--teal-bright)",
        bg: "rgba(15,138,131,0.12)",
        border: "rgba(53,208,195,0.35)",
        flowLabel: "HTTP Requests & API Calls",
      },
      {
        id: "api-layer",
        name: "HTTP Routing & API Controller Surface",
        tag: "Routing & Gateway",
        icon: "⚡",
        description: "Endpoint routing, request validation, middleware pipelines, and controllers",
        items: apiAreas,
        color: "var(--accent-orange)",
        bg: "rgba(242,140,69,0.12)",
        border: "rgba(242,140,69,0.35)",
        flowLabel: "Route Dispatch & Controller Handlers",
      },
      {
        id: "service-layer",
        name: "Domain Logic & Application Services",
        tag: "Domain Engine",
        icon: "⚙️",
        description: "Core business workflows, worker processing, and domain orchestrators",
        items: serviceAreas,
        color: "var(--accent-purple)",
        bg: "rgba(144,100,217,0.12)",
        border: "rgba(144,100,217,0.35)",
        flowLabel: "Persistence Invocations & Queries",
      },
      {
        id: "data-layer",
        name: "Data Stores & Persistence Tier",
        tag: "Data Tier",
        icon: "🗄️",
        description: "Database models, schemas, repositories, and persistence caches",
        items: dataAreas,
        color: "var(--accent-green)",
        bg: "rgba(85,184,121,0.12)",
        border: "rgba(85,184,121,0.35)",
        flowLabel: "Data Persistence & State",
      },
    ];

    // Strictly filter out empty layers — NEVER render fictitious empty layers!
    return list.filter((layer) => layer.items.length > 0);
  }, [frontendAreas, apiAreas, serviceAreas, dataAreas]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-1 gap-1">
        <span
          className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>⚡</span>
          <span>Web &amp; Backend Architectural Topology</span>
        </span>
        <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          Top-down request flow across verified repository layers
        </span>
      </div>

      {/* Layer-by-layer architectural flow */}
      <div className="space-y-3 relative">
        {layers.map((layer, idx) => (
          <div key={layer.id} className="space-y-2">
            {/* Connection Arrow between layers */}
            {idx > 0 && (
              <div className="flex items-center justify-center -my-1">
                <div
                  className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono shadow-xs"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <svg
                    className="w-3 h-3 animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: "var(--teal-bright)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  <span>{layers[idx - 1]?.flowLabel || "Dispatches to next subsystem"}</span>
                </div>
              </div>
            )}

            {/* Layer Enclosure — Sized to content */}
            <div
              className="p-4 sm:p-5 rounded-2xl transition-all"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: `1px solid ${layer.border}`,
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              }}
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 mb-3 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{layer.icon}</span>
                  <h4
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {layer.name}
                  </h4>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: layer.bg,
                      color: layer.color,
                      border: `1px solid ${layer.border}`,
                    }}
                  >
                    {layer.tag}
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {layer.items.length} {layer.items.length === 1 ? "component" : "components"}
                </span>
              </div>

              <p className="text-[11px] mb-3" style={{ color: "var(--text-secondary)" }}>
                {layer.description}
              </p>

              {/* Subsystems within layer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {layer.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className="text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col justify-between min-h-[72px]"
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
                      <div>
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
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
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
                          className="text-[11px] line-clamp-2 leading-relaxed"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {item.role}
                        </p>
                      </div>

                      <div
                        className="mt-2.5 pt-1.5 border-t flex items-center justify-between text-[10px]"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        <span
                          className="font-medium"
                          style={{
                            color: isSelected ? "var(--teal-bright)" : "var(--text-muted)",
                          }}
                        >
                          {isSelected ? "● Selected" : "Inspect subsystem"}
                        </span>
                        {item.nextStep && (
                          <span
                            className="truncate max-w-[120px]"
                            style={{ color: "var(--text-muted)" }}
                          >
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
