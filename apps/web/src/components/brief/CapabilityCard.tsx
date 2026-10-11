"use client";

import React from "react";
import type { ProjectCapability } from "../../types/brief";

interface CapabilityCardProps {
  capability: ProjectCapability;
}

export default function CapabilityCard({ capability }: CapabilityCardProps) {
  return (
    <div
      className="rounded-xl p-4 sm:p-5 flex flex-col gap-2 transition-all group"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className="text-sm sm:text-base font-bold transition-colors leading-snug group-hover:text-[var(--teal-bright)]"
          style={{ color: "var(--text-primary)" }}
        >
          {capability.name}
        </h4>
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: "var(--teal-bright)" }}
        />
      </div>
      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {capability.description}
      </p>
    </div>
  );
}
