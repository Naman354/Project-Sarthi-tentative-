"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Project } from "../types/project";
import {
  FolderIcon,
  GitBranchIcon,
  ExternalLinkIcon,
  TrashIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "./Icons";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => Promise<void>;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formattedDate = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <GitBranchIcon className="w-3 h-3" />
                  {project.defaultBranch}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <CalendarIcon className="w-3 h-3" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Action */}
          <div className="relative">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 animate-fadeIn">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="text-[11px] font-bold px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Delete project"
                aria-label={`Delete ${project.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 min-h-[32px]">
          {project.description || "No description provided."}
        </p>

        {/* GitHub Repository Link */}
        <div className="mb-4">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40 px-2.5 py-1 rounded-lg truncate max-w-full"
          >
            <span className="truncate">{project.githubUrl.replace("https://github.com/", "")}</span>
            <ExternalLinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {project.lastAnalysis ? "Analyzed" : "Ready for Milestone 4"}
        </span>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
        >
          <span>View Details</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
