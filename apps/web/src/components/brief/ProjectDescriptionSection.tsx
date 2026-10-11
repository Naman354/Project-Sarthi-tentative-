"use client";

import React from "react";
import type { ProjectBrief } from "../../types/brief";

interface ProjectDescriptionSectionProps {
  brief: ProjectBrief;
}

export default function ProjectDescriptionSection({ brief }: ProjectDescriptionSectionProps) {
  const capabilities = brief.capabilities || [];

  return (
    <section
      aria-label="What this project is"
      className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm"
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center text-sm">
          ◎
        </span>
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          What this project is
        </span>
        {brief.intendedAudience && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
              for {brief.intendedAudience}
            </span>
          </>
        )}
      </div>

      {/* Purpose — prominent, large */}
      <p className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-snug mb-6">
        {brief.purpose}
      </p>

      {/* Top capabilities as a readable list */}
      {capabilities.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-3">
            Key things it can do
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {capabilities.slice(0, 6).map((cap) => (
              <div key={cap.id} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block leading-snug">
                    {cap.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {cap.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
