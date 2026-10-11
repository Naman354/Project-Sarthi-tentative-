"use client";

import React, { useMemo } from "react";
import type { ProjectCapability, ConceptualArea, EvidenceStatus } from "../../types/brief";

interface CapabilityIndexProps {
  capabilities: ProjectCapability[];
  areas: ConceptualArea[];
  onInspectArea?: (areaId: string) => void;
}

const STATUS_CONFIG: Record<
  EvidenceStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  documented: {
    label: "Documented",
    bg: "rgba(85,184,121,0.12)",
    text: "var(--accent-green)",
    border: "rgba(85,184,121,0.3)",
  },
  implementation_found: {
    label: "Implemented",
    bg: "rgba(15,138,131,0.14)",
    text: "var(--teal-bright)",
    border: "rgba(53,208,195,0.35)",
  },
  test_found: {
    label: "Verified",
    bg: "rgba(77,159,216,0.12)",
    text: "var(--accent-blue)",
    border: "rgba(77,159,216,0.3)",
  },
  inferred: {
    label: "Inferred",
    bg: "rgba(244,176,79,0.12)",
    text: "var(--accent-amber)",
    border: "rgba(244,176,79,0.3)",
  },
  unresolved: {
    label: "Unresolved",
    bg: "rgba(129,145,150,0.12)",
    text: "var(--accent-slate)",
    border: "rgba(129,145,150,0.25)",
  },
};

function classifyCapabilityDomain(cap: ProjectCapability): {
  id: string;
  name: string;
  icon: string;
} {
  const text = (cap.name + " " + cap.description).toLowerCase();
  if (/route|routing|router|endpoint|http|request|url|param|rest|controller/i.test(text)) {
    return { id: "routing", name: "Routing & Request Dispatch", icon: "⚡" };
  }
  if (/middleware|handler|filter|pipeline|interceptor|auth|cors|body/i.test(text)) {
    return { id: "middleware", name: "Middleware & Extensibility", icon: "🧩" };
  }
  if (/render|template|view|engine|html|static|response|send/i.test(text)) {
    return { id: "views", name: "Rendering & View Integration", icon: "🎨" };
  }
  if (/data|db|store|cache|model|schema|file|stream|io/i.test(text)) {
    return { id: "data", name: "Data Processing & Storage", icon: "🗄️" };
  }
  if (/cli|command|tool|terminal|arg|script/i.test(text)) {
    return { id: "cli", name: "Command-Line & CLI Workflows", icon: "💻" };
  }
  if (/core|app|application|boot|init|config|setting|lifecycle/i.test(text)) {
    return { id: "core", name: "Core Application & Lifecycle", icon: "⚙️" };
  }
  return { id: "general", name: "Subsystem Capabilities", icon: "✦" };
}

export default function CapabilityIndex({
  capabilities,
  areas,
  onInspectArea,
}: CapabilityIndexProps) {
  // Map capabilities to conceptual areas based on shared files or matching names
  const capabilityAreaMap = useMemo(() => {
    const map = new Map<string, ConceptualArea>();

    capabilities.forEach((cap) => {
      // 1. Direct file match
      const matchedByFile = areas.find((area) =>
        area.associatedFiles.some((f) => cap.primaryFiles.includes(f))
      );
      if (matchedByFile) {
        map.set(cap.id, matchedByFile);
        return;
      }

      // 2. Name match if specific and high confidence
      const capNameLower = cap.name.toLowerCase();
      const matchedByName = areas.find((area) => {
        const areaNameLower = area.name.toLowerCase();
        return (
          capNameLower.includes(areaNameLower) ||
          (areaNameLower.length > 4 && cap.description.toLowerCase().includes(areaNameLower))
        );
      });
      if (matchedByName) {
        map.set(cap.id, matchedByName);
      }
    });

    return map;
  }, [capabilities, areas]);

  // Group capabilities by functional domain
  const domainGroups = useMemo(() => {
    const groups: Record<
      string,
      { meta: { id: string; name: string; icon: string }; items: ProjectCapability[] }
    > = {};

    capabilities.forEach((cap) => {
      const domain = classifyCapabilityDomain(cap);
      if (!groups[domain.id]) {
        groups[domain.id] = { meta: domain, items: [] };
      }
      groups[domain.id].items.push(cap);
    });

    return Object.values(groups);
  }, [capabilities]);

  return (
    <section
      id="capabilities-section"
      className="rounded-2xl p-6 sm:p-7 space-y-6"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
      }}
    >
      {/* Editorial Section Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <h3
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span>What This Project Does</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              {capabilities.length} capabilities
            </span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Concrete behavioral jobs and capabilities discovered across the codebase architecture
          </p>
        </div>

        <div className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          Structured Capability Index
        </div>
      </div>

      {/* Domain Groups Index */}
      <div className="space-y-6">
        {domainGroups.map((group) => (
          <div key={group.meta.id} className="space-y-3">
            {/* Domain Group Label */}
            <div className="flex items-center gap-2">
              <span className="text-sm">{group.meta.icon}</span>
              <h4
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-primary)" }}
              >
                {group.meta.name}
              </h4>
              <div
                className="h-px flex-1 ml-2"
                style={{ backgroundColor: "var(--border-subtle)" }}
              />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {group.items.length} {group.items.length === 1 ? "job" : "jobs"}
              </span>
            </div>

            {/* Structured Capability Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((cap) => {
                const status = STATUS_CONFIG[cap.evidenceStatus] || STATUS_CONFIG.inferred;
                const matchedArea = capabilityAreaMap.get(cap.id);

                return (
                  <div
                    key={cap.id}
                    className="p-4 rounded-xl flex flex-col justify-between transition-all group"
                    style={{
                      backgroundColor: "var(--bg-workspace)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="space-y-2">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <h5
                          className="text-xs sm:text-sm font-bold tracking-tight"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {cap.name}
                        </h5>

                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: status.bg,
                            color: status.text,
                            border: `1px solid ${status.border}`,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Concrete Description */}
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {cap.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Map Inspection Action */}
                    <div
                      className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      {/* Primary Files tag if available */}
                      {cap.primaryFiles.length > 0 ? (
                        <span
                          className="font-mono text-[10px] truncate max-w-[200px]"
                          style={{ color: "var(--text-muted)" }}
                          title={cap.primaryFiles[0]}
                        >
                          {cap.primaryFiles[0].split("/").pop()}
                        </span>
                      ) : (
                        <span className="text-[10px] italic" style={{ color: "var(--text-muted)" }}>
                          Subsystem contract
                        </span>
                      )}

                      {/* Direct Map Inspection Link if supported */}
                      {matchedArea && onInspectArea ? (
                        <button
                          type="button"
                          onClick={() => onInspectArea(matchedArea.id)}
                          className="text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer group-hover:text-white"
                          style={{ color: "var(--teal-bright)" }}
                          title={`Explore ${matchedArea.name} in Codebase Map`}
                        >
                          <span>Inspect in Map</span>
                          <span>→</span>
                        </button>
                      ) : (
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Verified pattern
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
