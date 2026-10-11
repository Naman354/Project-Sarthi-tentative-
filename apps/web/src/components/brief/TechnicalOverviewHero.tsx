"use client";

import React, { useState, useMemo } from "react";
import type { TechnicalOverview, EvidenceSummary, ProjectCategory } from "../../types/brief";

interface TechnicalOverviewHeroProps {
  overview: TechnicalOverview;
  evidenceSummary?: EvidenceSummary;
  repoOwner: string;
  repoName: string;
  commitSha: string;
}

const LANGUAGE_PALETTE: Record<string, { bg: string; text: string; dot: string; bar: string }> = {
  TypeScript: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
  },
  JavaScript: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
  Python: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  Rust: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
  },
  Go: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
    bar: "bg-cyan-500",
  },
  Java: {
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
  Ruby: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
  },
  C: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-500",
    bar: "bg-zinc-500",
  },
  "C++": {
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-600",
    bar: "bg-indigo-600",
  },
  "C#": {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-600",
    bar: "bg-purple-600",
  },
  PHP: {
    bg: "bg-indigo-400/10",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
  },
  Swift: {
    bg: "bg-orange-600/10",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-600",
    bar: "bg-orange-600",
  },
  Kotlin: {
    bg: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-600",
    bar: "bg-violet-600",
  },
  Shell: {
    bg: "bg-emerald-600/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-600",
    bar: "bg-emerald-600",
  },
  HTML: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-400",
    bar: "bg-orange-400",
  },
  CSS: {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    bar: "bg-purple-500",
  },
  Markdown: {
    bg: "bg-zinc-400/10",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
    bar: "bg-zinc-400",
  },
  JSON: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  YAML: {
    bg: "bg-teal-500/10",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
    bar: "bg-teal-500",
  },
  TOML: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  SQL: {
    bg: "bg-blue-600/10",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-600",
    bar: "bg-blue-600",
  },
  Vue: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  Svelte: {
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
  },
  Astro: {
    bg: "bg-purple-600/10",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-600",
    bar: "bg-purple-600",
  },
  Dart: {
    bg: "bg-cyan-600/10",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-600",
    bar: "bg-cyan-600",
  },
  Lua: {
    bg: "bg-blue-400/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
  },
  R: {
    bg: "bg-sky-600/10",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-600",
    bar: "bg-sky-600",
  },
  Zig: {
    bg: "bg-amber-600/10",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-600",
    bar: "bg-amber-600",
  },
  GraphQL: {
    bg: "bg-pink-500/10",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
    bar: "bg-pink-500",
  },
  Protobuf: {
    bg: "bg-teal-600/10",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-600",
    bar: "bg-teal-600",
  },
  XML: {
    bg: "bg-amber-700/10",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-700",
    bar: "bg-amber-700",
  },
  Docker: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  Makefile: {
    bg: "bg-zinc-600/10",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-600",
    bar: "bg-zinc-600",
  },
  Config: {
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
    bar: "bg-slate-500",
  },
  Other: {
    bg: "bg-zinc-400/10",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
    bar: "bg-zinc-400",
  },
};

const CATEGORY_STYLES: Record<
  ProjectCategory,
  { label: string; icon: string; badge: string; accent: string }
> = {
  "web-application": {
    label: "Web Application",
    icon: "🌐",
    badge:
      "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    accent: "from-emerald-500/10 to-teal-500/5",
  },
  "backend-system": {
    label: "Backend Service & API",
    icon: "⚡",
    badge:
      "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    accent: "from-blue-500/10 to-indigo-500/5",
  },
  "cli-tool": {
    label: "Command-Line Tool",
    icon: "💻",
    badge:
      "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    accent: "from-amber-500/10 to-orange-500/5",
  },
  "library-framework": {
    label: "Software Library & SDK",
    icon: "📦",
    badge:
      "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    accent: "from-purple-500/10 to-pink-500/5",
  },
  "data-ml": {
    label: "Data & ML Pipeline",
    icon: "🧠",
    badge:
      "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    accent: "from-rose-500/10 to-orange-500/5",
  },
  universal: {
    label: "Modular Codebase",
    icon: "🧩",
    badge:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700",
    accent: "from-zinc-500/10 to-zinc-400/5",
  },
};

export default function TechnicalOverviewHero({
  overview,
  evidenceSummary,
  repoOwner,
  repoName,
  commitSha,
}: TechnicalOverviewHeroProps) {
  // "facts" is the default — leftmost, selected by default
  const [activeTab, setActiveTab] = useState<"facts" | "dependencies" | "entrypoints" | "structure">("facts");
  const [depSearch, setDepSearch] = useState("");

  const { displayLanguages, totalAnalyzedFiles } = useMemo(() => {
    let rawList: Array<{ language: string; fileCount: number; percentage: number }> = [];

    if (evidenceSummary?.languages && evidenceSummary.languages.length > 0) {
      rawList = evidenceSummary.languages.map((l) => ({ ...l }));
    } else if (
      overview.primaryLanguage &&
      overview.primaryLanguage !== "Unknown" &&
      overview.primaryLanguage !== "None"
    ) {
      rawList = [
        {
          language: overview.primaryLanguage,
          fileCount: overview.totalFiles || 1,
          percentage: 100,
        },
      ];
    }

    // Ensure the primary language mentioned in the card is represented
    if (
      overview.primaryLanguage &&
      overview.primaryLanguage !== "Unknown" &&
      overview.primaryLanguage !== "None" &&
      !rawList.some((l) => l.language.toLowerCase() === overview.primaryLanguage.toLowerCase())
    ) {
      rawList.unshift({
        language: overview.primaryLanguage,
        fileCount: 1,
        percentage: 0,
      });
    }

    // Determine total files baseline
    const totalFiles = Math.max(
      overview.totalFiles || 0,
      rawList.reduce((sum, l) => sum + l.fileCount, 0)
    );

    const accountedFiles = rawList.reduce((sum, l) => sum + l.fileCount, 0);
    const unrepresentedFiles = Math.max(0, totalFiles - accountedFiles);

    const list = [...rawList];
    if (unrepresentedFiles > 0) {
      const existingOtherIndex = list.findIndex(
        (l) => l.language === "Other" || l.language.toLowerCase().startsWith("other")
      );
      if (existingOtherIndex >= 0) {
        list[existingOtherIndex] = {
          ...list[existingOtherIndex],
          fileCount: list[existingOtherIndex].fileCount + unrepresentedFiles,
        };
      } else {
        list.push({
          language: "Other",
          fileCount: unrepresentedFiles,
          percentage: 0,
        });
      }
    }

    // Recalculate percentages so they strictly sum to 100% and exact percentages cover 100.0%
    const totalRepresented = list.reduce((sum, l) => sum + l.fileCount, 0);
    let finalItems: Array<{
      language: string;
      fileCount: number;
      percentage: number;
      exactPercentage: number;
    }> = [];

    if (totalRepresented > 0) {
      let accumulated = 0;
      finalItems = list.map((l, idx) => {
        const exact = (l.fileCount / totalRepresented) * 100;
        if (idx === list.length - 1) {
          const finalPct = Math.max(0, 100 - accumulated);
          return {
            language: l.language,
            fileCount: l.fileCount,
            percentage: finalPct,
            exactPercentage: exact,
          };
        }
        const pct = Math.round(exact);
        accumulated += pct;
        return {
          language: l.language,
          fileCount: l.fileCount,
          percentage: pct,
          exactPercentage: exact,
        };
      });
    }

    return { displayLanguages: finalItems, totalAnalyzedFiles: totalFiles };
  }, [evidenceSummary, overview.primaryLanguage, overview.totalFiles]);
  const frameworks = overview.detectedFrameworks || [];
  const tools = overview.detectedTools || [];
  const structuralFacts = overview.structuralFacts || [];
  const categoryKey: ProjectCategory = overview.projectCategory || "universal";
  const categoryMeta = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.universal;
  const treeSummary = overview.treeSummary || [];

  const prodDeps = overview.dependencies || [];
  const devDeps = overview.devDependencies || [];

  const filteredProdDeps = useMemo(() => {
    const list = overview.dependencies || [];
    if (!depSearch.trim()) return list;
    return list.filter((d) => d.toLowerCase().includes(depSearch.toLowerCase()));
  }, [overview.dependencies, depSearch]);

  const filteredDevDeps = useMemo(() => {
    const list = overview.devDependencies || [];
    if (!depSearch.trim()) return list;
    return list.filter((d) => d.toLowerCase().includes(depSearch.toLowerCase()));
  }, [overview.devDependencies, depSearch]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-md">
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl ${categoryMeta.accent} blur-3xl pointer-events-none`}
      />

      {/* Main Content Area */}
      <div className="relative z-10 p-6 sm:p-8 space-y-7">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${categoryMeta.badge} shadow-2xs`}
              >
                <span>{categoryMeta.icon}</span>
                <span>{categoryMeta.label}</span>
              </span>

              {/* Ecosystem Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                <span className="font-mono">{overview.ecosystem.toUpperCase()}</span>
                <span>Ecosystem</span>
              </span>

              {/* Confidence Badge */}
              {overview.categoryConfidence && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/60">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      overview.categoryConfidence === "high"
                        ? "bg-emerald-500"
                        : overview.categoryConfidence === "medium"
                          ? "bg-blue-500"
                          : "bg-zinc-400"
                    }`}
                  />
                  <span className="capitalize">{overview.categoryConfidence} confidence</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                Technical Overview
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Ecosystem facts, structure, and key characteristics grounded in commit{" "}
              <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                {commitSha.substring(0, 7)}
              </span>
              .
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-center min-w-[90px]">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Files
              </span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {totalAnalyzedFiles}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-center min-w-[90px]">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Directories
              </span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {overview.totalDirectories}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-center min-w-[90px]">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Dependencies
              </span>
              <span className="text-xl font-extrabold text-violet-600 dark:text-violet-400 font-mono mt-0.5 block">
                {prodDeps.length + devDeps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Language Distribution Chart — 100% Accounted */}
        {displayLanguages.length > 0 && (
          <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  <span>Language Distribution</span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Share of {totalAnalyzedFiles} analyzed files by language (100% accounted for, file-count based)
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700">
                {displayLanguages.length} detected
              </span>
            </div>

            {/* Multi-colored Bar — spans 100% width */}
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-zinc-200/80 dark:bg-zinc-700 shadow-inner">
              {displayLanguages.map((l) => {
                const pal = LANGUAGE_PALETTE[l.language] || LANGUAGE_PALETTE.Other;
                return (
                  <div
                    key={l.language}
                    style={{ width: `${l.exactPercentage}%` }}
                    className={`${pal?.bar || "bg-violet-500"} transition-all shrink-0`}
                    title={`${l.language}: ${l.percentage}% (${l.fileCount} ${l.fileCount === 1 ? "file" : "files"})`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs">
              {displayLanguages.map((l) => {
                const pal = LANGUAGE_PALETTE[l.language] || LANGUAGE_PALETTE.Other;
                return (
                  <div key={l.language} className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${pal?.dot || "bg-violet-500"}`}
                    />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {l.language}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {l.percentage}% · {l.fileCount} {l.fileCount === 1 ? "file" : "files"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detected Stack Strip */}
        {(frameworks.length > 0 || tools.length > 0) && (
          <div className="p-4 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-600 dark:text-zinc-300 mr-1 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Stack &amp; Toolchain:</span>
            </span>

            {/* Primary Language */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-bold shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  (LANGUAGE_PALETTE[overview.primaryLanguage] || LANGUAGE_PALETTE.Other)?.dot ||
                  "bg-violet-500"
                }`}
              />
              <span>{overview.primaryLanguage}</span>
            </span>

            {/* Frameworks */}
            {frameworks.map((fw) => (
              <span
                key={fw}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-semibold shadow-2xs"
              >
                <span>{fw}</span>
              </span>
            ))}

            {/* Tools */}
            {tools.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 font-medium"
              >
                <span>{t}</span>
              </span>
            ))}
          </div>
        )}

        {/* Tab Navigation — Facts first, default */}
        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {/* Tab 1: Distinctive Structural Facts — leftmost, default */}
            {structuralFacts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("facts")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "facts"
                    ? "bg-violet-600 text-white shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>What Makes It Distinctive</span>
                <span className="px-1.5 py-0.5 rounded-full bg-violet-500/30 text-[10px] font-mono">
                  {structuralFacts.length}
                </span>
              </button>
            )}

            {/* Tab 2: Dependencies */}
            <button
              type="button"
              onClick={() => setActiveTab("dependencies")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "dependencies"
                  ? "bg-violet-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>Dependencies</span>
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500/30 text-[10px] font-mono">
                {prodDeps.length + devDeps.length}
              </span>
            </button>

            {/* Tab 3: Entrypoints & Scripts */}
            <button
              type="button"
              onClick={() => setActiveTab("entrypoints")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "entrypoints"
                  ? "bg-violet-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>Entrypoints &amp; Scripts</span>
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500/30 text-[10px] font-mono">
                {overview.entryPoints.length + overview.scripts.length}
              </span>
            </button>

            {/* Tab 4: Directory Structure */}
            {treeSummary.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("structure")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "structure"
                    ? "bg-violet-600 text-white shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>Directory Structure</span>
                <span className="px-1.5 py-0.5 rounded-full bg-violet-500/30 text-[10px] font-mono">
                  {treeSummary.length}
                </span>
              </button>
            )}
          </div>

          {/* Tab: Distinctive Structural Facts (default) */}
          {activeTab === "facts" && (
            <div className="animate-fade-in">
              {structuralFacts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {structuralFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs flex flex-col gap-1"
                    >
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                        {fact.label}
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                        {fact.value}
                      </span>
                      {fact.detail && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-relaxed">
                          {fact.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-zinc-400">
                  <p>No distinctive structural facts detected for this repository.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Dependencies */}
          {activeTab === "dependencies" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Declared runtime packages separated from development and build tooling.
                </p>

                <input
                  type="text"
                  placeholder="Filter packages..."
                  value={depSearch}
                  onChange={(e) => setDepSearch(e.target.value)}
                  className="px-3 py-1 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500 max-w-xs"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Runtime Dependencies */}
                <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-500" />
                      <span>Runtime Dependencies</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {filteredProdDeps.length}{" "}
                      {filteredProdDeps.length === 1 ? "package" : "packages"}
                    </span>
                  </div>

                  {filteredProdDeps.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {filteredProdDeps.map((dep) => (
                        <span
                          key={dep}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-2xs font-medium"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      {depSearch
                        ? "No matching runtime dependencies."
                        : "No runtime dependencies declared."}
                    </p>
                  )}
                </div>

                {/* Dev Dependencies */}
                <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                      <span>Development &amp; Build Tooling</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {filteredDevDeps.length}{" "}
                      {filteredDevDeps.length === 1 ? "package" : "packages"}
                    </span>
                  </div>

                  {filteredDevDeps.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {filteredDevDeps.map((dep) => (
                        <span
                          key={dep}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-zinc-700/60"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      {depSearch
                        ? "No matching development packages."
                        : "No development dependencies declared."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Entrypoints & Scripts */}
          {activeTab === "entrypoints" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              {/* Entrypoints */}
              <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-violet-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    <span>Application Entrypoints</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {overview.entryPoints.length} found
                  </span>
                </div>

                {overview.entryPoints.length > 0 ? (
                  <div className="space-y-2">
                    {overview.entryPoints.map((ep) => {
                      const fileUrl = `https://github.com/${repoOwner}/${repoName}/blob/${commitSha}/${ep.replace(/^\/+/, "")}`;
                      return (
                        <div
                          key={ep}
                          className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
                        >
                          <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {ep}
                          </span>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                          >
                            <span>View on GitHub</span>
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    No conventional entrypoints detected in root.
                  </p>
                )}
              </div>

              {/* Scripts */}
              <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-violet-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Available Scripts</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {overview.scripts.length} defined
                  </span>
                </div>

                {overview.scripts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {overview.scripts.map((script) => (
                      <span
                        key={script}
                        className="font-mono text-xs px-2.5 py-1 rounded-xl bg-violet-50/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/80"
                      >
                        {script}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No manifest scripts declared.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Directory Structure */}
          {activeTab === "structure" && treeSummary.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Top-Level Module Layout
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {treeSummary.length} root modules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {treeSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-zinc-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
