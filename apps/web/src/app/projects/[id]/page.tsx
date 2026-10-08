"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchProjectById, deleteProject } from "../../../lib/project";
import type { Project } from "../../../types/project";
import {
  FolderIcon,
  GitBranchIcon,
  ExternalLinkIcon,
  CalendarIcon,
  NetworkGraphIcon,
  TrashIcon,
  ArrowRightIcon,
} from "../../../components/Icons";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.["id"] as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    (async () => {
      try {
        const res = await fetchProjectById(projectId);
        if (isMounted) {
          if (res.success && res.data?.project) {
            setProject(res.data.project);
          } else {
            setError(res.message || "Failed to load project");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error fetching project");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

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

  if (error || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <h2 className="text-lg font-bold text-rose-500 mb-2">Project Not Found</h2>
        <p className="text-xs text-zinc-500 mb-6">
          {error || "The requested project could not be found."}
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

  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

      {/* Project Overview Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <FolderIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                {project.description || "No project description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete Project"}</span>
            </button>
          </div>
        </div>

        {/* Repository Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
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
              Default Branch
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
              <GitBranchIcon className="w-3.5 h-3.5 text-indigo-500" />
              {project.defaultBranch}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Connected Since
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline Preview Card (Milestone 4 Preview) */}
      <div className="rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/30">
            <NetworkGraphIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-1">
              Next Milestone: Repository Integration
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Analysis Pipeline Ready to Connect
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg leading-relaxed">
              In Milestone 4, Project Sarthi will clone this repository to disk, track commit
              hashes, detect frameworks, and initiate the AST parser engine.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-not-allowed flex items-center gap-2 flex-shrink-0"
        >
          <span>Analyze Repository</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
