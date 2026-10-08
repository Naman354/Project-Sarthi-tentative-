"use client";

import React, { useState } from "react";
import { createProject } from "../lib/project";
import type { Project } from "../types/project";
import { FolderIcon, XMarkIcon, AlertCircleIcon, CheckCircleIcon, GitBranchIcon } from "./Icons";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/;

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUrlValid = GITHUB_REPO_REGEX.test(githubUrl.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedUrl = githubUrl.trim();

    if (!trimmedName) {
      setError("Please provide a project name.");
      return;
    }
    if (!trimmedUrl) {
      setError("Please provide a GitHub repository URL.");
      return;
    }
    if (!GITHUB_REPO_REGEX.test(trimmedUrl)) {
      setError("Please enter a valid GitHub URL (e.g. https://github.com/owner/repository).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProject({
        name: trimmedName,
        githubUrl: trimmedUrl,
        description: description.trim() || undefined,
        defaultBranch: defaultBranch.trim() || "main",
      });

      if (res.success && res.data?.project) {
        setName("");
        setGithubUrl("");
        setDescription("");
        setDefaultBranch("main");
        onSuccess(res.data.project);
        onClose();
      } else {
        setError(res.message || "Failed to create project");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error creating project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Connect GitHub Repository
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Add a new software project for analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label
              htmlFor="create-project-name"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="create-project-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarthi Core API"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* GitHub URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="create-project-github-url"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                GitHub Repository URL <span className="text-rose-500">*</span>
              </label>
              {githubUrl && (
                <span
                  className={`text-[11px] flex items-center gap-1 ${
                    isUrlValid ? "text-emerald-500 font-medium" : "text-amber-500"
                  }`}
                >
                  {isUrlValid ? (
                    <>
                      <CheckCircleIcon className="w-3.5 h-3.5" /> Valid GitHub format
                    </>
                  ) : (
                    "Needs https://github.com/owner/repo"
                  )}
                </span>
              )}
            </div>
            <input
              id="create-project-github-url"
              type="url"
              required
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm placeholder-zinc-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Default Branch & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label
                htmlFor="create-project-branch"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Default Branch
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <GitBranchIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  id="create-project-branch"
                  type="text"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="main"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="create-project-desc"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Description <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                id="create-project-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief project context..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-project-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                "Connect Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
