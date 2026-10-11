"use client";

import React, { useMemo } from "react";
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
  // Categorize areas truthfully into Public API Surface vs Routing/Middleware vs Internal Core vs Test Harness
  const publicApiAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        /api|export|public|entry|interface|surface|type|error|macro|trait|bootstrap/i.test(
          a.name
        ) ||
        a.associatedFiles.some((f) => /lib\.rs|index\.ts|express\.js|main\.go|mod\.rs/i.test(f))
    );
  }, [areas]);

  const pipelineAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        !publicApiAreas.includes(a) &&
        /router|route|middleware|pipeline|handler|interceptor|dispatch/i.test(a.name)
    );
  }, [areas, publicApiAreas]);

  const testHarnessAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        !publicApiAreas.includes(a) &&
        !pipelineAreas.includes(a) &&
        (/test|spec|bench|qa|verify|harness/i.test(a.name) ||
          a.associatedFiles.some((f) => f.includes("tests") || f.includes("test")))
    );
  }, [areas, publicApiAreas, pipelineAreas]);

  const internalCoreAreas = useMemo(() => {
    return areas.filter(
      (a) =>
        !publicApiAreas.includes(a) && !pipelineAreas.includes(a) && !testHarnessAreas.includes(a)
    );
  }, [areas, publicApiAreas, pipelineAreas, testHarnessAreas]);

  const sections = useMemo(() => {
    const list = [
      {
        id: "public-contract",
        title: "Public API Surface & Exported Contracts",
        subtitle:
          "Callable interfaces, types, macros, and entrypoints consumed by downstream projects",
        badge: "Public Interface",
        color: "var(--teal-bright)",
        bg: "rgba(15,138,131,0.12)",
        border: "rgba(53,208,195,0.35)",
        items: publicApiAreas,
      },
      {
        id: "pipeline-middleware",
        title: "Routing & Middleware Subsystems",
        subtitle: "Request lifecycle handlers, route matching, and extension middleware pipelines",
        badge: "Pipeline & Routing",
        color: "var(--accent-orange)",
        bg: "rgba(242,140,69,0.12)",
        border: "rgba(242,140,69,0.35)",
        items: pipelineAreas,
      },
      {
        id: "internal-core",
        title: "Internal Engine & Core Subsystems",
        subtitle:
          "Implementation logic, application instances, protocol helpers, and internal routines",
        badge: "Internal Core",
        color: "var(--accent-purple)",
        bg: "rgba(144,100,217,0.12)",
        border: "rgba(144,100,217,0.35)",
        items: internalCoreAreas,
      },
      {
        id: "verification-qa",
        title: "Test Harness & Specification Contract",
        subtitle: "Integration tests, compiler specifications, feature gates, and benchmarks",
        badge: "QA Contract",
        color: "var(--accent-slate)",
        bg: "rgba(129,145,150,0.12)",
        border: "rgba(129,145,150,0.3)",
        items: testHarnessAreas,
      },
    ];

    // Only render sections with actual truthful items
    return list.filter((s) => s.items.length > 0);
  }, [publicApiAreas, pipelineAreas, internalCoreAreas, testHarnessAreas]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-1 gap-1">
        <span
          className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>📦</span>
          <span>Library &amp; Reusable SDK Architecture</span>
        </span>
        <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          Public Exports ➔ Subsystems &amp; Middleware ➔ Internal Core
        </span>
      </div>

      {/* Structured Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="p-5 rounded-2xl space-y-3 transition-all"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: `1px solid ${section.border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                  {section.title}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: section.bg,
                    color: section.color,
                    border: `1px solid ${section.border}`,
                  }}
                >
                  {section.badge}
                </span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {section.items.length} {section.items.length === 1 ? "module" : "modules"}
              </span>
            </div>

            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {section.subtitle}
            </p>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {section.items.map((item) => {
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
                        {isSelected ? "● Selected" : "Inspect interface"}
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
        ))}
      </div>
    </div>
  );
}
