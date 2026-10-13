"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchProjectStatus,
  triggerProjectAnalysis,
  deleteProject,
  fetchProjectGraph,
  fetchProjectModules,
  fetchProjectHealth,
  fetchProjectInsights,
  fetchResumeSession,
} from "../../../lib/project";
import type {
  Project,
  Analysis,
  RepositoryMetadata,
  ParserManagerResult,
  NormalizedEntity,
  ProjectGraph,
  ModuleSummaryItem,
  ProjectHealthReport,
  InsightItem,
  ResumeSessionBriefing,
} from "../../../types/project";
import {
  FolderIcon,
  GitBranchIcon,
  ExternalLinkIcon,
  TrashIcon,
  RefreshIcon,
  AlertCircleIcon,
  CodeIcon,
  ClockIcon,
  LayersIcon,
  SearchIcon,
  ActivityIcon,
  SparklesIcon,
  CompassIcon,
} from "../../../components/Icons";
import { TechLogo } from "../../../components/TechIcons";
import { OverviewTab } from "../../../components/overview/OverviewTab";
import { ProjectGraphViewer } from "../../../components/graph/ProjectGraphViewer";
import { ModuleExplorerTab } from "../../../components/modules/ModuleExplorerTab";
import { InsightsTab } from "../../../components/insights/InsightsTab";
import { AnalysisProgressModal } from "../../../components/common/AnalysisProgressModal";
import { CommandPalette } from "../../../components/common/CommandPalette";
import { ProjectDetailSkeleton } from "../../../components/common/Skeletons";

type ActiveTab = "overview" | "graph" | "modules" | "insights" | "entities";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.["id"] as string;

  // Project & status state
  const [project, setProject] = useState<Project | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [metadata, setMetadata] = useState<RepositoryMetadata | null>(null);
  const [parseResult, setParseResult] = useState<ParserManagerResult | null>(null);
  const [isCloned, setIsCloned] = useState(false);

  // Milestone 8 Visualization states
  const [graph, setGraph] = useState<ProjectGraph | null>(null);
  const [modules, setModules] = useState<ModuleSummaryItem[]>([]);
  const [health, setHealth] = useState<ProjectHealthReport | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [resume, setResume] = useState<ResumeSessionBriefing | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [graphFocusNodeId, setGraphFocusNodeId] = useState<string | null>(null);

  // Milestone 9 Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state for Normalized Entities Explorer (Tab 5)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [entitySearchQuery, setEntitySearchQuery] = useState<string>("");

  // Milestone 9: Global Omnibar hotkey (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadAllData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [statusRes, graphRes, modulesRes, healthRes, insightsRes, resumeRes] =
        await Promise.allSettled([
          fetchProjectStatus(projectId),
          fetchProjectGraph(projectId),
          fetchProjectModules(projectId),
          fetchProjectHealth(projectId),
          fetchProjectInsights(projectId),
          fetchResumeSession(projectId),
        ]);

      if (statusRes.status === "fulfilled" && statusRes.value.success && statusRes.value.data) {
        setProject(statusRes.value.data.project);
        setLatestAnalysis(statusRes.value.data.latestAnalysis);
        setIsCloned(statusRes.value.data.isCloned);
        setMetadata(statusRes.value.data.metadata);
        if (statusRes.value.data.parseResult) {
          setParseResult(statusRes.value.data.parseResult);
        }
      }

      if (graphRes.status === "fulfilled" && graphRes.value.success && graphRes.value.data) {
        setGraph(graphRes.value.data);
      }

      if (modulesRes.status === "fulfilled" && modulesRes.value.success && modulesRes.value.data) {
        setModules(modulesRes.value.data.modules || []);
      }

      if (healthRes.status === "fulfilled" && healthRes.value.success && healthRes.value.data) {
        setHealth(healthRes.value.data);
      }

      if (
        insightsRes.status === "fulfilled" &&
        insightsRes.value.success &&
        insightsRes.value.data
      ) {
        setInsights(insightsRes.value.data.insights || []);
      }

      if (resumeRes.status === "fulfilled" && resumeRes.value.success && resumeRes.value.data) {
        setResume(resumeRes.value.data);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error fetching project context");
    }
  }, [projectId]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await loadAllData();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadAllData]);

  const handleAnalyze = async () => {
    setActionError(null);
    setAnalyzing(true);
    setAnalysisModalOpen(true);
    setAnalysisComplete(false);

    try {
      const res = await triggerProjectAnalysis(projectId);
      if (res.success && res.data) {
        setAnalysisComplete(true);
        await loadAllData();
        setTimeout(() => {
          setAnalysisModalOpen(false);
        }, 1500);
      } else {
        setActionError(res.message || "Repository analysis failed");
        setAnalysisModalOpen(false);
        await loadAllData();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Analysis request failed");
      setAnalysisModalOpen(false);
      await loadAllData();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setIsDeleting(true);
    try {
      const res = await deleteProject(projectId);
      if (res.success) {
        router.push("/projects");
      } else {
        alert(res.message || "Failed to delete project");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Cross-tab navigation helpers
  const handleFocusNodeInGraph = (nodeNameOrId: string) => {
    if (!graph) return;
    const matchedNode = graph.nodes.find(
      (n) =>
        n.id === nodeNameOrId ||
        n.name.toLowerCase() === nodeNameOrId.toLowerCase() ||
        n.entityId.toLowerCase().includes(nodeNameOrId.toLowerCase())
    );
    if (matchedNode) {
      setGraphFocusNodeId(matchedNode.id);
    }
    setActiveTab("graph");
  };

  // Filtered Normalized Entities for Tab 5
  const filteredEntities = useMemo(() => {
    if (!parseResult?.entities) return [];
    return parseResult.entities.filter((entity: NormalizedEntity) => {
      const matchesType =
        selectedTypeFilter === "all" ||
        (selectedTypeFilter === "component"
          ? entity.type === "component" || entity.type === "page"
          : entity.type === selectedTypeFilter);

      const q = entitySearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        entity.name.toLowerCase().includes(q) ||
        entity.filePath.toLowerCase().includes(q) ||
        entity.type.toLowerCase().includes(q);

      return matchesType && matchesQuery;
    });
  }, [parseResult, selectedTypeFilter, entitySearchQuery]);

  const getEntityBadgeStyle = (type: string) => {
    switch (type) {
      case "module":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "route":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "model":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "component":
      case "page":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "doc":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[50vh]"
        style={{ color: "var(--text-primary)" }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--danger)" }}>
          Project Not Found
        </h2>
        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          {actionError || "The requested project could not be found."}
        </p>
        <Link
          href="/projects"
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md"
          style={{
            backgroundColor: "var(--teal-primary)",
            color: "var(--text-primary)",
          }}
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const formattedCreatedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedLastAnalysis = project.lastAnalysis
    ? new Date(project.lastAnalysis).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : `Created ${formattedCreatedDate}`;

  return (
    <div
      className="flex-1 flex flex-col w-full relative min-h-screen"
      style={{ backgroundColor: "var(--bg-workspace)" }}
    >
      {/* Subtle canvas texture */}
      <div className="absolute inset-0 canvas-texture opacity-35 pointer-events-none" />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Link
            href="/projects"
            className="hover:text-white transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            Projects
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {project.name}
          </span>
        </div>

        {/* Error Alert Banner */}
        {actionError && (
          <div
            className="p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fade-in"
            style={{
              backgroundColor: "rgba(224,92,92,0.1)",
              border: "1px solid rgba(224,92,92,0.25)",
              color: "var(--danger)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-xs font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Project Header Banner */}
        <div
          className="rounded-2xl p-6 sm:p-7 shadow-lg space-y-6"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  border: "1px solid rgba(53,208,195,0.3)",
                  color: "var(--teal-bright)",
                }}
              >
                {project.language ? (
                  <TechLogo name={project.language} className="w-7 h-7" />
                ) : (
                  <FolderIcon className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {project.name}
                  </h1>
                  {isCloned ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(85,184,121,0.12)",
                        color: "var(--accent-green)",
                        border: "1px solid rgba(85,184,121,0.3)",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Synchronized &amp; Analyzed
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(244,176,79,0.12)",
                        color: "var(--accent-amber)",
                        border: "1px solid rgba(244,176,79,0.3)",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pending Analysis
                    </span>
                  )}
                  {health && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor:
                          health.status === "healthy"
                            ? "rgba(85,184,121,0.12)"
                            : health.status === "warning"
                              ? "rgba(244,176,79,0.12)"
                              : "rgba(224,92,92,0.12)",
                        color:
                          health.status === "healthy"
                            ? "var(--accent-green)"
                            : health.status === "warning"
                              ? "var(--accent-amber)"
                              : "var(--danger)",
                        border: `1px solid ${
                          health.status === "healthy"
                            ? "rgba(85,184,121,0.3)"
                            : health.status === "warning"
                              ? "rgba(244,176,79,0.3)"
                              : "rgba(224,92,92,0.3)"
                        }`,
                      }}
                    >
                      Health: {health.overallScore}/100
                    </span>
                  )}
                </div>
                <p
                  className="text-xs sm:text-sm leading-relaxed max-w-2xl"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {project.description || "No project description provided."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start flex-wrap">
              {/* Primary: Quick Switch to Main Explorer */}
              <Link
                href={`/?repo=${encodeURIComponent(project.githubUrl)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md hover:brightness-110 cursor-pointer"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "var(--text-primary)",
                }}
                title="Open in Unified Repository Explorer"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Open in Explorer</span>
              </Link>

              {/* Omnibar Search */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
                title="Global Omnibar Search (Ctrl+K)"
              >
                <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Omnibar</span>
                <kbd
                  className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  Ctrl+K
                </kbd>
              </button>

              {/* Re-run Analysis */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  border: "1px solid rgba(53,208,195,0.3)",
                  color: "var(--teal-bright)",
                }}
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
                <span>{analyzing ? "Analyzing..." : "Re-run Analysis"}</span>
              </button>

              {/* Delete Project */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || analyzing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 hover:text-rose-400"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                }}
                title="Delete project"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>

          {/* Repository Metadata Row - Clean & Information Dense */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                GitHub Repository
              </span>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium truncate max-w-full hover:underline"
                style={{ color: "var(--teal-bright)" }}
              >
                <span className="truncate">
                  {project.githubUrl.replace("https://github.com/", "")}
                </span>
                <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </a>
            </div>

            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Active Branch &amp; Commit
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                <GitBranchIcon className="w-3.5 h-3.5 text-teal-400" />
                <span>{metadata?.branch || project.defaultBranch}</span>
                {metadata?.commitHash && (
                  <span style={{ color: "var(--text-muted)" }} className="text-[11px]">
                    @{metadata.commitHash.slice(0, 7)}
                  </span>
                )}
              </span>
            </div>

            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Last Analysis
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>{formattedLastAnalysis || "Not yet analyzed"}</span>
              </span>
            </div>

            <div
              className="p-3 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Ecosystem &amp; Toolchain
              </span>
              <span
                className="text-xs font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {project.framework || metadata?.detectedFramework || "Express / Node.js"} •{" "}
                {project.language || "TypeScript"}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div
          className="flex items-center gap-2 border-b overflow-x-auto pb-1"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {[
            { id: "overview" as const, label: "Overview", icon: CompassIcon, count: null },
            {
              id: "graph" as const,
              label: "Interactive Graph",
              icon: ActivityIcon,
              count: graph?.stats.totalNodes ?? null,
            },
            {
              id: "modules" as const,
              label: "Module Explorer",
              icon: LayersIcon,
              count: modules.length,
            },
            {
              id: "insights" as const,
              label: "Insights & Health",
              icon: SparklesIcon,
              count: insights.length,
            },
            {
              id: "entities" as const,
              label: "Raw Entities",
              icon: CodeIcon,
              count: parseResult?.entities.length ?? null,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? "rgba(15,138,131,0.16)" : "transparent",
                  color: isActive ? "var(--teal-bright)" : "var(--text-secondary)",
                  border: isActive
                    ? "1px solid rgba(53,208,195,0.35)"
                    : "1px solid transparent",
                }}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(53,208,195,0.2)"
                        : "rgba(255,255,255,0.06)",
                      color: isActive ? "var(--teal-bright)" : "var(--text-muted)",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <OverviewTab
            latestAnalysis={latestAnalysis}
            health={health}
            insights={insights}
            resume={resume}
            modules={modules}
            stats={graph?.stats || null}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab 2: Interactive Graph Viewer */}
        {activeTab === "graph" && (
          <div className="space-y-4">
            {graph ? (
              <ProjectGraphViewer
                graph={graph}
                modules={modules}
                insights={insights}
                initialSelectedNodeId={graphFocusNodeId}
              />
            ) : (
              <div
                className="p-12 text-center rounded-2xl border space-y-3"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <ActivityIcon className="w-12 h-12 mx-auto mb-2 text-zinc-500" />
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Graph Not Generated
                </h3>
                <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
                  Trigger repository analysis to construct the architectural dependency graph.
                </p>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                  style={{
                    backgroundColor: "var(--teal-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  Run Analysis Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Module Explorer */}
        {activeTab === "modules" && (
          <ModuleExplorerTab
            modules={modules}
            insights={insights}
            onFocusModuleInGraph={handleFocusNodeInGraph}
          />
        )}

        {/* Tab 4: Insights & Health */}
        {activeTab === "insights" && (
          <InsightsTab
            insights={insights}
            health={health}
            onLocateInGraph={handleFocusNodeInGraph}
          />
        )}

        {/* Tab 5: Raw Normalized Entities Explorer */}
        {activeTab === "entities" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-sm"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {["all", "module", "route", "service", "model", "component", "doc"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTypeFilter(t)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer"
                    style={{
                      backgroundColor:
                        selectedTypeFilter === t
                          ? "var(--teal-primary)"
                          : "var(--bg-surface)",
                      color:
                        selectedTypeFilter === t
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      border:
                        selectedTypeFilter === t
                          ? "1px solid var(--teal-bright)"
                          : "1px solid var(--border-subtle)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full sm:w-64"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  borderColor: "var(--border-default)",
                }}
              >
                <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search raw entities..."
                  value={entitySearchQuery}
                  onChange={(e) => setEntitySearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-500"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* Table */}
            <div
              className="rounded-2xl border shadow-sm overflow-hidden"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className="border-b uppercase font-bold text-[10px]"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <tr>
                      <th className="py-3 px-4">Entity Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Source File</th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    {filteredEntities.map((ent, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-white/[0.03]"
                      >
                        <td
                          className="py-3 px-4 font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {ent.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEntityBadgeStyle(
                              ent.type
                            )}`}
                          >
                            {ent.type}
                          </span>
                        </td>
                        <td
                          className="py-3 px-4 font-mono text-[11px] truncate max-w-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {ent.filePath}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Stage Analysis Progress Modal */}
        <AnalysisProgressModal
          isOpen={analysisModalOpen}
          isComplete={analysisComplete}
          error={actionError}
        />

        {/* Global Command Palette Omnibar (Milestone 9) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          graph={graph}
          modules={modules}
          insights={insights}
          onSelectNode={handleFocusNodeInGraph}
          onSelectModule={() => {
            setActiveTab("modules");
          }}
          onSelectTab={setActiveTab}
          onTriggerAnalysis={handleAnalyze}
        />
      </main>
    </div>
  );
}
