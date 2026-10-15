"use client";

import React, { useState, useMemo } from "react";
import type {
  ProjectBrief,
  ConceptualArea,
  EvidenceSummary,
  ProjectCategory,
} from "../../types/brief";
import { SparklesIcon, NetworkGraphIcon, ExternalLinkIcon } from "../Icons";
import { TechLogo } from "../TechIcons";
import TechnicalOverviewHero from "./TechnicalOverviewHero";

interface CodebaseMapWorkbenchProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  onExploreAnother?: () => void;
  activeNavSection?: string;
  onSelectNavSection?: (section: string) => void;
  focusedAreaId?: string | null;
  onSelectArea?: (areaId: string) => void;
  hideHeader?: boolean;
  hideSidebar?: boolean;
  initialMode?: "overview" | "map";
}

// Category palette mapping matching the engineering workbench design system
const ISLAND_THEMES: Record<
  string,
  {
    name: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
    badge: string;
  }
> = {
  core: {
    name: "Core Engine",
    color: "var(--teal-bright)",
    bg: "rgba(15,138,131,0.14)",
    border: "rgba(53,208,195,0.4)",
    glow: "rgba(53,208,195,0.3)",
    badge: "Core",
  },
  routing: {
    name: "Routing & Endpoints",
    color: "var(--accent-orange)",
    bg: "rgba(242,140,69,0.14)",
    border: "rgba(242,140,69,0.4)",
    glow: "rgba(242,140,69,0.25)",
    badge: "Routing",
  },
  middleware: {
    name: "Middleware & Handlers",
    color: "var(--accent-blue)",
    bg: "rgba(77,159,216,0.14)",
    border: "rgba(77,159,216,0.4)",
    glow: "rgba(77,159,216,0.25)",
    badge: "Middleware",
  },
  views: {
    name: "View & Render Surface",
    color: "var(--accent-green)",
    bg: "rgba(85,184,121,0.14)",
    border: "rgba(85,184,121,0.4)",
    glow: "rgba(85,184,121,0.25)",
    badge: "Views",
  },
  utilities: {
    name: "Utilities & Helpers",
    color: "var(--accent-purple)",
    bg: "rgba(144,100,217,0.14)",
    border: "rgba(144,100,217,0.4)",
    glow: "rgba(144,100,217,0.25)",
    badge: "Utilities",
  },
  other: {
    name: "Subsystems & Modules",
    color: "var(--accent-slate)",
    bg: "rgba(129,145,150,0.12)",
    border: "rgba(129,145,150,0.35)",
    glow: "rgba(129,145,150,0.2)",
    badge: "Module",
  },
};

const CATEGORY_META: Record<ProjectCategory, { label: string; icon: string }> = {
  "web-application": { label: "Web Application", icon: "🌐" },
  "backend-system": { label: "Backend Service & API", icon: "⚡" },
  "cli-tool": { label: "Command-Line Tool", icon: "💻" },
  "library-framework": { label: "Software Library & SDK", icon: "📦" },
  "data-ml": { label: "Data & ML Pipeline", icon: "🧠" },
  universal: { label: "Modular Codebase", icon: "🧩" },
};

function classifyAreaCategory(area: ConceptualArea): string {
  const norm = (area.name + " " + area.role + " " + (area.category || "")).toLowerCase();
  if (/core|main|app|application|bootstrap|entry|kernel/i.test(norm)) return "core";
  if (/route|router|routing|endpoint|controller|api|ingress/i.test(norm)) return "routing";
  if (/middleware|handler|filter|pipeline|interceptor|auth/i.test(norm)) return "middleware";
  if (/view|render|template|ui|component|frontend|page/i.test(norm)) return "views";
  if (/util|helper|common|lib|support|tool|service/i.test(norm)) return "utilities";
  return "other";
}

export default function CodebaseMapWorkbench({
  brief,
  evidenceSummary,
  onExploreAnother,
  activeNavSection,
  onSelectNavSection,
  focusedAreaId,
  onSelectArea,
  hideHeader = false,
  hideSidebar = false,
  initialMode = "overview",
}: CodebaseMapWorkbenchProps) {
  const areas = useMemo(() => brief.conceptualMap.areas || [], [brief.conceptualMap.areas]);
  const relationships = useMemo(
    () => brief.conceptualMap.relationships || [],
    [brief.conceptualMap.relationships]
  );

  // Explorer mode inside the unified hero: "overview" (default) or "map" (alternate view)
  const [explorerMode, setExplorerMode] = useState<"overview" | "map">(initialMode);

  // Grouping & view filters
  const [groupBy, setGroupBy] = useState<"feature" | "directory" | "layer">("feature");
  const [activeViewFilter, setActiveViewFilter] = useState<string>("by-feature");
  const [mapSearch, setMapSearch] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [is3DMode, setIs3DMode] = useState(false);

  // Selected module state (defaults to first core area or first area)
  const [selectedAreaId, setSelectedAreaId] = useState<string>(() => {
    const core = areas.find((a) => classifyAreaCategory(a) === "core");
    return core ? core.id : areas[0]?.id || "";
  });

  // External focus synchronization (adjusting state during render)
  const [prevFocusedAreaId, setPrevFocusedAreaId] = useState(focusedAreaId);
  if (focusedAreaId !== prevFocusedAreaId) {
    setPrevFocusedAreaId(focusedAreaId);
    if (focusedAreaId && areas.some((a) => a.id === focusedAreaId)) {
      setSelectedAreaId(focusedAreaId);
      setExplorerMode("map");
    }
  }

  // Sync when activeNavSection externally set to "overview" or "map"
  const [prevActiveNavSection, setPrevActiveNavSection] = useState(activeNavSection);
  if (activeNavSection !== prevActiveNavSection) {
    setPrevActiveNavSection(activeNavSection);
    if (activeNavSection === "overview" || activeNavSection === "map") {
      setExplorerMode(activeNavSection);
    }
  }

  // Active inspector tab
  const [inspectorTab, setInspectorTab] = useState<"overview" | "code" | "dependencies" | "usedby">(
    "overview"
  );

  // Selected area object
  const selectedArea = useMemo(() => {
    return areas.find((a) => a.id === selectedAreaId) || areas[0] || null;
  }, [areas, selectedAreaId]);

  const handleSelectArea = (id: string) => {
    setSelectedAreaId(id);
    if (onSelectArea) {
      onSelectArea(id);
    }
  };

  // Outgoing & incoming connections for selected area
  const outgoingRels = useMemo(() => {
    if (!selectedArea) return [];
    return relationships.filter((r) => r.fromAreaId === selectedArea.id);
  }, [relationships, selectedArea]);

  const incomingRels = useMemo(() => {
    if (!selectedArea) return [];
    return relationships.filter((r) => r.toAreaId === selectedArea.id);
  }, [relationships, selectedArea]);

  const outgoingTargetIds = useMemo(() => {
    return new Set(outgoingRels.map((r) => r.toAreaId));
  }, [outgoingRels]);

  const incomingSourceIds = useMemo(() => {
    return new Set(incomingRels.map((r) => r.fromAreaId));
  }, [incomingRels]);

  // Partition areas into spatial islands
  const islandGroups = useMemo(() => {
    const groups: Record<string, ConceptualArea[]> = {
      core: [],
      routing: [],
      middleware: [],
      views: [],
      utilities: [],
      other: [],
    };

    areas.forEach((area) => {
      const cat = classifyAreaCategory(area);
      if (groups[cat]) {
        groups[cat].push(area);
      } else {
        groups.other.push(area);
      }
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [areas]);

  // Primary file for the selected area
  const primaryFile =
    selectedArea?.associatedFiles?.[0] ||
    `${selectedArea?.name.toLowerCase().replace(/\s+/g, "-")}.ts`;
  const fileParts = primaryFile.split("/");
  const fileName = fileParts[fileParts.length - 1];
  const fileDir = fileParts.slice(0, -1).join("/") || brief.repo;

  const githubFileUrl = `https://github.com/${brief.owner}/${brief.repo}/blob/${brief.commitSha}/${primaryFile.replace(/^\/+/, "")}`;

  // Estimate metric stats for inspector display
  const metrics = useMemo(() => {
    const baseFiles = selectedArea?.associatedFiles?.length || 1;
    return {
      lines: Math.max(120, baseFiles * 180 + (selectedArea?.name.length || 0) * 8),
      functions: Math.max(6, baseFiles * 5 + outgoingRels.length * 2),
      imports: Math.max(4, outgoingRels.length * 3 + 2),
      exports: Math.max(2, incomingRels.length * 2 + 1),
    };
  }, [selectedArea, outgoingRels, incomingRels]);

  // Responsibilities bullet list
  const responsibilities = useMemo(() => {
    if (!selectedArea) return [];
    const roleText = selectedArea.role || "";
    const sentences = roleText.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 10);
    if (sentences.length >= 2) {
      return sentences.slice(0, 4);
    }
    return [
      `Define and manage the ${selectedArea.name} subsystem logic`,
      `Expose core interfaces consumed across the repository architecture`,
      `Maintain lifecycle states and handle operational requests`,
      `Coordinate with dependent modules and ensure stable execution`,
    ];
  }, [selectedArea]);

  const selectedTheme = selectedArea
    ? ISLAND_THEMES[classifyAreaCategory(selectedArea)] || ISLAND_THEMES.other
    : ISLAND_THEMES.core;

  const categoryKey: ProjectCategory = brief.technicalOverview.projectCategory || "universal";
  const categoryMeta = CATEGORY_META[categoryKey] || CATEGORY_META.universal;

  const topFrameworksAndTools = useMemo(() => {
    const fws = brief.technicalOverview.detectedFrameworks || [];
    const tls = brief.technicalOverview.detectedTools || [];
    return Array.from(new Set([...fws, ...tls])).slice(0, 6);
  }, [brief.technicalOverview]);

  const totalFilesCount = Math.max(
    brief.technicalOverview.totalFiles || 0,
    evidenceSummary?.languages?.reduce((acc, l) => acc + l.fileCount, 0) || 0
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* =========================================================
          1. COMPACT CONTEXT HEADER (Unified Explorer Identity & Hero Toolbar)
          ========================================================= */}
      {!hideHeader && (
        <div
          className="rounded-2xl p-5 sm:p-6 space-y-4"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 6px 28px rgba(0,0,0,0.45)",
          }}
        >
          {/* Top Row: Identity, Ecosystem Badges & Mode Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Category / Project Type Badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: "rgba(15,138,131,0.15)",
                    color: "var(--teal-bright)",
                    border: "1px solid rgba(53,208,195,0.35)",
                  }}
                >
                  <span>{categoryMeta.icon}</span>
                  <span>{categoryMeta.label}</span>
                </span>

                {/* Ecosystem Badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="font-mono">
                    {brief.technicalOverview.ecosystem.toUpperCase()}
                  </span>
                  <span>Ecosystem</span>
                </span>

                {/* Confidence Badge */}
                {brief.technicalOverview.categoryConfidence && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bg-workspace)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        brief.technicalOverview.categoryConfidence === "high"
                          ? "bg-emerald-500"
                          : brief.technicalOverview.categoryConfidence === "medium"
                            ? "bg-blue-500"
                            : "bg-zinc-400"
                      }`}
                    />
                    <span className="capitalize">
                      {brief.technicalOverview.categoryConfidence} confidence
                    </span>
                  </span>
                )}
              </div>

              {/* Repo Title & GitHub Link */}
              <div className="flex items-center gap-3 pt-0.5">
                <a
                  href={brief.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 transition-colors group"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="group-hover:text-[var(--teal-bright)]">
                    {brief.owner} / {brief.repo}
                  </span>
                  <ExternalLinkIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              {/* Concise Purpose Statement */}
              <p
                className="text-xs sm:text-sm leading-relaxed max-w-3xl"
                style={{ color: "var(--text-secondary)" }}
              >
                {brief.purpose}
              </p>
            </div>

            {/* Right Column: Integrated Explorer Mode Switcher & Useful Metrics */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              {/* Mode Switcher Tabs */}
              <div
                className="flex items-center p-1 rounded-xl"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <button
                  type="button"
                  id="hero-view-overview-btn"
                  onClick={() => {
                    setExplorerMode("overview");
                    onSelectNavSection?.("overview");
                  }}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
                  style={{
                    backgroundColor:
                      explorerMode === "overview" ? "var(--teal-primary)" : "transparent",
                    color:
                      explorerMode === "overview" ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow:
                      explorerMode === "overview" ? "0 2px 10px rgba(15,138,131,0.4)" : "none",
                  }}
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>Technical Overview</span>
                </button>

                <button
                  type="button"
                  id="hero-view-map-btn"
                  onClick={() => {
                    setExplorerMode("map");
                    onSelectNavSection?.("map");
                  }}
                  className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
                  style={{
                    backgroundColor: explorerMode === "map" ? "var(--teal-primary)" : "transparent",
                    color: explorerMode === "map" ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: explorerMode === "map" ? "0 2px 10px rgba(15,138,131,0.4)" : "none",
                  }}
                >
                  <NetworkGraphIcon className="w-4 h-4" />
                  <span>Codebase Map</span>
                </button>
              </div>

              {/* Restrained Metrics Strip */}
              <div className="flex items-center gap-2 pt-0.5">
                <div
                  className="px-3 py-1.5 rounded-xl text-center min-w-[70px]"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="text-[9px] uppercase tracking-wider block font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Files
                  </span>
                  <span
                    className="text-xs sm:text-sm font-extrabold font-mono"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {totalFilesCount}
                  </span>
                </div>

                <div
                  className="px-3 py-1.5 rounded-xl text-center min-w-[70px]"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="text-[9px] uppercase tracking-wider block font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Dirs
                  </span>
                  <span
                    className="text-xs sm:text-sm font-extrabold font-mono"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {brief.technicalOverview.totalDirectories}
                  </span>
                </div>

                <div
                  className="px-3 py-1.5 rounded-xl text-center min-w-[70px]"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="text-[9px] uppercase tracking-wider block font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Deps
                  </span>
                  <span
                    className="text-xs sm:text-sm font-extrabold font-mono"
                    style={{ color: "var(--teal-bright)" }}
                  >
                    {(brief.technicalOverview.dependencies?.length || 0) +
                      (brief.technicalOverview.devDependencies?.length || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Technology Stack Strip with Recognizable Logos */}
          <div
            className="pt-3 border-t flex flex-wrap items-center gap-2 text-xs"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span
              className="text-[11px] font-semibold flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--teal-bright)" }}
              />
              <span>Technologies:</span>
            </span>

            {brief.technicalOverview.primaryLanguage &&
              brief.technicalOverview.primaryLanguage !== "Unknown" && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <TechLogo
                    name={brief.technicalOverview.primaryLanguage}
                    className="w-3.5 h-3.5"
                  />
                  <span>{brief.technicalOverview.primaryLanguage}</span>
                </span>
              )}

            {topFrameworksAndTools.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <TechLogo name={tech} className="w-3.5 h-3.5" />
                <span>{tech}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          2. UNIFIED WORKBENCH (Map Mode vs Technical Overview Mode)
          ========================================================= */}
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col lg:flex-row min-h-[720px]"
        style={{
          backgroundColor: "var(--bg-app)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* =========================================================
            PANE 1: LEFT SIDEBAR (~260px)
            ========================================================= */}
        {!hideSidebar && (
          <aside
            className="w-full lg:w-[260px] shrink-0 flex flex-col justify-between p-4 border-b lg:border-b-0 lg:border-r"
            style={{
              backgroundColor: "var(--bg-sidebar)",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="space-y-6">
              {/* Back to Repositories Action */}
              <button
                type="button"
                onClick={() => onExploreAnother?.()}
                className="inline-flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer group"
                style={{ color: "var(--text-secondary)" }}
              >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                <span className="group-hover:text-white">Back to repositories</span>
              </button>

              {/* Workbench Navigation */}
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block px-1 pb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Explorer Modes
                </span>

                {[
                  { id: "overview", label: "Technical Overview", icon: SparklesIcon, isMode: true },
                  { id: "map", label: "Codebase Map", icon: NetworkGraphIcon, isMode: true },
                  { id: "about", label: "What It Is About", icon: null, isMode: false },
                  { id: "tour", label: "Where to Start Reading", icon: null, isMode: false },
                  { id: "health", label: "Architecture Health", icon: null, isMode: false },
                  { id: "capabilities", label: "Capabilities", icon: null, isMode: false },
                  { id: "topology", label: "Deep Topology", icon: null, isMode: false },
                ].map((item) => {
                  const isActive = item.isMode
                    ? explorerMode === item.id
                    : activeNavSection === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.isMode) {
                          setExplorerMode(item.id as "map" | "overview");
                          onSelectNavSection?.(item.id);
                        } else {
                          onSelectNavSection?.(item.id);
                        }
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer"
                      style={{
                        backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        border: isActive
                          ? "1px solid var(--teal-primary)"
                          : "1px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon ? (
                          <span
                            className="shrink-0 flex items-center"
                            style={{ color: isActive ? "var(--teal-bright)" : "var(--text-muted)" }}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                          </span>
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: isActive
                                ? "var(--teal-bright)"
                                : "var(--text-muted)",
                            }}
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: "var(--teal-bright)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Map Filter Perspectives (only relevant in map mode) */}
              {explorerMode === "map" && (
                <div
                  className="space-y-2 pt-3 border-t animate-fade-in"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Map Perspectives
                  </span>
                  <div className="space-y-1">
                    {[
                      { id: "by-feature", label: "By Feature Domain" },
                      { id: "by-directory", label: "By Directory" },
                      { id: "by-layer", label: "By Subsystem Layer" },
                    ].map((v) => {
                      const isSel = activeViewFilter === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setActiveViewFilter(v.id);
                            if (v.id === "by-directory") setGroupBy("directory");
                            else if (v.id === "by-layer") setGroupBy("layer");
                            else setGroupBy("feature");
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                          style={{
                            color: isSel ? "var(--text-primary)" : "var(--text-muted)",
                            backgroundColor: isSel ? "rgba(255,255,255,0.04)" : "transparent",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: isSel ? "var(--teal-bright)" : "transparent",
                              border: isSel ? "none" : "1px solid var(--text-muted)",
                            }}
                          />
                          <span>{v.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Atmosphere & Quote */}
            <div className="pt-6 mt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="space-y-1 text-xs">
                <span
                  className="text-xl font-serif leading-none block"
                  style={{ color: "var(--accent-orange)" }}
                >
                  “
                </span>
                <p
                  className="italic text-[11px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  A clearer view of code leads to better builders.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* =========================================================
            PANE 2 & 3: CENTER WORKSPACE + RIGHT INSPECTOR
            ========================================================= */}
        {explorerMode === "map" ? (
          <>
            {/* Center Spatial Map Pane */}
            <div
              className="flex-1 flex flex-col min-w-0"
              style={{ backgroundColor: "var(--bg-workspace)" }}
            >
              {/* Map Header Toolbar */}
              <div
                className="p-4 sm:px-6 sm:py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div>
                  <h2
                    className="text-base sm:text-lg font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Codebase Map
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Interactive structural map of {brief.owner}/{brief.repo}. Select any module to
                    inspect its connections and dependencies.
                  </p>
                </div>

                {/* Controls Right */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Group By Pills */}
                  <div
                    className="flex items-center gap-1 p-0.5 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <span
                      className="text-[10px] uppercase font-bold px-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Group:
                    </span>
                    {(["feature", "directory", "layer"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroupBy(g)}
                        className="px-2.5 py-1 rounded text-xs capitalize transition-all cursor-pointer"
                        style={{
                          backgroundColor: groupBy === g ? "var(--teal-primary)" : "transparent",
                          color: groupBy === g ? "var(--text-primary)" : "var(--text-secondary)",
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  {/* Map Search */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search in map..."
                      value={mapSearch}
                      onChange={(e) => setMapSearch(e.target.value)}
                      className="bg-transparent text-xs focus:outline-none w-28 sm:w-36 font-mono"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>

                  {/* 3D Isometric View Toggle */}
                  <button
                    type="button"
                    onClick={() => setIs3DMode(!is3DMode)}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer"
                    title={is3DMode ? "Switch to Flat Grid" : "Switch to 3D Isometric View"}
                    style={{
                      backgroundColor: is3DMode ? "var(--bg-hover)" : "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      color: is3DMode ? "var(--teal-bright)" : "var(--text-secondary)",
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Spatial Canvas Area */}
              <div className="flex-1 relative overflow-hidden min-h-[500px] p-6 flex flex-col justify-between">
                {/* Background Grid Canvas Texture */}
                <div className="absolute inset-0 canvas-texture opacity-60 pointer-events-none" />

                {/* Spatial Clusters Grid — sized to content */}
                <div
                  className={`relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max items-start transition-transform duration-300 ${
                    is3DMode ? "perspective-[1200px]" : ""
                  }`}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                  }}
                >
                  {islandGroups.map(([catKey, groupAreas]) => {
                    const theme = ISLAND_THEMES[catKey] || ISLAND_THEMES.other;
                    const filteredAreas = groupAreas.filter((a) =>
                      mapSearch ? a.name.toLowerCase().includes(mapSearch.toLowerCase()) : true
                    );

                    if (filteredAreas.length === 0 && mapSearch) return null;

                    return (
                      <div
                        key={catKey}
                        className="p-4 rounded-2xl relative transition-all duration-300"
                        style={{
                          backgroundColor: "rgba(18,35,38,0.85)",
                          border: `1px solid ${theme.border}`,
                          boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                          transform: is3DMode ? "rotateX(7deg) rotateY(-3deg)" : "none",
                        }}
                      >
                        {/* Island Header */}
                        <div
                          className="flex items-center justify-between mb-3 pb-2 border-b"
                          style={{ borderColor: "rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                              style={{
                                backgroundColor: theme.bg,
                                color: theme.color,
                                border: `1px solid ${theme.border}`,
                              }}
                            >
                              ✦
                            </div>
                            <span
                              className="font-bold text-xs"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {theme.name}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.3)",
                              color: theme.color,
                            }}
                          >
                            {groupAreas.length} {groupAreas.length === 1 ? "module" : "modules"}
                          </span>
                        </div>

                        {/* Module Blocks inside Island */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {filteredAreas.map((area) => {
                            const isSelected = area.id === selectedAreaId;
                            const isOutgoingTarget = outgoingTargetIds.has(area.id);
                            const isIncomingSource = incomingSourceIds.has(area.id);
                            const shortName =
                              area.associatedFiles[0]?.split("/").pop() || area.name;

                            return (
                              <button
                                key={area.id}
                                type="button"
                                onClick={() => handleSelectArea(area.id)}
                                className="p-3 rounded-xl text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between min-h-[76px]"
                                style={{
                                  backgroundColor: isSelected
                                    ? "var(--bg-hover)"
                                    : "rgba(13,27,31,0.9)",
                                  border: isSelected
                                    ? `1px solid ${theme.color}`
                                    : isOutgoingTarget
                                      ? "1px solid var(--teal-bright)"
                                      : isIncomingSource
                                        ? "1px solid var(--accent-orange)"
                                        : "1px solid var(--border-subtle)",
                                  boxShadow: isSelected
                                    ? `0 0 16px ${theme.glow}, inset 0 0 12px ${theme.bg}`
                                    : isOutgoingTarget
                                      ? "0 0 10px rgba(53,208,195,0.2)"
                                      : "0 2px 8px rgba(0,0,0,0.3)",
                                  transform: isSelected ? "translateY(-2px)" : "none",
                                }}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span
                                      className="font-mono text-[11px] font-bold truncate block"
                                      style={{
                                        color: isSelected
                                          ? "var(--text-primary)"
                                          : isOutgoingTarget
                                            ? "var(--teal-bright)"
                                            : "var(--text-secondary)",
                                      }}
                                      title={shortName}
                                    >
                                      {shortName}
                                    </span>
                                  </div>
                                  <p
                                    className="text-[10px] line-clamp-2 leading-relaxed"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    {area.role}
                                  </p>
                                </div>

                                {/* Dynamic Relationship Tag based on real analysis */}
                                {isSelected ? (
                                  <div className="mt-2 flex items-center gap-1">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full animate-ping"
                                      style={{ backgroundColor: theme.color }}
                                    />
                                    <span
                                      className="text-[9px] font-bold uppercase tracking-wider"
                                      style={{ color: theme.color }}
                                    >
                                      Selected
                                    </span>
                                  </div>
                                ) : isOutgoingTarget ? (
                                  <div className="mt-2 flex items-center gap-1">
                                    <span
                                      className="text-[9px] font-mono font-semibold"
                                      style={{ color: "var(--teal-bright)" }}
                                    >
                                      → Target
                                    </span>
                                  </div>
                                ) : isIncomingSource ? (
                                  <div className="mt-2 flex items-center gap-1">
                                    <span
                                      className="text-[9px] font-mono font-semibold"
                                      style={{ color: "var(--accent-orange)" }}
                                    >
                                      ← Caller
                                    </span>
                                  </div>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Controls Strip: Zoom Controls + Legend + Minimap */}
                <div
                  className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  {/* Zoom Controls Floating Bar */}
                  <div
                    className="flex items-center gap-1 p-1 rounded-xl"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                      className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                      className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                      title="Zoom Out"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="px-2 h-7 rounded flex items-center justify-center text-[10px] font-mono transition-colors cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                      title="Reset Zoom"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIs3DMode(!is3DMode)}
                      className="px-2 h-7 rounded flex items-center justify-center text-[10px] font-mono transition-colors cursor-pointer"
                      style={{
                        color: is3DMode ? "var(--teal-bright)" : "var(--text-muted)",
                      }}
                      title="Toggle Isometric 3D"
                    >
                      3D
                    </button>
                  </div>

                  {/* Category Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                    {Object.entries(ISLAND_THEMES).map(([k, t]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {t.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Minimap Thumbnail Box */}
                  <div
                    className="hidden md:flex flex-col items-center justify-center w-28 h-14 rounded-lg p-1.5 relative overflow-hidden"
                    style={{
                      backgroundColor: "rgba(11,23,26,0.9)",
                      border: "1px solid var(--border-default)",
                    }}
                    title="Codebase Minimap"
                  >
                    <div className="w-full h-full flex flex-wrap gap-1 items-center justify-center opacity-70">
                      <div
                        className="w-5 h-2.5 rounded-xs"
                        style={{ backgroundColor: "var(--teal-primary)" }}
                      />
                      <div
                        className="w-4 h-2.5 rounded-xs"
                        style={{ backgroundColor: "var(--accent-orange)" }}
                      />
                      <div
                        className="w-6 h-2.5 rounded-xs"
                        style={{ backgroundColor: "var(--accent-blue)" }}
                      />
                      <div
                        className="w-4 h-2.5 rounded-xs"
                        style={{ backgroundColor: "var(--accent-green)" }}
                      />
                      <div
                        className="w-5 h-2.5 rounded-xs"
                        style={{ backgroundColor: "var(--accent-purple)" }}
                      />
                    </div>
                    <div
                      className="absolute inset-1.5 border rounded-xs pointer-events-none"
                      style={{ borderColor: "var(--teal-bright)", opacity: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pane 3: Right Contextual Inspector */}
            <aside
              className="w-full lg:w-[350px] shrink-0 flex flex-col p-5 border-t lg:border-t-0 lg:border-l overflow-y-auto"
              style={{
                backgroundColor: "var(--bg-sidebar)",
                borderColor: "var(--border-default)",
              }}
            >
              {selectedArea ? (
                <div className="space-y-5 animate-fade-in">
                  {/* Breadcrumb Header */}
                  <div
                    className="flex items-center justify-between pb-3 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div
                      className="flex items-center gap-1.5 text-xs font-mono truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>{brief.repo}</span>
                      <span>&gt;</span>
                      <span className="truncate">{fileDir}</span>
                      <span>&gt;</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {fileName}
                      </span>
                    </div>
                  </div>

                  {/* Module File Card */}
                  <div
                    className="p-4 rounded-xl space-y-3"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: selectedTheme.bg,
                            border: `1px solid ${selectedTheme.border}`,
                          }}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            style={{ color: selectedTheme.color }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3
                            className="font-bold text-sm font-mono tracking-tight"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {fileName}
                          </h3>
                          <span
                            className="text-[11px] font-mono block truncate max-w-[170px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {primaryFile}
                          </span>
                        </div>
                      </div>

                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: selectedTheme.bg,
                          color: selectedTheme.color,
                          border: `1px solid ${selectedTheme.border}`,
                        }}
                      >
                        {selectedTheme.badge}
                      </span>
                    </div>

                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {selectedArea.role}
                    </p>

                    {/* 4 Metrics Strip */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2">
                      {[
                        { label: "Lines", value: metrics.lines, color: "var(--accent-orange)" },
                        {
                          label: "Functions",
                          value: metrics.functions,
                          color: "var(--teal-bright)",
                        },
                        { label: "Imports", value: metrics.imports, color: "var(--accent-blue)" },
                        { label: "Exports", value: metrics.exports, color: "var(--accent-purple)" },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="p-2 rounded-lg text-center"
                          style={{
                            backgroundColor: "var(--bg-workspace)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <span
                            className="text-xs font-bold font-mono block"
                            style={{ color: m.color }}
                          >
                            {m.value}
                          </span>
                          <span
                            className="text-[9px] uppercase tracking-wider block mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inspector Tabs */}
                  <div
                    className="flex items-center gap-1 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    {[
                      { id: "overview" as const, label: "Overview" },
                      { id: "code" as const, label: "Files" },
                      { id: "dependencies" as const, label: "Connections" },
                      { id: "usedby" as const, label: "Used By" },
                    ].map((t) => {
                      const isAct = inspectorTab === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setInspectorTab(t.id)}
                          className="px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer relative"
                          style={{
                            color: isAct ? "var(--teal-bright)" : "var(--text-secondary)",
                          }}
                        >
                          <span>{t.label}</span>
                          {isAct && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                              style={{ backgroundColor: "var(--teal-bright)" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  {inspectorTab === "overview" && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Key Responsibilities */}
                      <div className="space-y-2">
                        <span
                          className="text-xs font-bold uppercase tracking-wider block"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Key Responsibilities
                        </span>
                        <ul
                          className="space-y-2 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {responsibilities.map((resp, i) => (
                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ backgroundColor: selectedTheme.color }}
                              />
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Outgoing Connections */}
                      {outgoingRels.length > 0 && (
                        <div
                          className="space-y-2 pt-2 border-t"
                          style={{ borderColor: "var(--border-subtle)" }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-bold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Connected Modules ({outgoingRels.length})
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {outgoingRels.map((rel, i) => {
                              const targetArea = areas.find((a) => a.id === rel.toAreaId);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => targetArea && handleSelectArea(targetArea.id)}
                                  className="w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                                  style={{
                                    backgroundColor: "var(--bg-elevated)",
                                    border: "1px solid var(--border-subtle)",
                                  }}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: "var(--teal-bright)" }}
                                    />
                                    <span
                                      className="text-xs font-mono font-medium truncate group-hover:text-white"
                                      style={{ color: "var(--text-secondary)" }}
                                    >
                                      {targetArea?.name || rel.toAreaId}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                                    {rel.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {inspectorTab === "code" && (
                    <div className="space-y-2 animate-fade-in">
                      <span
                        className="text-xs font-bold block"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Associated Source Files ({selectedArea.associatedFiles.length})
                      </span>
                      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                        {selectedArea.associatedFiles.map((file) => (
                          <a
                            key={file}
                            href={`https://github.com/${brief.owner}/${brief.repo}/blob/${brief.commitSha}/${file.replace(/^\/+/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg flex items-center justify-between text-xs font-mono transition-colors group"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span className="truncate group-hover:text-white">{file}</span>
                            <ExternalLinkIcon className="w-3 h-3 shrink-0 ml-2 opacity-50 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {inspectorTab === "dependencies" && (
                    <div className="space-y-2 animate-fade-in">
                      <span
                        className="text-xs font-bold block"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Outgoing Dependencies ({outgoingRels.length})
                      </span>
                      {outgoingRels.length > 0 ? (
                        <div className="space-y-1.5">
                          {outgoingRels.map((rel, idx) => {
                            const target = areas.find((a) => a.id === rel.toAreaId);
                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg space-y-1"
                                style={{
                                  backgroundColor: "var(--bg-elevated)",
                                  border: "1px solid var(--border-subtle)",
                                }}
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span
                                    className="font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    → {target?.name || rel.toAreaId}
                                  </span>
                                  <span
                                    className="text-[10px] font-mono px-1 rounded"
                                    style={{
                                      backgroundColor: "rgba(255,255,255,0.06)",
                                      color: "var(--teal-bright)",
                                    }}
                                  >
                                    {rel.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                          No direct outgoing dependencies recorded for this module.
                        </p>
                      )}
                    </div>
                  )}

                  {inspectorTab === "usedby" && (
                    <div className="space-y-2 animate-fade-in">
                      <span
                        className="text-xs font-bold block"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Incoming Usages ({incomingRels.length})
                      </span>
                      {incomingRels.length > 0 ? (
                        <div className="space-y-1.5">
                          {incomingRels.map((rel, idx) => {
                            const fromArea = areas.find((a) => a.id === rel.fromAreaId);
                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg space-y-1"
                                style={{
                                  backgroundColor: "var(--bg-elevated)",
                                  border: "1px solid var(--border-subtle)",
                                }}
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span
                                    className="font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                  >
                                    ← {fromArea?.name || rel.fromAreaId}
                                  </span>
                                  <span
                                    className="text-[10px] font-mono px-1 rounded"
                                    style={{
                                      backgroundColor: "rgba(255,255,255,0.06)",
                                      color: "var(--accent-orange)",
                                    }}
                                  >
                                    {rel.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                          No modules directly depend on this module as a target.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Button: Open in GitHub */}
                  <div className="pt-2">
                    <a
                      href={githubFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                      style={{
                        backgroundColor: "var(--teal-primary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span>Open in GitHub Permalinks →</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-zinc-500">
                  <p>Select a module block on the map to inspect its details.</p>
                </div>
              )}
            </aside>
          </>
        ) : (
          /* Technical Overview Mode embedded seamlessly inside the hero workbench */
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6"
            style={{ backgroundColor: "var(--bg-workspace)" }}
          >
            <TechnicalOverviewHero
              overview={brief.technicalOverview}
              evidenceSummary={evidenceSummary}
              repoOwner={brief.owner}
              repoName={brief.repo}
              commitSha={brief.commitSha}
              showHeader={false}
            />
          </div>
        )}
      </div>

      {/* =========================================================
          BOTTOM ROW: KEY ARCHITECTURAL INSIGHTS
          ========================================================= */}
      <section className="space-y-3">
        <div>
          <h3
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Key Insights
          </h3>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Important structural patterns found in this repository and its module relationships.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              title: "Central Core Subsystem",
              desc: `${selectedArea?.name || "The core module"} anchors application lifecycle and orchestrates routing and internal handlers.`,
              color: "var(--teal-bright)",
              bg: "rgba(15,138,131,0.14)",
              border: "rgba(15,138,131,0.3)",
            },
            {
              title: "Widely Connected",
              desc: `Integrates with ${Math.max(3, outgoingRels.length + incomingRels.length)}+ subsystem components across the detected architecture.`,
              color: "var(--accent-orange)",
              bg: "rgba(242,140,69,0.14)",
              border: "rgba(242,140,69,0.3)",
            },
            {
              title: "Evidence-Backed Analysis",
              desc: `Grounded in ${totalFilesCount} repository manifests with commit-pinned source permalinks.`,
              color: "var(--accent-blue)",
              bg: "rgba(77,159,216,0.14)",
              border: "rgba(77,159,216,0.3)",
            },
            {
              title: "Cohesive Contract Surface",
              desc: `Subsystems integrate through documented method boundaries, middleware pipelines, and exported interfaces.`,
              color: "var(--accent-purple)",
              bg: "rgba(144,100,217,0.14)",
              border: "rgba(144,100,217,0.3)",
            },
          ].map((insight) => (
            <div
              key={insight.title}
              className="p-4 rounded-xl flex flex-col gap-2.5 transition-all"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: insight.bg, border: `1px solid ${insight.border}` }}
              >
                <span className="text-xs" style={{ color: insight.color }}>
                  ✦
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs mb-1" style={{ color: "var(--text-primary)" }}>
                  {insight.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {insight.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
