"use client";

import React from "react";
import type { ProjectBrief } from "../../types/brief";

interface ProjectDescriptionSectionProps {
  brief: ProjectBrief;
  onExploreCapabilities?: () => void;
}

export default function ProjectDescriptionSection({
  brief,
  onExploreCapabilities,
}: ProjectDescriptionSectionProps) {
  const capabilities = brief.capabilities || [];
  const topCapabilities = capabilities.slice(0, 5);

  return (
    <section
      aria-label="Project Purpose & Supporting Context"
      className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-5 sm:p-6 shadow-xs backdrop-blur-sm"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Purpose & Audience */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Project Purpose &amp; Scope
            </span>
            {brief.intendedAudience && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  Intended for {brief.intendedAudience}
                </span>
              </>
            )}
          </div>

          <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {brief.purpose}
          </p>
        </div>

        {/* Most Important Capabilities in Compact Format */}
        {topCapabilities.length > 0 && (
          <div className="shrink-0 space-y-1.5 md:max-w-md">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Key Capabilities
              </span>
              {onExploreCapabilities && (
                <button
                  type="button"
                  onClick={onExploreCapabilities}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View all ({capabilities.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {topCapabilities.map((cap) => (
                <span
                  key={cap.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium border border-zinc-200/80 dark:border-zinc-700/60"
                  title={cap.description}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{cap.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
