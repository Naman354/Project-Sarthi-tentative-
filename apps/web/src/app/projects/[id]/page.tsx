"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchProjectStatus, triggerProjectAnalysis, deleteProject } from "../../../lib/project";
import type {
  Project,
  Analysis,
  RepositoryMetadata,
  ParserManagerResult,
  NormalizedEntity,
} from "../../../types/project";
import {
  FolderIcon,
  GitBranchIcon,
  ExternalLinkIcon,
  CalendarIcon,
  TrashIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CodeIcon,
  ClockIcon,
  LayersIcon,
  DatabaseIcon,
  FileTextIcon,
  RouteIcon,
  SearchIcon,
} from "../../../components/Icons";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.["id"] as string;

  const [project, setProject] = useState<Project | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [metadata, setMetadata] = useState<RepositoryMetadata | null>(null);
  const [parseResult, setParseResult] = useState<ParserManagerResult | null>(null);
  const [isCloned, setIsCloned] = useState(false);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Filter state for Normalized Entities Explorer
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [entitySearchQuery, setEntitySearchQuery] = useState<string>("");

  const loadStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetchProjectStatus(projectId);
      if (res.success && res.data) {
        setProject(res.data.project);
        setLatestAnalysis(res.data.latestAnalysis);
        setIsCloned(res.data.isCloned);
        setMetadata(res.data.metadata);
        if (res.data.parseResult) {
          setParseResult(res.data.parseResult);
        }
      } else {
        setActionError(res.message || "Failed to load project status");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error fetching project");
    }
  }, [projectId]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await loadStatus();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadStatus]);

  const handleAnalyze = async () => {
    setActionError(null);
    setAnalyzing(true);
    try {
      const res = await triggerProjectAnalysis(projectId);
      if (res.success && res.data) {
        setProject(res.data.project);
        setLatestAnalysis(res.data.analysis);
        setMetadata(res.data.metadata);
        setIsCloned(true);
        if (res.data.parseResult) {
          setParseResult(res.data.parseResult);
        }
      } else {
        setActionError(res.message || "Repository synchronization failed");
        await loadStatus();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Analysis request failed");
      await loadStatus();
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

  const copyCommitHash = () => {
    if (metadata?.commitHash) {
      navigator.clipboard.writeText(metadata.commitHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  // Filtered Normalized Entities
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading project context...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
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
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Project Overview Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm mb-8">
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
                    Synchronized &amp; Parsed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending Clone
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                {project.description || "No project description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start flex-wrap">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>
                {analyzing
                  ? "Parsing Codebase..."
                  : isCloned
                    ? "Re-parse & Analyze"
                    : "Analyze Repository"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || analyzing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </div>

        {/* Repository Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
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

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Active Branch
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
              <GitBranchIcon className="w-3.5 h-3.5 text-indigo-500" />
              {metadata?.branch || project.defaultBranch}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Last Analysis
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
              {formattedLastAnalysis || "Not yet analyzed"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Created On
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
              {formattedCreatedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Milestone 5: Normalized Parser Results & Architecture Workbench */}
      {isCloned && (
        <div className="space-y-8">
          {/* Parser Engine Statistics KPI Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Parser Engine Architecture Summary
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Static analysis parsed normalized entities without executing repository code.
                </p>
              </div>
              {parseResult && (
                <span className="text-[11px] font-mono text-zinc-400 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  Parsed in {parseResult.stats.durationMs}ms
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                  <LayersIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Modules</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {parseResult?.stats.modulesCount ?? 0}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">Route domains</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <RouteIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Routes</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {parseResult?.stats.routesCount ?? 0}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">API endpoints</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                  <DatabaseIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Models</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {parseResult?.stats.modelsCount ?? 0}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">Database schemas</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                  <CodeIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Components</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {parseResult?.stats.componentsCount ?? 0}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">UI &amp; Pages</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400">
                  <FileTextIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Docs</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {parseResult?.stats.docsCount ?? 0}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">Markdown guides</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Relationships</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  {parseResult?.stats.totalRelationships ?? 0}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">Graph connections</span>
              </div>
            </div>
          </div>

          {/* Interactive Normalized Entities Explorer */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Normalized Entities Explorer
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Framework-independent representation ready for graph construction.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter entities..."
                  value={entitySearchQuery}
                  onChange={(e) => setEntitySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar border-b border-zinc-100 dark:border-zinc-800">
              {[
                { id: "all", label: "All Entities", count: parseResult?.stats.totalEntities ?? 0 },
                { id: "module", label: "Modules", count: parseResult?.stats.modulesCount ?? 0 },
                { id: "route", label: "Routes", count: parseResult?.stats.routesCount ?? 0 },
                { id: "model", label: "Models", count: parseResult?.stats.modelsCount ?? 0 },
                {
                  id: "component",
                  label: "Components & Pages",
                  count: parseResult?.stats.componentsCount ?? 0,
                },
                { id: "doc", label: "Documentation", count: parseResult?.stats.docsCount ?? 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedTypeFilter === tab.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedTypeFilter === tab.id
                        ? "bg-indigo-700/60 text-white"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Entities List */}
            <div className="pt-4 divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[460px] overflow-y-auto">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((entity: NormalizedEntity) => (
                  <div
                    key={entity.id}
                    className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border flex-shrink-0 ${getEntityBadgeStyle(
                          entity.type
                        )}`}
                      >
                        {entity.type}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100">
                          {entity.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {entity.filePath}
                        </div>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                      {entity.metadata["httpMethod"] ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {String(entity.metadata["httpMethod"])}
                        </span>
                      ) : null}

                      {entity.metadata["tableName"] ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          table: {String(entity.metadata["tableName"])}
                        </span>
                      ) : null}

                      {entity.metadata["headingsCount"] ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          {String(entity.metadata["headingsCount"])} sections
                        </span>
                      ) : null}

                      <span className="text-[10px] font-mono text-zinc-400">{entity.id}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">
                  {entitySearchQuery
                    ? `No entities matching "${entitySearchQuery}".`
                    : "No entities found for the selected category."}
                </div>
              )}
            </div>
          </div>

          {/* Git Commit & Workspace Footprint */}
          {metadata && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Synchronized Git Commit
                    </span>
                    <button
                      type="button"
                      onClick={copyCommitHash}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors"
                    >
                      {copiedHash
                        ? "Copied!"
                        : metadata.commitHash
                          ? metadata.commitHash.slice(0, 7)
                          : "HEAD"}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {metadata.commitMessage || "No commit message available"}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Author: {metadata.commitAuthor || "Repository"}</span>
                  <span>{formatFileSize(metadata.totalSizeBytes)} on disk</span>
                </div>
              </div>

              {latestAnalysis && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Parser Engine Activity
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {latestAnalysis.parserVersion || "v1.0.0-m5"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono leading-relaxed line-clamp-3">
                      {latestAnalysis.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Duration: {latestAnalysis.analysisDuration ?? 0}s</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Ingestion Complete
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State / Not Yet Analyzed */}
      {!isCloned && (
        <div className="rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 p-8 sm:p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30">
            <RefreshIcon className={`w-8 h-8 ${analyzing ? "animate-spin" : ""}`} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Repository Awaiting Static Analysis
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
            Click <strong>Analyze Repository</strong> to clone the repository and run the AST parser
            engine across Express routes, React components, Prisma schemas, and Markdown docs.
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshIcon className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
            <span>{analyzing ? "Parsing Codebase..." : "Analyze Repository"}</span>
          </button>
        </div>
      )}

      {/* Next Milestone Banner (Milestone 6 - Graph Builder) */}
      <div className="mt-8 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/10 dark:bg-indigo-950/10 p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <LayersIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Up Next: Milestone 6
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              Graph Builder — Transforming Normalized Entities &amp; Edges into the Persistent
              Project Graph
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-zinc-400">Normalized Entities Ready</span>
      </div>
    </div>
  );
}
