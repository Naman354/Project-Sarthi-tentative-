"use client";

import React from "react";
import type { ProjectCapability } from "../../types/brief";

interface CapabilityCardProps {
  capability: ProjectCapability;
}

export default function CapabilityCard({ capability }: CapabilityCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:shadow-xs hover:border-violet-400/40 dark:hover:border-violet-700/40 transition-all p-4 sm:p-5 flex flex-col gap-2 group">
      <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors leading-snug">
        {capability.name}
      </h4>
      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {capability.description}
      </p>
    </div>
  );
}
