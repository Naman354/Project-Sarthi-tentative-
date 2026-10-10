"use client";

import React from "react";
import type { ProjectBrief, EvidenceSummary, ProjectCategory } from "../../types/brief";

interface ProjectFingerprintHeroProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  onExploreCapabilities?: () => void;
}

const CATEGORY_META: Record<
  ProjectCategory,
  {
    title: string;
    badgeBg: string;
    badgeText: string;
    gradient: string;
    border: string;
    icon: string;
    description: string;
  }
> = {
  "web-application": {
    title: "Web Application",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    gradient:
      "from-emerald-50/70 via-white to-indigo-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/60",
    icon: "🌐",
    description: "Interactive web frontend and full-stack application architecture",
  },
  "backend-system": {
    title: "Backend API & Service System",
    badgeBg: "bg-blue-100 dark:bg-blue-950/80",
    badgeText: "text-blue-800 dark:text-blue-300",
    gradient:
      "from-blue-50/70 via-white to-cyan-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/60",
    icon: "⚡",
    description: "Server-side API routes, business logic services, and data storage tier",
  },
  "cli-tool": {
    title: "Command-Line Tool (CLI)",
    badgeBg: "bg-amber-100 dark:bg-amber-950/80",
    badgeText: "text-amber-800 dark:text-amber-300",
    gradient:
      "from-amber-50/70 via-white to-orange-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/60",
    icon: "💻",
    description:
      "Terminal executable with argument parsing, command dispatch, and formatted output",
  },
  "library-framework": {
    title: "Software Library & SDK",
    badgeBg: "bg-purple-100 dark:bg-purple-950/80",
    badgeText: "text-purple-800 dark:text-purple-300",
    gradient:
      "from-purple-50/70 via-white to-pink-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-purple-950/30",
    border: "border-purple-200 dark:border-purple-900/60",
    icon: "📦",
    description: "Exported public APIs, data structures, and reusable components for integration",
  },
  "data-ml": {
    title: "Data & ML Pipeline",
    badgeBg: "bg-rose-100 dark:bg-rose-950/80",
    badgeText: "text-rose-800 dark:text-rose-300",
    gradient:
      "from-rose-50/70 via-white to-orange-50/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-rose-950/30",
    border: "border-rose-200 dark:border-rose-900/60",
    icon: "🧠",
    description: "Datasets, feature preparation, model architectures, and inference workflows",
  },
  universal: {
    title: "Modular Codebase",
    badgeBg: "bg-zinc-100 dark:bg-zinc-800",
    badgeText: "text-zinc-800 dark:text-zinc-200",
    gradient:
      "from-zinc-50/80 via-white to-zinc-100/60 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800/40",
    border: "border-zinc-200 dark:border-zinc-800",
    icon: "🧩",
    description: "Structured multi-module software project with baseline universal inventory",
  },
};

const LANG_DOT_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-emerald-500",
  Rust: "bg-orange-500",
  Go: "bg-cyan-500",
  Java: "bg-red-500",
  Ruby: "bg-rose-500",
  PHP: "bg-indigo-500",
  C: "bg-zinc-500",
  "C++": "bg-blue-600",
};

export default function ProjectFingerprintHero({
  brief,
  evidenceSummary,
  onExploreCapabilities,
}: ProjectFingerprintHeroProps) {
  const overview = brief.technicalOverview;
  const categoryKey: ProjectCategory = overview.projectCategory || "universal";
  const meta = CATEGORY_META[categoryKey] || CATEGORY_META.universal;

  const frameworks = overview.detectedFrameworks || [];
  const tools = overview.detectedTools || [];
  const structuralFacts = overview.structuralFacts || [];
  const confidence = overview.categoryConfidence || "inferred";
  const rationale = overview.categoryRationale || "Analyzed repository structure and dependencies.";

  const primaryLang =
    evidenceSummary?.languages[0]?.language || overview.primaryLanguage || "Codebase";
  const langDot = LANG_DOT_COLORS[primaryLang] || "bg-indigo-500";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${meta.border} bg-gradient-to-br ${meta.gradient} p-6 sm:p-8 shadow-sm transition-all duration-300`}
    >
      {/* Background Decorative Mesh Pattern */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/5 dark:bg-indigo-400/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header: Category Signature & Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Signature Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${meta.badgeBg} ${meta.badgeText} shadow-2xs`}
            >
              <span>{meta.icon}</span>
              <span>{meta.title}</span>
            </span>

            {/* Confidence & Ecosystem tag */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 backdrop-blur-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  confidence === "high"
                    ? "bg-emerald-500"
                    : confidence === "medium"
                      ? "bg-blue-500"
                      : "bg-zinc-400"
                }`}
              />
              <span className="capitalize">{confidence} Confidence</span>
            </span>
          </div>

          {/* Rationale pill */}
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-md truncate hidden md:inline-block">
            {rationale}
          </span>
        </div>

        {/* Central Purpose & Identity Statement */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-snug">
            {brief.purpose}
          </h1>

          {/* Audience & Supporting Guidance */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {brief.intendedAudience && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Target Audience:
                </span>
                <span>{brief.intendedAudience}</span>
              </div>
            )}

            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>

            <span className="text-zinc-500 dark:text-zinc-400 italic">{meta.description}</span>
          </div>
        </div>

        {/* Ecosystem & Detected Stack Strip */}
        <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
            Detected Stack:
          </span>

          {/* Primary Language */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${langDot}`} />
            <span>{primaryLang}</span>
          </span>

          {/* Frameworks */}
          {frameworks.map((fw) => (
            <span
              key={fw}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60"
            >
              <span>{fw}</span>
            </span>
          ))}

          {/* Tools / Ecosystem */}
          {tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80"
            >
              <span>{tool}</span>
            </span>
          ))}
        </div>

        {/* Project-Specific Structural Facts (3-4 High-Signal Cards) */}
        {structuralFacts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {structuralFacts.map((fact, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs backdrop-blur-xs flex flex-col justify-between"
              >
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                  {fact.label}
                </span>
                <div className="mt-1">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                    {fact.value}
                  </span>
                  {fact.detail && (
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                      {fact.detail}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Route into Capabilities */}
        {onExploreCapabilities && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onExploreCapabilities}
              className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <span>Explore {brief.capabilities.length} Core Capabilities</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              Select any building block below to trace code architecture
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
