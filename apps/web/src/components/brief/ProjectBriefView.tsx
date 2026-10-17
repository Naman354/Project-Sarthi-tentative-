"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { ProjectBrief, EvidenceSummary, ProjectCategory } from "../../types/brief";
import type {
  Project,
  ProjectGraph,
  ModuleSummaryItem,
  InsightItem,
  ProjectHealthReport,
  ResumeSessionBriefing,
  NormalizedEntity,
} from "../../types/project";
import CodeExplorerWorkbench, { CodeExplorerMode } from "./CodeExplorerWorkbench";
import ProjectDescriptionSection from "./ProjectDescriptionSection";
import GuidedReadingTimeline from "./GuidedReadingTimeline";
import ArchitectureHealthSection, { evaluateArchitectureHealth } from "./ArchitectureHealthSection";
import CapabilityIndex from "./CapabilityIndex";
import AdaptiveVisualModel from "./visual-models/AdaptiveVisualModel";
import TechnicalOverviewHero from "./TechnicalOverviewHero";
import RawEntitiesExplorer from "../entities/RawEntitiesExplorer";
import { CommandPalette } from "../common/CommandPalette";
import {
  ExternalLinkIcon,
  CompassIcon,
  NetworkGraphIcon,
  ShieldCheckIcon,
  TargetIcon,
  BookOpenIcon,
  LayersIcon,
  GitBranchIcon,
  MenuIcon,
  RefreshIcon,
  XMarkIcon,
  FolderIcon,
  CodeIcon,
  ArrowRightIcon,
  SearchIcon,
  TrashIcon,
} from "../Icons";
import { TechLogo } from "../TechIcons";

interface ProjectBriefViewProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing?: boolean;
  // Stored project analysis properties (when available):
  project?: Project;
  graph?: ProjectGraph | null;
  modules?: ModuleSummaryItem[];
  storedHealth?: ProjectHealthReport | null;
  insights?: InsightItem[];
  resume?: ResumeSessionBriefing | null;
  entities?: NormalizedEntity[];
  // Project management operations for saved projects
  onReanalyze?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  isAnalyzing?: boolean;
}

const CATEGORY_STYLES: Record<ProjectCategory, { label: string; icon: string; badge: string }> = {
  "web-application": {
    label: "Web Application",
    icon: "🌐",
    badge:
      "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  },
  "backend-system": {
    label: "Backend Service & API",
    icon: "⚡",
    badge:
      "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
  },
  "cli-tool": {
    label: "Command-Line Tool",
    icon: "💻",
    badge:
      "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  },
  "library-framework": {
    label: "Software Library & SDK",
    icon: "📦",
    badge:
      "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
  },
  "data-ml": {
    label: "Data & ML Pipeline",
    icon: "🧠",
    badge:
      "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
  },
  universal: {
    label: "Modular Codebase",
    icon: "🧩",
    badge:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700",
  },
};

const WORKSPACE_DESTINATIONS = [
  {
    id: "overview",
    label: "Overview",
    description: "Orientation, structural facts & stack",
    icon: CompassIcon,
  },
  {
    id: "explorer",
    label: "Code Explorer",
    description: "Map, interactive graph & module inspector",
    icon: NetworkGraphIcon,
  },
  {
    id: "health",
    label: "Health & Insights",
    description: "Calculated coupling, cycles & diagnostics",
    icon: ShieldCheckIcon,
  },
  {
    id: "capabilities",
    label: "Capabilities",
    description: "Domain behaviors & functional jobs",
    icon: TargetIcon,
  },
  {
    id: "reading",
    label: "Reading Guide",
    description: "Chronological starting path through files",
    icon: BookOpenIcon,
  },
  {
    id: "dependencies",
    label: "Dependencies & Structure",
    description: "Packages, scripts, entrypoints & tree",
    icon: LayersIcon,
  },
  {
    id: "topology",
    label: "Deep Topology",
    description: "Subsystem architectural model",
    icon: GitBranchIcon,
  },
  {
    id: "entities",
    label: "Raw Entities",
    description: "Low-level AST-indexed entities",
    icon: CodeIcon,
    isAdvanced: true,
  },
] as const;

type DestinationId = (typeof WORKSPACE_DESTINATIONS)[number]["id"];

export default function ProjectBriefView({
  brief,
  evidenceSummary,
  onRefresh,
  onReset,
  isRefreshing = false,
  project,
  graph,
  modules = [],
  storedHealth,
  insights = [],
  resume,
  entities = [],
  onReanalyze,
  onDelete,
  isAnalyzing = false,
}: ProjectBriefViewProps) {
  // Project management in-place confirmation states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Parse initial section from URL with legacy alias support
  const [activeNavSection, setActiveNavSection] = useState<DestinationId>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sec = params.get("section");
      if (
        sec === "map" ||
        sec === "graph" ||
        sec === "flow" ||
        sec === "modules" ||
        sec === "explorer"
      ) {
        return "explorer";
      }
      if (sec === "health" || sec === "insights") {
        return "health";
      }
      if (sec && WORKSPACE_DESTINATIONS.some((d) => d.id === sec)) {
        return sec as DestinationId;
      }
    }
    return "overview";
  });

  // Sub-mode for Code Explorer (Map | Graph | Flow | Modules)
  const [codeExplorerSubMode, setCodeExplorerSubMode] = useState<CodeExplorerMode>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sec = params.get("section");
      if (sec === "graph") return "graph";
      if (sec === "flow") return "flow";
      if (sec === "modules") return "modules";
      const mode = params.get("mode");
      if (mode === "graph" || mode === "flow" || mode === "modules" || mode === "map") return mode;
    }
    return "map";
  });

  const [focusedAreaId, setFocusedAreaId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global hotkey listener for Omnibar (Ctrl+K / Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commitShort = brief.commitSha ? brief.commitSha.substring(0, 7) : "HEAD";
  const commitUrl = `https://github.com/${brief.owner}/${brief.repo}/tree/${brief.commitSha}`;

  // Evaluate Architecture Health reliably using the shared evaluator with storedHealth fallback
  const healthEval = useMemo(() => {
    const res = evaluateArchitectureHealth(brief, evidenceSummary);
    if (res.overallScore === null && storedHealth?.overallScore !== undefined) {
      return {
        ...res,
        overallScore: storedHealth.overallScore,
        overallStatus:
          storedHealth.status === "healthy" ? ("healthy" as const) : ("needs-attention" as const),
      };
    }
    return res;
  }, [brief, evidenceSummary, storedHealth]);

  const categoryKey: ProjectCategory = brief.technicalOverview.projectCategory || "universal";
  const categoryMeta = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.universal;

  const formattedGeneratedDate = useMemo(() => {
    if (!brief.generatedAt) return "Recently analyzed";
    try {
      return new Date(brief.generatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently analyzed";
    }
  }, [brief.generatedAt]);

  const totalFilesCount = useMemo(() => {
    if (evidenceSummary?.languages && evidenceSummary.languages.length > 0) {
      return evidenceSummary.languages.reduce((acc, l) => acc + l.fileCount, 0);
    }
    return brief.technicalOverview.totalFiles || 0;
  }, [brief.technicalOverview.totalFiles, evidenceSummary]);

  // Handle URL deep-linking sync
  const handleSelectNavSection = useCallback(
    (section: DestinationId, subMode?: CodeExplorerMode) => {
      setActiveNavSection(section);
      if (subMode) {
        setCodeExplorerSubMode(subMode);
      }
      setIsMobileDrawerOpen(false);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("section", section);
        if (section === "explorer") {
          params.set("mode", subMode || codeExplorerSubMode);
        } else {
          params.delete("mode");
        }
        window.history.replaceState(null, "", `?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [codeExplorerSubMode]
  );

  const handleInspectAreaInMap = useCallback(
    (areaId: string) => {
      setFocusedAreaId(areaId);
      handleSelectNavSection("explorer", "map");
    },
    [handleSelectNavSection]
  );

  const handleLocateInGraph = useCallback(
    (nodeOrModule: string) => {
      setFocusedNodeId(nodeOrModule);
      handleSelectNavSection("explorer", "graph");
    },
    [handleSelectNavSection]
  );

  const getDestinationBadge = (id: DestinationId) => {
    switch (id) {
      case "explorer":
        return `${modules.length || brief.conceptualMap.areas?.length || 0} modules`;
      case "health":
        if (healthEval.overallScore !== null) return `${healthEval.overallScore}/100`;
        if (insights.length > 0) return `${insights.length} findings`;
        return null;
      case "capabilities":
        return `${brief.capabilities?.length || 0}`;
      case "reading":
        return `${brief.guidedTour?.length || 0} steps`;
      case "dependencies":
        return `${(brief.technicalOverview.dependencies?.length || 0) + (brief.technicalOverview.devDependencies?.length || 0)}`;
      case "entities":
        return entities.length > 0 ? `${entities.length}` : null;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-20">
      {/* =========================================================
          1. COMPACT REPOSITORY HEADER BANNER
          ========================================================= */}
      <header
        className="rounded-2xl p-5 sm:p-6 shadow-lg space-y-5"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        }}
      >
        {/* Top Identity Row: Logo, Name, Badges & Actions */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-300 hover:text-white cursor-pointer transition-colors"
              style={{
                backgroundColor: "var(--bg-workspace)",
                border: "1px solid var(--border-subtle)",
              }}
              title="Open Navigation Drawer"
              aria-label="Open Navigation Drawer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Back to Repositories Action */}
            <button
              type="button"
              id="brief-explore-another-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:text-white"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span>←</span>
              <span>Explore Another</span>
            </button>

            <div
              className="h-4 w-px hidden sm:block"
              style={{ backgroundColor: "var(--border-default)" }}
            />

            {/* Repository Logo / Tech Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                border: "1px solid rgba(53,208,195,0.3)",
                color: "var(--teal-bright)",
              }}
            >
              {brief.technicalOverview.primaryLanguage ? (
                <TechLogo name={brief.technicalOverview.primaryLanguage} className="w-5 h-5" />
              ) : (
                <FolderIcon className="w-5 h-5" />
              )}
            </div>

            {/* Repository Name & Link */}
            <div className="flex items-center gap-2">
              <a
                href={brief.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-1.5 transition-colors group"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="group-hover:text-[var(--teal-bright)]">
                  {brief.owner} / {brief.repo}
                </span>
                <ExternalLinkIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              </a>
            </div>

            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${categoryMeta.badge}`}
            >
              <span>{categoryMeta.icon}</span>
              <span>{categoryMeta.label}</span>
            </span>

            {/* Status Badge */}
            {brief.generatedBy === "deterministic-fallback" ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(244,176,79,0.12)",
                  color: "var(--accent-amber)",
                  border: "1px solid rgba(244,176,79,0.3)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Manifest Fallback</span>
              </span>
            ) : brief.cached ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(85,184,121,0.12)",
                  color: "var(--accent-green)",
                  border: "1px solid rgba(85,184,121,0.3)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Cached Snapshot</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(85,184,121,0.12)",
                  color: "var(--accent-green)",
                  border: "1px solid rgba(85,184,121,0.3)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized &amp; Analyzed</span>
              </span>
            )}

            {/* Health Score Chip — ONLY shown if reliable overall score is calculated */}
            {healthEval.overallScore !== null && (
              <button
                type="button"
                onClick={() => handleSelectNavSection("health")}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:brightness-110"
                style={{
                  backgroundColor:
                    healthEval.overallStatus === "healthy"
                      ? "rgba(85,184,121,0.12)"
                      : healthEval.overallStatus === "needs-attention"
                        ? "rgba(244,176,79,0.12)"
                        : "rgba(224,92,92,0.12)",
                  color:
                    healthEval.overallStatus === "healthy"
                      ? "var(--accent-green)"
                      : healthEval.overallStatus === "needs-attention"
                        ? "var(--accent-amber)"
                        : "var(--danger)",
                  border: `1px solid ${
                    healthEval.overallStatus === "healthy"
                      ? "rgba(85,184,121,0.3)"
                      : healthEval.overallStatus === "needs-attention"
                        ? "rgba(244,176,79,0.3)"
                        : "rgba(224,92,92,0.3)"
                  }`,
                }}
                title="Click to view Architecture Health details"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    healthEval.overallStatus === "healthy"
                      ? "bg-emerald-500"
                      : healthEval.overallStatus === "needs-attention"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
                <span>Health: {healthEval.overallScore}/100</span>
              </button>
            )}
          </div>

          {/* Right Action: Omnibar Search, Re-run Analysis & Refresh */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Omnibar Search Trigger (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer hover:text-white"
              style={{
                backgroundColor: "var(--bg-workspace)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              title="Global Search & Omnibar (Ctrl+K)"
            >
              <SearchIcon className="w-3.5 h-3.5 opacity-70" />
              <span className="hidden sm:inline">Search</span>
              <kbd
                className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                Ctrl+K
              </kbd>
            </button>

            {/* Saved Project Management: Re-run Analysis */}
            {project?.id && onReanalyze && (
              <button
                type="button"
                id="brief-reanalyze-btn"
                onClick={onReanalyze}
                disabled={isAnalyzing || isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  border: "1px solid rgba(53,208,195,0.3)",
                  color: "var(--teal-bright)",
                }}
                title="Trigger full repository re-analysis"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span>{isAnalyzing ? "Analyzing..." : "Re-run Analysis"}</span>
              </button>
            )}

            {/* Saved Project Management: Delete with In-place Confirmation */}
            {project?.id && onDelete && (
              <div className="relative shrink-0">
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 animate-fade-in">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await onDelete();
                        } finally {
                          setIsDeleting(false);
                          setConfirmDelete(false);
                        }
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: "var(--danger)", color: "#fff" }}
                    >
                      {isDeleting ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "var(--bg-workspace)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 rounded-xl transition-colors cursor-pointer hover:text-rose-400"
                    style={{
                      backgroundColor: "var(--bg-workspace)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-muted)",
                    }}
                    title="Delete saved project"
                    aria-label="Delete saved project"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Refresh Cached View */}
            <button
              type="button"
              id="brief-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing || isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 hover:text-white"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
              title="Refresh repository view"
            >
              <RefreshIcon
                className={`w-3.5 h-3.5 ${isRefreshing && !isAnalyzing ? "animate-spin text-[var(--teal-bright)]" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact Metadata Row (4 Clean Chips) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Chip 1: Repository Permalinks */}
          <div
            className="p-3 rounded-xl flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              GitHub Repository
            </span>
            <a
              href={brief.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium truncate max-w-full hover:underline"
              style={{ color: "var(--teal-bright)" }}
            >
              <span className="truncate">
                {brief.owner}/{brief.repo}
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </a>
          </div>

          {/* Chip 2: Active Snapshot & Commit */}
          <div
            className="p-3 rounded-xl flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Active Snapshot &amp; Commit
            </span>
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium truncate hover:underline"
              style={{ color: "var(--text-primary)" }}
              title="Inspect snapshot commit tree on GitHub"
            >
              <GitBranchIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{project?.defaultBranch || "main"}</span>
              <span style={{ color: "var(--teal-bright)" }} className="text-[11px]">
                @{commitShort}
              </span>
            </a>
          </div>

          {/* Chip 3: Ecosystem & Stack */}
          <div
            className="p-3 rounded-xl flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Ecosystem &amp; Stack
            </span>
            <span
              className="text-xs font-medium truncate flex items-center gap-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              <span
                className="font-mono uppercase font-bold text-[11px]"
                style={{ color: "var(--teal-bright)" }}
              >
                {brief.technicalOverview.ecosystem}
              </span>
              <span style={{ color: "var(--border-subtle)" }}>•</span>
              <span>{brief.technicalOverview.primaryLanguage}</span>
              {brief.technicalOverview.detectedFrameworks?.[0] && (
                <>
                  <span style={{ color: "var(--border-subtle)" }}>•</span>
                  <span className="truncate">{brief.technicalOverview.detectedFrameworks[0]}</span>
                </>
              )}
            </span>
          </div>

          {/* Chip 4: Analysis Snapshot Details */}
          <div
            className="p-3 rounded-xl flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider block mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Analysis Details
            </span>
            <span
              className="text-xs font-medium truncate flex items-center justify-between"
              style={{ color: "var(--text-primary)" }}
            >
              <span>{formattedGeneratedDate}</span>
              <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                {totalFilesCount} files
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* =========================================================
          2. WORKSPACE 2-COLUMN LAYOUT: SIDEBAR + FOCUSED CONTENT AREA
          ========================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* =========================================================
            PERSISTENT DESKTOP SIDEBAR
            ========================================================= */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 sticky top-6 transition-all ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "1rem",
            padding: isSidebarCollapsed ? "0.75rem 0.5rem" : "1rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
          aria-label="Repository Navigation"
        >
          {/* Sidebar Section Header & Collapse Toggle */}
          <div
            className="flex items-center justify-between pb-3 mb-2 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {!isSidebarCollapsed && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1"
                style={{ color: "var(--text-muted)" }}
              >
                Destinations
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs ml-auto"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          {/* Navigation Items (Grouped: Core Destinations & Advanced Tools) */}
          <nav className="space-y-1">
            {WORKSPACE_DESTINATIONS.filter((d) => !("isAdvanced" in d && d.isAdvanced)).map(
              (dest) => {
                const isActive = activeNavSection === dest.id;
                const Icon = dest.icon;
                const badge = getDestinationBadge(dest.id);

                return (
                  <button
                    key={dest.id}
                    type="button"
                    id={`nav-dest-${dest.id}`}
                    onClick={() => handleSelectNavSection(dest.id)}
                    className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                      isSidebarCollapsed ? "p-3 justify-center" : "px-3.5 py-2.5"
                    }`}
                    style={{
                      backgroundColor: isActive ? "rgba(15,138,131,0.16)" : "transparent",
                      color: isActive ? "var(--teal-bright)" : "var(--text-secondary)",
                      border: isActive
                        ? "1px solid rgba(53,208,195,0.35)"
                        : "1px solid transparent",
                    }}
                    title={isSidebarCollapsed ? dest.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="shrink-0 transition-colors"
                        style={{ color: isActive ? "var(--teal-bright)" : "var(--text-muted)" }}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      {!isSidebarCollapsed && (
                        <span className="text-xs sm:text-sm font-semibold truncate group-hover:text-white">
                          {dest.label}
                        </span>
                      )}
                    </div>

                    {!isSidebarCollapsed && badge && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ml-2"
                        style={{
                          backgroundColor: isActive
                            ? "rgba(53,208,195,0.2)"
                            : "rgba(255,255,255,0.06)",
                          color: isActive ? "var(--teal-bright)" : "var(--text-muted)",
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              }
            )}

            {/* Advanced Navigation Group */}
            {WORKSPACE_DESTINATIONS.some((d) => "isAdvanced" in d && d.isAdvanced) && (
              <div
                className="pt-2 mt-2 border-t space-y-1"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {!isSidebarCollapsed && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-1 block mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Advanced Tools
                  </span>
                )}
                {WORKSPACE_DESTINATIONS.filter((d) => "isAdvanced" in d && d.isAdvanced).map(
                  (dest) => {
                    const isActive = activeNavSection === dest.id;
                    const Icon = dest.icon;
                    const badge = getDestinationBadge(dest.id);

                    return (
                      <button
                        key={dest.id}
                        type="button"
                        id={`nav-dest-${dest.id}`}
                        onClick={() => handleSelectNavSection(dest.id)}
                        className={`w-full text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                          isSidebarCollapsed ? "p-3 justify-center" : "px-3.5 py-2.5"
                        }`}
                        style={{
                          backgroundColor: isActive ? "rgba(15,138,131,0.16)" : "transparent",
                          color: isActive ? "var(--teal-bright)" : "var(--text-secondary)",
                          border: isActive
                            ? "1px solid rgba(53,208,195,0.35)"
                            : "1px solid transparent",
                        }}
                        title={isSidebarCollapsed ? dest.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="shrink-0 transition-colors"
                            style={{
                              color: isActive ? "var(--teal-bright)" : "var(--text-muted)",
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          {!isSidebarCollapsed && (
                            <span className="text-xs sm:text-sm font-semibold truncate group-hover:text-white">
                              {dest.label}
                            </span>
                          )}
                        </div>

                        {!isSidebarCollapsed && badge && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ml-2"
                            style={{
                              backgroundColor: isActive
                                ? "rgba(53,208,195,0.2)"
                                : "rgba(255,255,255,0.06)",
                              color: isActive ? "var(--teal-bright)" : "var(--text-muted)",
                            }}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </nav>
        </aside>

        {/* =========================================================
            MOBILE SLIDE-OVER DRAWER (Triggered by Hamburger Button)
            ========================================================= */}
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Slide-over Drawer Panel */}
            <div
              className="fixed top-0 bottom-0 left-0 w-72 z-50 p-5 flex flex-col justify-between lg:hidden shadow-2xl animate-fade-in"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderRight: "1px solid var(--border-default)",
              }}
            >
              <div className="space-y-5">
                {/* Drawer Header */}
                <div
                  className="flex items-center justify-between pb-3 border-b"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--teal-bright)" }}
                    >
                      Workspace Navigation
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Navigation List (Grouped: Core Destinations & Advanced Tools) */}
                <nav className="space-y-1.5">
                  {WORKSPACE_DESTINATIONS.filter((d) => !("isAdvanced" in d && d.isAdvanced)).map(
                    (dest) => {
                      const isActive = activeNavSection === dest.id;
                      const Icon = dest.icon;
                      const badge = getDestinationBadge(dest.id);

                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => handleSelectNavSection(dest.id)}
                          className="w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                          style={{
                            backgroundColor: isActive
                              ? "rgba(15,138,131,0.16)"
                              : "var(--bg-workspace)",
                            color: isActive ? "var(--teal-bright)" : "var(--text-secondary)",
                            border: isActive
                              ? "1px solid rgba(53,208,195,0.35)"
                              : "1px solid var(--border-subtle)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-semibold">{dest.label}</span>
                          </div>
                          {badge && (
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                              style={{
                                backgroundColor: isActive
                                  ? "rgba(53,208,195,0.2)"
                                  : "rgba(255,255,255,0.06)",
                                color: isActive ? "var(--teal-bright)" : "var(--text-muted)",
                              }}
                            >
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}

                  {/* Advanced Navigation Group */}
                  {WORKSPACE_DESTINATIONS.some((d) => "isAdvanced" in d && d.isAdvanced) && (
                    <div
                      className="pt-2.5 mt-2.5 border-t space-y-1.5"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1 block mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Advanced Tools
                      </span>
                      {WORKSPACE_DESTINATIONS.filter((d) => "isAdvanced" in d && d.isAdvanced).map(
                        (dest) => {
                          const isActive = activeNavSection === dest.id;
                          const Icon = dest.icon;
                          const badge = getDestinationBadge(dest.id);

                          return (
                            <button
                              key={dest.id}
                              type="button"
                              onClick={() => handleSelectNavSection(dest.id)}
                              className="w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                              style={{
                                backgroundColor: isActive
                                  ? "rgba(15,138,131,0.16)"
                                  : "var(--bg-workspace)",
                                color: isActive ? "var(--teal-bright)" : "var(--text-secondary)",
                                border: isActive
                                  ? "1px solid rgba(53,208,195,0.35)"
                                  : "1px solid var(--border-subtle)",
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-semibold">{dest.label}</span>
                              </div>
                              {badge && (
                                <span
                                  className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                                  style={{
                                    backgroundColor: isActive
                                      ? "rgba(53,208,195,0.2)"
                                      : "rgba(255,255,255,0.06)",
                                    color: isActive ? "var(--teal-bright)" : "var(--text-muted)",
                                  }}
                                >
                                  {badge}
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </nav>
              </div>

              {/* Bottom Identity in Drawer */}
              <div
                className="pt-4 border-t text-xs"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <div className="font-mono truncate">
                  {brief.owner}/{brief.repo}
                </div>
                <div className="text-[10px] pt-1">Commit: @{commitShort}</div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================
            FOCUSED MAIN CONTENT AREA (Renders ONLY the active destination!)
            ========================================================= */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* =========================================================
              DESTINATION 1: OVERVIEW (Default Landing View)
              - 1. Compact Technical Overview (Facts selected by default)
              - 2. Concise explanation of project purpose
              - 3. Developer Briefing & Next Steps (When available from saved project)
              - 4. Compact Reading Guide preview with actionable links
              - 5. Limitations / Fallback note
              ========================================================= */}
          {activeNavSection === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Fallback Notice if applicable */}
              {brief.generatedBy === "deterministic-fallback" && (
                <div
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{
                    backgroundColor: "rgba(244,176,79,0.08)",
                    border: "1px solid rgba(244,176,79,0.3)",
                    color: "var(--accent-amber)",
                  }}
                >
                  <div className="shrink-0 mt-0.5 text-base">ℹ</div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <p className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                      Analysis generated from repository manifests
                    </p>
                    <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {brief.limitationsAndGaps[0] ||
                        "AI synthesis was unavailable. This overview was generated directly from repository manifests, documentation, and source inventory."}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Compact Technical Overview Hero (Donut + Distinctive Facts by default) */}
              <TechnicalOverviewHero
                overview={brief.technicalOverview}
                evidenceSummary={evidenceSummary}
                repoOwner={brief.owner}
                repoName={brief.repo}
                commitSha={brief.commitSha}
                showHeader={false}
                defaultTab="facts"
                onNavigateDestination={(dest) => handleSelectNavSection(dest as DestinationId)}
              />

              {/* 2. Concise Project Explanation */}
              <ProjectDescriptionSection
                brief={brief}
                onExploreCapabilities={() => handleSelectNavSection("capabilities")}
                onInspectArea={handleInspectAreaInMap}
              />

              {/* 3. Developer Briefing & Next Steps (Integrated from Legacy Overview) */}
              {resume && (
                <div
                  className="rounded-2xl p-5 sm:p-6 space-y-4"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: "rgba(15,138,131,0.15)",
                          color: "var(--teal-bright)",
                          border: "1px solid rgba(15,138,131,0.3)",
                        }}
                      >
                        <CompassIcon className="w-4 h-4" />
                      </span>
                      <h3
                        className="text-base sm:text-lg font-bold tracking-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Recommended Next Steps &amp; Orientation
                      </h3>
                    </div>

                    {resume.suggestedStartingPoint && (
                      <div
                        className="flex items-center gap-2 px-3 py-1 rounded-xl text-xs self-start sm:self-auto"
                        style={{
                          backgroundColor: "var(--bg-workspace)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>Suggested Start:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (resume.suggestedStartingPoint.moduleName) {
                              setFocusedNodeId(resume.suggestedStartingPoint.moduleName);
                            }
                            handleSelectNavSection("explorer", "modules");
                          }}
                          className="font-bold hover:underline cursor-pointer"
                          style={{ color: "var(--teal-bright)" }}
                        >
                          {resume.suggestedStartingPoint.moduleName} →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Architectural Rationale */}
                  {resume.suggestedStartingPoint?.rationale && (
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {resume.suggestedStartingPoint.rationale}
                    </p>
                  )}

                  {/* Recommendations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {resume.navigationRecommendations?.slice(0, 2).map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                        style={{
                          backgroundColor: "var(--bg-workspace)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (rec.targetModule) {
                                setFocusedNodeId(rec.targetModule);
                              }
                              handleSelectNavSection("explorer", "modules");
                            }}
                            className="font-semibold truncate text-left hover:underline cursor-pointer block"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {rec.title}
                          </button>
                          <div
                            className="text-[11px] truncate mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {rec.reason}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (rec.targetModule) {
                              setFocusedNodeId(rec.targetModule);
                            }
                            handleSelectNavSection("explorer", "modules");
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors shrink-0 cursor-pointer"
                          style={{ color: "var(--teal-bright)" }}
                          title="Inspect in Code Explorer"
                        >
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Compact Reading Guide Preview (Top 3 steps) */}
              {brief.guidedTour.length > 0 && (
                <GuidedReadingTimeline
                  steps={brief.guidedTour}
                  owner={brief.owner}
                  repo={brief.repo}
                  commitSha={brief.commitSha}
                  maxSteps={3}
                  onViewAll={() => handleSelectNavSection("reading")}
                />
              )}

              {/* 5. Analysis Gaps / Known Limitations (Restrained note) */}
              {brief.limitationsAndGaps.length > 0 &&
                brief.generatedBy !== "deterministic-fallback" && (
                  <section
                    className="rounded-2xl p-5 sm:p-6 space-y-2.5"
                    style={{
                      backgroundColor: "rgba(244,176,79,0.05)",
                      border: "1px solid rgba(244,176,79,0.25)",
                    }}
                  >
                    <h3
                      className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                      style={{ color: "var(--accent-amber)" }}
                    >
                      <span>Analysis Gaps &amp; Known Limitations</span>
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {brief.limitationsAndGaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </section>
                )}
            </div>
          )}

          {/* =========================================================
              DESTINATION 2: CODE EXPLORER
              Map (Spatial) | Graph (Interactive) | Modules (Explorer)
              ========================================================= */}
          {activeNavSection === "explorer" && (
            <div className="space-y-6 animate-fade-in">
              <CodeExplorerWorkbench
                brief={brief}
                evidenceSummary={evidenceSummary}
                graph={graph}
                modules={modules}
                insights={insights}
                initialMode={codeExplorerSubMode}
                initialNodeId={focusedNodeId}
                focusedAreaId={focusedAreaId}
                onSelectArea={(id) => setFocusedAreaId(id)}
                onExploreAnother={onReset}
                onModeChange={(mode) => setCodeExplorerSubMode(mode)}
              />
            </div>
          )}

          {/* =========================================================
              DESTINATION 3: HEALTH & INSIGHTS
              Architecture signals, circular score gauge, and actionable diagnostics
              ========================================================= */}
          {activeNavSection === "health" && (
            <div className="space-y-6 animate-fade-in">
              <ArchitectureHealthSection
                brief={brief}
                evidenceSummary={evidenceSummary}
                storedHealth={storedHealth}
                storedInsights={insights}
                onNavigateToTopology={() => handleSelectNavSection("topology")}
                onLocateInGraph={handleLocateInGraph}
              />
            </div>
          )}

          {/* =========================================================
              DESTINATION 4: CAPABILITIES
              Concrete repository-specific behaviors & domain grouping
              ========================================================= */}
          {activeNavSection === "capabilities" && (
            <div className="space-y-6 animate-fade-in">
              <CapabilityIndex
                capabilities={brief.capabilities}
                areas={brief.conceptualMap.areas}
                onInspectArea={handleInspectAreaInMap}
              />
            </div>
          )}

          {/* =========================================================
              DESTINATION 5: READING GUIDE
              Complete chronological tour through important files
              ========================================================= */}
          {activeNavSection === "reading" && (
            <div className="space-y-6 animate-fade-in">
              <GuidedReadingTimeline
                steps={brief.guidedTour}
                owner={brief.owner}
                repo={brief.repo}
                commitSha={brief.commitSha}
              />
            </div>
          )}

          {/* =========================================================
              DESTINATION 6: DEPENDENCIES & STRUCTURE
              Runtime/dev packages, entrypoints, scripts & directory hierarchy
              ========================================================= */}
          {activeNavSection === "dependencies" && (
            <div className="space-y-6 animate-fade-in">
              <TechnicalOverviewHero
                overview={brief.technicalOverview}
                evidenceSummary={evidenceSummary}
                repoOwner={brief.owner}
                repoName={brief.repo}
                commitSha={brief.commitSha}
                showHeader={false}
                defaultTab="dependencies"
                onNavigateDestination={(dest) => handleSelectNavSection(dest as DestinationId)}
              />
            </div>
          )}

          {/* =========================================================
              DESTINATION 7: DEEP TOPOLOGY
              Specialized structural visual model adapted to repo category
              ========================================================= */}
          {activeNavSection === "topology" && (
            <div className="space-y-6 animate-fade-in">
              <AdaptiveVisualModel
                areas={brief.conceptualMap.areas}
                relationships={brief.conceptualMap.relationships}
                projectCategory={brief.technicalOverview.projectCategory}
                evidenceMap={brief.evidenceMap}
                commitSha={brief.commitSha}
                owner={brief.owner}
                repo={brief.repo}
              />
            </div>
          )}

          {/* =========================================================
              DESTINATION 8: RAW ENTITIES (ADVANCED)
              Detailed AST normalized entities table with filter & search
              ========================================================= */}
          {activeNavSection === "entities" && (
            <div className="space-y-6 animate-fade-in">
              <RawEntitiesExplorer
                entities={entities}
                repoUrl={brief.repoUrl}
                commitSha={brief.commitSha}
              />
            </div>
          )}
        </main>
      </div>

      {/* Global Command Palette Omnibar (Milestone 9 Integration) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        graph={graph || null}
        modules={modules}
        insights={insights}
        onSelectNode={handleLocateInGraph}
        onSelectModule={(mod) => {
          setFocusedNodeId(mod);
          handleSelectNavSection("explorer", "modules");
        }}
        onSelectTab={(tab) => {
          if (tab === "overview") handleSelectNavSection("overview");
          else if (tab === "graph") handleSelectNavSection("explorer", "graph");
          else if (tab === "modules") handleSelectNavSection("explorer", "modules");
          else if (tab === "insights") handleSelectNavSection("health");
          else if (tab === "entities") handleSelectNavSection("entities");
        }}
        onTriggerAnalysis={onRefresh}
      />
    </div>
  );
}
