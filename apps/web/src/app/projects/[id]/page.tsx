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
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "route":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "model":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "component":
      case "page":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "doc":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[50vh]">
        <h2 className="text-lg font-bold text-rose-500 mb-2">Project Not Found</h2>
        <p className="text-xs text-zinc-500 mb-6">
          {actionError || "The requested project could not be found."}
        </p>
        <Link
          href="/projects"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
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
    : null;

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link
          href="/projects"
          className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          Projects
        </Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{project.name}</span>
      </div>

      {/* Error Alert Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
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
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <FolderIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {project.name}
                </h1>
                {isCloned ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Synchronized &amp; Analyzed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending Analysis
                  </span>
                )}
                {health && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      health.status === "healthy"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : health.status === "warning"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}
                  >
                    Health: {health.overallScore}/100
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
                {project.description || "No project description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start flex-wrap">
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer shadow-xs"
              title="Global Omnibar Search (Ctrl+K)"
            >
              <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Omnibar</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600">
                Ctrl+K
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Analyzing Codebase..." : "Re-run Analysis"}</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || analyzing}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </div>

        {/* Repository Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              GitHub Repository
            </span>
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-full"
            >
              <span className="truncate">
                {project.githubUrl.replace("https://github.com/", "")}
              </span>
              <ExternalLinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Active Branch &amp; Commit
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 truncate">
              <GitBranchIcon className="w-3.5 h-3.5 text-indigo-500" />
              {metadata?.branch || project.defaultBranch}
              {metadata?.commitHash && (
                <span className="text-zinc-400 text-[11px]">
                  @ {metadata.commitHash.slice(0, 7)}
                </span>
              )}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Last Analysis
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
              {formattedLastAnalysis || "Not yet analyzed"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Stack • Created {formattedCreatedDate}
            </span>
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              {project.framework || metadata?.detectedFramework || "Express / Node.js"} •{" "}
              {project.language || "TypeScript"}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <CompassIcon className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("graph")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "graph"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <ActivityIcon className="w-4 h-4" />
          <span>Interactive Graph</span>
          {graph && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-white">
              {graph.stats.totalNodes}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("modules")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "modules"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <LayersIcon className="w-4 h-4" />
          <span>Module Explorer</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-white">
            {modules.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("insights")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "insights"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Insights &amp; Health</span>
          {insights.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">
              {insights.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("entities")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "entities"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          }`}
        >
          <CodeIcon className="w-4 h-4" />
          <span>Raw Entities</span>
          {parseResult && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-white">
              {parseResult.entities.length}
            </span>
          )}
        </button>
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
            <div className="p-12 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <ActivityIcon className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Graph Not Generated
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Trigger repository analysis to construct the architectural dependency graph.
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
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
        <InsightsTab insights={insights} health={health} onLocateInGraph={handleFocusNodeInGraph} />
      )}

      {/* Tab 5: Raw Normalized Entities Explorer */}
      {activeTab === "entities" && (
        <div className="space-y-6 animate-fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "module", "route", "service", "model", "component", "doc"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedTypeFilter === t
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs w-full sm:w-64">
              <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search raw entities..."
                value={entitySearchQuery}
                onChange={(e) => setEntitySearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 w-full"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Entity Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Source File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredEntities.map((ent, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-zinc-800 dark:text-zinc-200">
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
                      <td className="py-3 px-4 font-mono text-zinc-500 text-[11px] truncate max-w-xs">
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
    </div>
  );
}
