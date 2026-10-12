"use client";

import React from "react";
import type { ProjectBrief } from "../../types/brief";
import { SparklesIcon, TargetIcon, UserIcon, ArrowRightIcon } from "../Icons";

interface ProjectDescriptionSectionProps {
  brief: ProjectBrief;
  onExploreCapabilities?: () => void;
  onInspectArea?: (areaId: string) => void;
}

export default function ProjectDescriptionSection({
  brief,
  onExploreCapabilities,
  onInspectArea,
}: ProjectDescriptionSectionProps) {
  const capabilities = brief.capabilities || [];
  const topCapabilities = capabilities.slice(0, 4);

  return (
    <section
      id="about-section"
      aria-label="What This Project Is About"
      className="rounded-2xl p-6 sm:p-8 lg:p-10 space-y-8 animate-fade-in"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 6px 30px rgba(0,0,0,0.4)",
      }}
    >
      {/* Editorial Header & Audience Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: "rgba(15,138,131,0.15)",
              color: "var(--teal-bright)",
              border: "1px solid rgba(15,138,131,0.3)",
            }}
          >
            <TargetIcon className="w-4 h-4" />
          </span>
          <h2
            className="text-lg sm:text-xl font-extrabold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            What This Project Is About
          </h2>
        </div>

        {/* Intended Audience Tag when reliably detected */}
        {brief.intendedAudience && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto"
            style={{
              backgroundColor: "rgba(242,140,69,0.12)",
              color: "var(--accent-orange)",
              border: "1px solid rgba(242,140,69,0.3)",
            }}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Audience: {brief.intendedAudience}</span>
          </div>
        )}
      </div>

      {/* Prominent Core Purpose Statement */}
      <div className="space-y-3">
        <p
          className="text-xl sm:text-2xl lg:text-[1.65rem] font-semibold leading-relaxed tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {brief.purpose}
        </p>

        {brief.technicalOverview.categoryRationale && (
          <p
            className="text-xs sm:text-sm leading-relaxed max-w-4xl"
            style={{ color: "var(--text-secondary)" }}
          >
            {brief.technicalOverview.categoryRationale}
          </p>
        )}
      </div>

      {/* Concrete Distinctive Capabilities Highlight */}
      {topCapabilities.length > 0 && (
        <div
          className="pt-6 border-t space-y-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: "var(--text-muted)" }}
            >
              Distinctive Capabilities &amp; Behaviors
            </span>
            {capabilities.length > 4 && onExploreCapabilities && (
              <button
                type="button"
                onClick={onExploreCapabilities}
                className="text-xs font-semibold inline-flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                style={{ color: "var(--teal-bright)" }}
              >
                <span>View all {capabilities.length} capabilities</span>
                <ArrowRightIcon className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topCapabilities.map((cap) => (
              <div
                key={cap.id}
                className="p-4 rounded-xl flex items-start gap-3.5 transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: "rgba(15,138,131,0.15)",
                    border: "1px solid rgba(53,208,195,0.3)",
                    color: "var(--teal-bright)",
                  }}
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className="text-sm font-bold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {cap.name}
                    </h3>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {cap.evidenceStatus.replace("_", " ")}
                    </span>
                  </div>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {cap.description}
                  </p>
                  {(() => {
                    const matchedArea = brief.conceptualMap?.areas?.find(
                      (a) =>
                        a.associatedFiles?.some((f) => cap.primaryFiles?.includes(f)) ||
                        a.name.toLowerCase() === cap.name.toLowerCase()
                    );
                    if (matchedArea && onInspectArea) {
                      return (
                        <button
                          type="button"
                          onClick={() => onInspectArea(matchedArea.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400 hover:text-teal-300 transition-colors pt-1 focus:outline-none focus:underline"
                        >
                          <span>Inspect in Codebase Map</span>
                          <ArrowRightIcon className="w-3 h-3" />
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
