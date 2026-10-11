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
      className="rounded-2xl p-6 sm:p-8 space-y-5"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: "rgba(15,138,131,0.15)",
            color: "var(--teal-bright)",
            border: "1px solid rgba(15,138,131,0.3)",
          }}
        >
          ◎
        </span>
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          What this project is
        </span>
        {brief.intendedAudience && (
          <>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span className="text-xs font-semibold" style={{ color: "var(--teal-bright)" }}>
              for {brief.intendedAudience}
            </span>
          </>
        )}
      </div>

      {/* Purpose — prominent, large */}
      <p
        className="text-lg sm:text-xl font-semibold leading-relaxed"
        style={{ color: "var(--text-primary)" }}
      >
        {brief.purpose}
      </p>

      {/* Top capabilities as a readable list */}
      {capabilities.length > 0 && (
        <div className="pt-4 border-t space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
          <span
            className="text-[11px] font-bold uppercase tracking-wider block"
            style={{ color: "var(--text-muted)" }}
          >
            Key behaviors &amp; core functions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {capabilities.slice(0, 6).map((cap) => (
              <div key={cap.id} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--teal-bright)" }}
                />
                <div>
                  <span
                    className="text-xs font-semibold block leading-snug"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {cap.name}
                  </span>
                  <span
                    className="text-[11px] leading-relaxed line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
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
