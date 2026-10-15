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
  SparklesIcon,
} from "./Icons";
import { TechLogo } from "./TechIcons";

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

  const repoPath = project.githubUrl.replace("https://github.com/", "");

  return (
    <div
      className="group rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      <div className="space-y-4">
        {/* Top Header: Identity & Delete Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                border: "1px solid rgba(53,208,195,0.3)",
                color: "var(--teal-bright)",
              }}
            >
              {project.language ? (
                <TechLogo name={project.language} className="w-5 h-5" />
              ) : (
                <FolderIcon className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h3
                className="text-base sm:text-lg font-bold tracking-tight truncate group-hover:text-[var(--teal-bright)] transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="inline-flex items-center gap-1 text-xs font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <GitBranchIcon className="w-3.5 h-3.5" />
                  <span>{project.defaultBranch}</span>
                </span>
                <span style={{ color: "var(--border-strong)" }}>•</span>
                <span
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Delete Action with In-place Confirmation */}
          <div className="relative shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="text-xs font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "var(--danger)", color: "#fff" }}
                >
                  {isDeleting ? "Deleting..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
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
                className="p-2 rounded-lg transition-colors cursor-pointer hover:text-rose-400"
                style={{
                  color: "var(--text-muted)",
                }}
                title="Delete project"
                aria-label={`Delete ${project.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Description - natural height without bloated min-height */}
        {project.description && (
          <p
            className="text-xs sm:text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {project.description}
          </p>
        )}

        {/* Repository Permalink */}
        <div className="pt-0.5">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg transition-colors truncate max-w-full group/link"
            style={{
              backgroundColor: "var(--bg-workspace)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <span className="truncate group-hover/link:text-white">{repoPath}</span>
            <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover/link:opacity-100" />
          </a>
        </div>
      </div>

      {/* Footer Controls & Distinct Navigation Actions */}
      <div
        className="pt-3.5 mt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {project.lastAnalysis ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(85,184,121,0.12)",
                color: "var(--accent-green)",
                border: "1px solid rgba(85,184,121,0.3)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Synchronized</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(244,176,79,0.12)",
                color: "var(--accent-amber)",
                border: "1px solid rgba(244,176,79,0.3)",
              }}
            >
              <span>Pending Sync</span>
            </span>
          )}

          {project.language && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {project.language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href={`/?project=${encodeURIComponent(project.id)}&repo=${encodeURIComponent(project.githubUrl)}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs hover:brightness-110"
            style={{
              backgroundColor: "var(--teal-primary)",
              color: "var(--text-primary)",
            }}
            title="Open repository in unified explorer"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Open in Explorer</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
