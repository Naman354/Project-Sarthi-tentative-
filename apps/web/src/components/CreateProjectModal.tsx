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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{
            backgroundColor: "var(--bg-sidebar)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                border: "1px solid rgba(53,208,195,0.3)",
                color: "var(--teal-bright)",
              }}
            >
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-title"
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Connect GitHub Repository
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Add a new software project for architecture analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer hover:text-white"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs"
              style={{
                backgroundColor: "rgba(224,92,92,0.1)",
                border: "1px solid rgba(224,92,92,0.3)",
                color: "var(--danger)",
              }}
            >
              <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label
              htmlFor="create-project-name"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Project Name <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="create-project-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarthi Core API"
              className="w-full px-3.5 py-2 rounded-xl text-sm placeholder-zinc-500 focus:outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-workspace)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* GitHub URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="create-project-github-url"
                className="block text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                GitHub Repository URL <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              {githubUrl && (
                <span
                  className={`text-[11px] flex items-center gap-1 ${
                    isUrlValid
                      ? "text-[var(--accent-green)] font-medium"
                      : "text-[var(--accent-amber)]"
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
              className="w-full px-3.5 py-2 rounded-xl text-xs font-mono placeholder-zinc-500 focus:outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-workspace)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Default Branch & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label
                htmlFor="create-project-branch"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Default Branch
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                >
                  <GitBranchIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  id="create-project-branch"
                  type="text"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="main"
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono focus:outline-none transition-all"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="create-project-desc"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Description{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(optional)</span>
              </label>
              <input
                id="create-project-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief project context..."
                className="w-full px-3.5 py-2 rounded-xl text-sm placeholder-zinc-500 focus:outline-none transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="pt-4 flex items-center justify-end gap-3 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              Cancel
            </button>
            <button
              id="create-project-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
              style={{
                backgroundColor: "var(--teal-primary)",
                color: "var(--text-primary)",
              }}
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
