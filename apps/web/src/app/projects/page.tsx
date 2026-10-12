"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { fetchProjects, deleteProject } from "../../lib/project";
import type { Project } from "../../types/project";
import ProjectCard from "../../components/ProjectCard";
import CreateProjectModal from "../../components/CreateProjectModal";
import {
  useRecentRepos,
  clearRecentRepos,
} from "../../components/brief/RecentRepositoriesBar";
import { TechLogo } from "../../components/TechIcons";
import {
  FolderIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  ExternalLinkIcon,
} from "../../components/Icons";

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"saved" | "recent">("saved");

  const recentRepos = useRecentRepos();

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const res = await fetchProjects();
      if (res.success && res.data?.projects) {
        setProjects(res.data.projects);
        setFetchError(null);
      } else {
        setFetchError(res.message || "Failed to load projects");
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error loading projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    if (!authLoading && user) {
      async function fetchUserProjects() {
        try {
          const res = await fetchProjects();
          if (!ignore) {
            if (res.success && res.data?.projects) {
              setProjects(res.data.projects);
              setFetchError(null);
            } else {
              setFetchError(res.message || "Failed to load projects");
            }
            setLoading(false);
          }
        } catch (err) {
          if (!ignore) {
            setFetchError(err instanceof Error ? err.message : "Error loading projects");
            setLoading(false);
          }
        }
      }

      void fetchUserProjects();
    } else if (!authLoading && !user) {
      setTimeout(() => {
        if (!ignore) {
          setLoading(false);
          setActiveTab("recent");
        }
      }, 0);
    }

    return () => {
      ignore = true;
    };
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    const res = await deleteProject(id);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(res.message || "Failed to delete project");
    }
  };

  const handleCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveTab("saved");
  };

  // Filter saved projects by search query
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.githubUrl.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // Filter recent repos by search query
  const filteredRecentRepos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return recentRepos;
    return recentRepos.filter(
      (r) =>
        r.repo.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.repoUrl.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q)
    );
  }, [recentRepos, searchQuery]);

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-app)" }}
    >
      {/* Canvas Grid Texture */}
      <div className="absolute inset-0 canvas-texture opacity-30 pointer-events-none" />

      <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10 space-y-8 flex-1">
        {/* Top Header Banner */}
        <div
          className="p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 6px 28px rgba(0,0,0,0.45)",
          }}
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "rgba(15,138,131,0.12)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              <FolderIcon className="w-3.5 h-3.5" />
              <span>Workspace Hub · Find &amp; Manage Repositories</span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Projects &amp; Explored Repositories
            </h1>

            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Revisit codebases you have previously analyzed in Sarthi, manage connected repositories,
              and jump straight back into the interactive explorer.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {user ? (
              <button
                id="connect-project-top-btn"
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "var(--text-primary)",
                }}
              >
                <PlusIcon className="w-4 h-4" />
                <span>Connect Repository</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In to Save Projects</span>
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors hover:text-white"
              style={{
                backgroundColor: "var(--bg-workspace)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Explore Public URL</span>
            </Link>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div
            className="flex items-center p-1 rounded-xl self-start"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            {user && (
              <button
                type="button"
                id="tab-saved-projects-btn"
                onClick={() => setActiveTab("saved")}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
                style={{
                  backgroundColor: activeTab === "saved" ? "var(--teal-primary)" : "transparent",
                  color: activeTab === "saved" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: activeTab === "saved" ? "0 2px 10px rgba(15,138,131,0.4)" : "none",
                }}
              >
                <FolderIcon className="w-4 h-4" />
                <span>Saved Projects</span>
                <span
                  className="px-2 py-0.2 rounded-full text-xs font-mono"
                  style={{
                    backgroundColor:
                      activeTab === "saved" ? "rgba(255,255,255,0.2)" : "var(--bg-workspace)",
                    color: activeTab === "saved" ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {projects.length}
                </span>
              </button>
            )}

            <button
              type="button"
              id="tab-recent-repos-btn"
              onClick={() => setActiveTab("recent")}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: activeTab === "recent" ? "var(--teal-primary)" : "transparent",
                color: activeTab === "recent" ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: activeTab === "recent" ? "0 2px 10px rgba(15,138,131,0.4)" : "none",
              }}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Recently Explored</span>
              <span
                className="px-2 py-0.2 rounded-full text-xs font-mono"
                style={{
                  backgroundColor:
                    activeTab === "recent" ? "rgba(255,255,255,0.2)" : "var(--bg-workspace)",
                  color: activeTab === "recent" ? "#fff" : "var(--text-muted)",
                }}
              >
                {recentRepos.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            >
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              id="projects-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "saved"
                  ? "Search saved projects..."
                  : "Search recent repositories..."
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Guest Informational Callout (if not signed in) */}
        {!authLoading && !user && (
          <div
            className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
            style={{
              backgroundColor: "rgba(15,138,131,0.06)",
              borderColor: "rgba(53,208,195,0.25)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  color: "var(--teal-bright)",
                }}
              >
                <UserIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  Anonymous Mode Active
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Your recently explored repositories are preserved locally on this device. Create a
                  free account to persist projects across devices, track architecture changes over time,
                  and trigger automated re-syncs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "var(--text-primary)",
                }}
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* TAB 1: SAVED PROJECTS (Authenticated) */}
        {activeTab === "saved" && user && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-56 rounded-2xl"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  />
                ))}
              </div>
            ) : fetchError ? (
              <div
                className="p-8 rounded-2xl text-center space-y-3"
                style={{
                  backgroundColor: "rgba(224,92,92,0.06)",
                  border: "1px solid rgba(224,92,92,0.25)",
                }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--danger)" }}>
                  {fetchError}
                </p>
                <button
                  type="button"
                  onClick={refreshProjects}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  style={{
                    backgroundColor: "var(--bg-workspace)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  Retry Loading
                </button>
              </div>
            ) : projects.length === 0 ? (
              /* Empty Saved State */
              <div
                className="p-12 rounded-3xl text-center space-y-4 flex flex-col items-center justify-center border border-dashed"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: "rgba(15,138,131,0.12)",
                    color: "var(--teal-bright)",
                    border: "1px solid rgba(53,208,195,0.3)",
                  }}
                >
                  <FolderIcon className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h2
                    className="text-lg font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No Saved Projects Yet
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                    Connect any public GitHub repository to save it to your account for persistent
                    analysis and history tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all shadow-md"
                  style={{
                    backgroundColor: "var(--teal-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Connect First Project</span>
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div
                className="p-12 text-center text-xs sm:text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No saved projects matched &quot;{searchQuery}&quot;
              </div>
            ) : (
              /* Saved Projects Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECENTLY EXPLORED REPOSITORIES */}
        {activeTab === "recent" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Showing {filteredRecentRepos.length} of {recentRepos.length} analyzed repositories
              </span>
              {recentRepos.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearRecentRepos()}
                  className="text-xs transition-colors cursor-pointer hover:text-rose-400"
                  style={{ color: "var(--text-muted)" }}
                >
                  Clear history
                </button>
              )}
            </div>

            {recentRepos.length === 0 ? (
              /* Empty Recent State */
              <div
                className="p-12 rounded-3xl text-center space-y-4 flex flex-col items-center justify-center border border-dashed"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(15,138,131,0.12)",
                    color: "var(--teal-bright)",
                    border: "1px solid rgba(53,208,195,0.3)",
                  }}
                >
                  <SparklesIcon className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1">
                  <h2
                    className="text-lg font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No Repositories Explored Yet
                  </h2>
                  <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                    Paste any public GitHub repository on the Explore page to inspect its architecture,
                    modules, and technical overview.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md"
                  style={{
                    backgroundColor: "var(--teal-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>Explore a Repository</span>
                </Link>
              </div>
            ) : filteredRecentRepos.length === 0 ? (
              <div
                className="p-12 text-center text-xs sm:text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No recently explored repositories matched &quot;{searchQuery}&quot;
              </div>
            ) : (
              /* Recent Repositories Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                {filteredRecentRepos.map((item) => (
                  <div
                    key={item.repoUrl}
                    className="p-5 sm:p-6 rounded-2xl flex flex-col justify-between transition-all group"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: "rgba(15,138,131,0.15)",
                              border: "1px solid rgba(53,208,195,0.3)",
                              color: "var(--teal-bright)",
                            }}
                          >
                            <TechLogo name={item.primaryLanguage} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="text-base sm:text-lg font-bold tracking-tight truncate group-hover:text-[var(--teal-bright)] transition-colors"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {item.owner} / {item.repo}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-xs font-mono"
                                style={{ color: "var(--text-muted)" }}
                              >
                                sha: {item.commitSha ? item.commitSha.substring(0, 7) : "HEAD"}
                              </span>
                              <span style={{ color: "var(--border-strong)" }}>•</span>
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {new Date(item.analyzedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Purpose */}
                      <p
                        className="text-xs sm:text-sm leading-relaxed line-clamp-2 min-h-[36px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.purpose}
                      </p>

                      {/* GitHub Link */}
                      <div>
                        <a
                          href={item.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-colors truncate max-w-full"
                          style={{
                            backgroundColor: "var(--bg-workspace)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span className="truncate">{item.owner}/{item.repo}</span>
                          <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                        </a>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      className="pt-4 mt-5 border-t flex items-center justify-between gap-3"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: "var(--bg-workspace)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {item.primaryLanguage}
                      </span>

                      <Link
                        href={`/?repo=${encodeURIComponent(item.repoUrl)}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
                        style={{
                          backgroundColor: "var(--teal-primary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>Open in Explorer</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Connect Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
}
