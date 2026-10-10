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
  Other: {
    bg: "bg-zinc-300/10",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-300",
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
    badge: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    accent: "from-emerald-500/10 to-teal-500/5",
  },
  "backend-system": {
    label: "Backend Service & API",
    icon: "⚡",
    badge: "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    accent: "from-blue-500/10 to-indigo-500/5",
  },
  "cli-tool": {
    label: "Command-Line Tool (CLI)",
    icon: "💻",
    badge: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    accent: "from-amber-500/10 to-orange-500/5",
  },
  "library-framework": {
    label: "Software Library & SDK",
    icon: "📦",
    badge: "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    accent: "from-purple-500/10 to-pink-500/5",
  },
  "data-ml": {
    label: "Data & ML Pipeline",
    icon: "🧠",
    badge: "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    accent: "from-rose-500/10 to-orange-500/5",
  },
  universal: {
    label: "Modular Codebase",
    icon: "🧩",
    badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700",
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
  const [activeTab, setActiveTab] = useState<"dependencies" | "entrypoints" | "structure" | "facts">(
    "dependencies"
  );
  const [depSearch, setDepSearch] = useState("");

  const languages = evidenceSummary?.languages || [];
  const fileCategories = overview.fileCategories || evidenceSummary?.fileCategories || [];
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
        {/* Top Header: Title, Ecosystem, Project Type Signature & Key Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Signature Badge */}
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
                  <span className="capitalize">{overview.categoryConfidence} Confidence</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
                Technical Overview &amp; Repository Intelligence
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Deterministic metrics, language and composition breakdown, declared ecosystems, and
              structural indicators grounded in commit{" "}
              <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">
                {commitSha.substring(0, 7)}
              </span>
              .
            </p>
          </div>

          {/* Quick Metrics Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-center min-w-[90px]">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Total Files
              </span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {overview.totalFiles}
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
                Runtime Deps
              </span>
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                {prodDeps.length}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-center min-w-[90px]">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Dev / Build
              </span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 block">
                {devDeps.length}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Charts Row: Language Distribution & Repository Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Language Distribution */}
          <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Language Distribution</span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Proportion across {overview.totalFiles} analyzed files (file-count based)
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700">
                {languages.length} detected
              </span>
            </div>

            {/* Multi-colored Bar */}
            {languages.length > 0 ? (
              <>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-200/80 dark:bg-zinc-700 shadow-inner">
                  {languages.map((l) => {
                    const pal = LANGUAGE_PALETTE[l.language] || LANGUAGE_PALETTE.Other;
                    return (
                      <div
                        key={l.language}
                        style={{ width: `${Math.max(l.percentage, 2)}%` }}
                        className={`${pal?.bar || "bg-indigo-500"} transition-all`}
                        title={`${l.language}: ${l.percentage}% (${l.fileCount} files)`}
                      />
                    );
                  })}
                </div>

                {/* Legend with file counts & percentages */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs">
                  {languages.map((l) => {
                    const pal = LANGUAGE_PALETTE[l.language] || LANGUAGE_PALETTE.Other;
                    return (
                      <div key={l.language} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${pal?.dot || "bg-indigo-500"}`} />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {l.language}
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">
                          {l.percentage}% ({l.fileCount}f)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-400 italic">No language files identified.</p>
            )}
          </div>

          {/* Chart 2: Repository File Composition Breakdown */}
          <div className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Repository Composition</span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Source code vs test suites vs documentation vs configuration
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700">
                100% categorized
              </span>
            </div>

            {/* Segmented Composition Bar */}
            {fileCategories.length > 0 ? (
              <>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-200/80 dark:bg-zinc-700 shadow-inner">
                  {fileCategories.map((c) => {
                    const barColor =
                      c.category === "source"
                        ? "bg-indigo-500"
                        : c.category === "tests"
                          ? "bg-emerald-500"
                          : c.category === "documentation"
                            ? "bg-purple-500"
                            : "bg-amber-400";
                    return (
                      <div
                        key={c.category}
                        style={{ width: `${Math.max(c.percentage, 2)}%` }}
                        className={`${barColor} transition-all`}
                        title={`${c.label}: ${c.percentage}% (${c.count} files)`}
                      />
                    );
                  })}
                </div>

                {/* Composition Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs">
                  {fileCategories.map((c) => {
                    const dotColor =
                      c.category === "source"
                        ? "bg-indigo-500"
                        : c.category === "tests"
                          ? "bg-emerald-500"
                          : c.category === "documentation"
                            ? "bg-purple-500"
                            : "bg-amber-400";
                    return (
                      <div key={c.category} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {c.label}
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">
                          {c.percentage}% ({c.count}f)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-400 italic">No composition metrics available.</p>
            )}
          </div>
        </div>

        {/* Detected Tech Stack & Build Tooling Strip */}
        <div className="p-4 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-600 dark:text-zinc-300 mr-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Detected Stack &amp; Toolchain:</span>
          </span>

          {/* Primary Language */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-bold shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                (LANGUAGE_PALETTE[overview.primaryLanguage] || LANGUAGE_PALETTE.Other)?.dot || "bg-indigo-500"
              }`}
            />
            <span>{overview.primaryLanguage}</span>
          </span>

          {/* Frameworks */}
          {frameworks.map((fw) => (
            <span
              key={fw}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold shadow-2xs"
            >
              <span>{fw}</span>
            </span>
          ))}

          {/* Tools & Runtimes */}
          {tools.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 font-medium"
            >
              <span>{t}</span>
            </span>
          ))}
        </div>

        {/* Interactive Exploration Dashboard Tabs */}
        <div className="space-y-4 pt-1">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("dependencies")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "dependencies"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>Declared Dependencies</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] font-mono">
                {prodDeps.length + devDeps.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("entrypoints")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "entrypoints"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>Entrypoints &amp; Scripts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] font-mono">
                {overview.entryPoints.length + overview.scripts.length}
              </span>
            </button>

            {treeSummary.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("structure")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "structure"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>Directory &amp; Module Topology</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] font-mono">
                  {treeSummary.length}
                </span>
              </button>
            )}

            {structuralFacts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("facts")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "facts"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>Distinctive Structural Facts</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] font-mono">
                  {structuralFacts.length}
                </span>
              </button>
            )}
          </div>

          {/* Tab 1: Declared Dependencies with Production vs Dev separation & search */}
          {activeTab === "dependencies" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Separating declared runtime/production dependencies from development and testing packages.
                </p>

                {/* Filter Search */}
                <input
                  type="text"
                  placeholder="Filter packages..."
                  value={depSearch}
                  onChange={(e) => setDepSearch(e.target.value)}
                  className="px-3 py-1 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Runtime Production Dependencies */}
                <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Production Runtime Dependencies</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {filteredProdDeps.length} {filteredProdDeps.length === 1 ? "package" : "packages"}
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
                      {depSearch ? "No matching production dependencies." : "No production dependencies declared."}
                    </p>
                  )}
                </div>

                {/* Development & Build Dependencies */}
                <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                      <span>Development &amp; Build Dependencies</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {filteredDevDeps.length} {filteredDevDeps.length === 1 ? "package" : "packages"}
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
                      {depSearch ? "No matching development packages." : "No development dependencies declared."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Entrypoints & Build Scripts */}
          {activeTab === "entrypoints" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              {/* Application Entrypoints */}
              <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Application Entry Points</span>
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
                            className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span>Inspect Source</span>
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No conventional entrypoint detected in root.</p>
                )}
              </div>

              {/* Declared Scripts */}
              <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Build &amp; Execution Scripts</span>
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
                        className="font-mono text-xs px-2.5 py-1 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80"
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

          {/* Tab 3: Directory & Module Topology */}
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
                    <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Distinctive Structural Facts */}
          {activeTab === "facts" && structuralFacts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
              {structuralFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/90 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                    {fact.label}
                  </span>
                  <div className="mt-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                      {fact.value}
                    </span>
                    {fact.detail && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-1">
                        {fact.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
