"use client";

import React, { useState, useMemo } from "react";
import type { TechnicalOverview, EvidenceSummary, ProjectCategory } from "../../types/brief";
import LanguageDonutChart from "./LanguageDonutChart";
import { TechLogo } from "../TechIcons";

interface TechnicalOverviewHeroProps {
  overview: TechnicalOverview;
  evidenceSummary?: EvidenceSummary;
  repoOwner: string;
  repoName: string;
  commitSha: string;
  showHeader?: boolean;
  defaultTab?: "facts" | "dependencies" | "entrypoints" | "structure";
  onNavigateDestination?: (dest: string) => void;
}

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
  showHeader = true,
  defaultTab = "facts",
  onNavigateDestination,
}: TechnicalOverviewHeroProps) {
  // "facts" is the default — leftmost, selected by default
  const [activeTab, setActiveTab] = useState<
    "facts" | "dependencies" | "entrypoints" | "structure"
  >(defaultTab);
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

  const innerContent = (
    <div className={`space-y-6 ${showHeader ? "relative z-10 p-6 sm:p-8" : "p-2 sm:p-4"}`}>
      {/* Top Header — Only displayed when showHeader is true */}
      {showHeader && (
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
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
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <span className="font-mono">{overview.ecosystem.toUpperCase()}</span>
                <span>Ecosystem</span>
              </span>

              {/* Confidence Badge */}
              {overview.categoryConfidence && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
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
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Technical Overview
              </h2>
            </div>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              Ecosystem facts, structure, and key characteristics grounded in commit{" "}
              <span className="font-mono font-semibold" style={{ color: "var(--teal-bright)" }}>
                {commitSha.substring(0, 7)}
              </span>
              .
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div
              className="p-3.5 rounded-2xl text-center min-w-[100px]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wider block"
                style={{ color: "var(--text-muted)" }}
              >
                Files
              </span>
              <span
                className="text-2xl font-black font-mono mt-1 block"
                style={{ color: "var(--text-primary)" }}
              >
                {totalAnalyzedFiles}
              </span>
            </div>

            <div
              className="p-3.5 rounded-2xl text-center min-w-[100px]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wider block"
                style={{ color: "var(--text-muted)" }}
              >
                Directories
              </span>
              <span
                className="text-2xl font-black font-mono mt-1 block"
                style={{ color: "var(--text-primary)" }}
              >
                {overview.totalDirectories}
              </span>
            </div>

            <div
              className="p-3.5 rounded-2xl text-center min-w-[100px]"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <span
                className="text-xs font-bold uppercase tracking-wider block"
                style={{ color: "var(--text-muted)" }}
              >
                Dependencies
              </span>
              <span
                className="text-2xl font-black font-mono mt-1 block"
                style={{ color: "var(--teal-bright)" }}
              >
                {prodDeps.length + devDeps.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Language Distribution Donut Chart — 100% Accounted */}
      {displayLanguages.length > 0 && (
        <LanguageDonutChart languages={displayLanguages} totalFiles={totalAnalyzedFiles} />
      )}

      {/* Detected Stack & Toolchain */}
      {(frameworks.length > 0 || tools.length > 0 || overview.primaryLanguage) && (
        <div
          className="p-4 rounded-2xl flex flex-wrap items-center gap-2 text-xs"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span
            className="font-bold mr-1 flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "var(--teal-bright)" }}
            />
            <span>Stack &amp; Toolchain:</span>
          </span>

          {/* Primary Language */}
          {overview.primaryLanguage && overview.primaryLanguage !== "Unknown" && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <TechLogo name={overview.primaryLanguage} className="w-3.5 h-3.5" />
              <span>{overview.primaryLanguage}</span>
            </span>
          )}

          {/* Frameworks */}
          {frameworks.map((fw) => (
            <span
              key={fw}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-semibold"
              style={{
                backgroundColor: "rgba(15,138,131,0.12)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              <TechLogo name={fw} className="w-3.5 h-3.5" />
              <span>{fw}</span>
            </span>
          ))}

          {/* Tools */}
          {tools.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-medium"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <TechLogo name={t} className="w-3.5 h-3.5" />
              <span>{t}</span>
            </span>
          ))}
        </div>
      )}

      {/* Tab Navigation — Facts first, default */}
      <div className="space-y-4 pt-1">
        <div
          className="flex flex-wrap items-center gap-2 pb-2"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          {/* Tab 1: Distinctive Structural Facts — leftmost, default */}
          {structuralFacts.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("facts")}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor:
                  activeTab === "facts" ? "var(--teal-primary)" : "var(--bg-workspace)",
                color: activeTab === "facts" ? "var(--text-primary)" : "var(--text-secondary)",
                border:
                  activeTab === "facts"
                    ? "1px solid var(--teal-bright)"
                    : "1px solid var(--border-subtle)",
              }}
            >
              <span>What Makes It Distinctive</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor:
                    activeTab === "facts" ? "rgba(255,255,255,0.2)" : "rgba(15,138,131,0.15)",
                  color: activeTab === "facts" ? "#fff" : "var(--teal-bright)",
                }}
              >
                {structuralFacts.length}
              </span>
            </button>
          )}

          {/* Tab 2: Dependencies */}
          <button
            type="button"
            onClick={() => setActiveTab("dependencies")}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
            style={{
              backgroundColor:
                activeTab === "dependencies" ? "var(--teal-primary)" : "var(--bg-workspace)",
              color: activeTab === "dependencies" ? "var(--text-primary)" : "var(--text-secondary)",
              border:
                activeTab === "dependencies"
                  ? "1px solid var(--teal-bright)"
                  : "1px solid var(--border-subtle)",
            }}
          >
            <span>Dependencies</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor:
                  activeTab === "dependencies" ? "rgba(255,255,255,0.2)" : "rgba(15,138,131,0.15)",
                color: activeTab === "dependencies" ? "#fff" : "var(--teal-bright)",
              }}
            >
              {prodDeps.length + devDeps.length}
            </span>
          </button>

          {/* Tab 3: Entrypoints & Scripts */}
          <button
            type="button"
            onClick={() => setActiveTab("entrypoints")}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
            style={{
              backgroundColor:
                activeTab === "entrypoints" ? "var(--teal-primary)" : "var(--bg-workspace)",
              color: activeTab === "entrypoints" ? "var(--text-primary)" : "var(--text-secondary)",
              border:
                activeTab === "entrypoints"
                  ? "1px solid var(--teal-bright)"
                  : "1px solid var(--border-subtle)",
            }}
          >
            <span>Entrypoints &amp; Scripts</span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor:
                  activeTab === "entrypoints" ? "rgba(255,255,255,0.2)" : "rgba(15,138,131,0.15)",
                color: activeTab === "entrypoints" ? "#fff" : "var(--teal-bright)",
              }}
            >
              {overview.entryPoints.length + overview.scripts.length}
            </span>
          </button>

          {/* Tab 4: Directory Structure */}
          {treeSummary.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("structure")}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor:
                  activeTab === "structure" ? "var(--teal-primary)" : "var(--bg-workspace)",
                color: activeTab === "structure" ? "var(--text-primary)" : "var(--text-secondary)",
                border:
                  activeTab === "structure"
                    ? "1px solid var(--teal-bright)"
                    : "1px solid var(--border-subtle)",
              }}
            >
              <span>Directory Structure</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor:
                    activeTab === "structure" ? "rgba(255,255,255,0.2)" : "rgba(15,138,131,0.15)",
                  color: activeTab === "structure" ? "#fff" : "var(--teal-bright)",
                }}
              >
                {treeSummary.length}
              </span>
            </button>
          )}
        </div>

        {/* Tab: Distinctive Structural Facts (default) */}
        {activeTab === "facts" && (
          <div className="animate-fade-in">
            {structuralFacts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {structuralFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl flex flex-col gap-1.5 transition-all"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span
                      className="text-xs font-bold uppercase tracking-wider truncate"
                      style={{ color: "var(--teal-bright)" }}
                    >
                      {fact.label}
                    </span>
                    <span
                      className="text-base sm:text-lg font-extrabold block tracking-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {fact.value}
                    </span>
                    {fact.detail && (
                      <span
                        className="text-xs sm:text-sm block leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {fact.detail}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
                <p>No distinctive structural facts detected for this repository.</p>
              </div>
            )}

            {onNavigateDestination && (
              <div
                className="pt-4 flex items-center justify-between border-t mt-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Need package manifests, entrypoint details, or the directory hierarchy?
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateDestination("dependencies")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer hover:brightness-110"
                  style={{
                    backgroundColor: "rgba(15,138,131,0.15)",
                    color: "var(--teal-bright)",
                    border: "1px solid rgba(53,208,195,0.3)",
                  }}
                >
                  <span>Explore Dependencies &amp; Structure →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Dependencies */}
        {activeTab === "dependencies" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Declared runtime packages separated from development and build tooling.
              </p>

              <input
                type="text"
                placeholder="Filter packages..."
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono focus:outline-none max-w-xs transition-all"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Runtime Dependencies */}
              <div
                className="p-4 rounded-2xl space-y-2.5"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--teal-bright)" }}
                    />
                    <span>Runtime Dependencies</span>
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {filteredProdDeps.length}{" "}
                    {filteredProdDeps.length === 1 ? "package" : "packages"}
                  </span>
                </div>

                {filteredProdDeps.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredProdDeps.map((dep) => (
                      <span
                        key={dep}
                        className="font-mono text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          backgroundColor: "var(--bg-workspace)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                    {depSearch
                      ? "No matching runtime dependencies."
                      : "No runtime dependencies declared."}
                  </p>
                )}
              </div>

              {/* Dev Dependencies */}
              <div
                className="p-4 rounded-2xl space-y-2.5"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold flex items-center gap-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--accent-slate)" }}
                    />
                    <span>Development &amp; Build Tooling</span>
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {filteredDevDeps.length} {filteredDevDeps.length === 1 ? "package" : "packages"}
                  </span>
                </div>

                {filteredDevDeps.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredDevDeps.map((dep) => (
                      <span
                        key={dep}
                        className="font-mono text-xs px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: "var(--bg-workspace)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
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
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold flex items-center gap-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--teal-bright)" }}
                  />
                  <span>Application Entrypoints</span>
                </span>
                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
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
                        className="p-2.5 rounded-xl flex items-center justify-between"
                        style={{
                          backgroundColor: "var(--bg-workspace)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {ep}
                        </span>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold hover:underline flex items-center gap-1 transition-colors"
                          style={{ color: "var(--teal-bright)" }}
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
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                  No conventional entrypoints detected in root.
                </p>
              )}
            </div>

            {/* Scripts */}
            <div
              className="p-4 rounded-2xl space-y-3"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold flex items-center gap-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--accent-orange)" }}
                  />
                  <span>Available Scripts</span>
                </span>
                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {overview.scripts.length} defined
                </span>
              </div>

              {overview.scripts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {overview.scripts.map((script) => (
                    <span
                      key={script}
                      className="font-mono text-xs px-2.5 py-1 rounded-xl"
                      style={{
                        backgroundColor: "rgba(15,138,131,0.12)",
                        color: "var(--teal-bright)",
                        border: "1px solid rgba(15,138,131,0.25)",
                      }}
                    >
                      {script}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                  No manifest scripts declared.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Directory Structure */}
        {activeTab === "structure" && treeSummary.length > 0 && (
          <div
            className="p-4 rounded-2xl space-y-3 animate-fade-in"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                Top-Level Module Layout
              </span>
              <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                {treeSummary.length} root modules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {treeSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl font-mono text-xs flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: "var(--teal-bright)" }}
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
  );

  if (!showHeader) {
    return <div className="w-full">{innerContent}</div>;
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl border shadow-md"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl ${categoryMeta.accent} blur-3xl pointer-events-none`}
      />
      {innerContent}
    </div>
  );
}
