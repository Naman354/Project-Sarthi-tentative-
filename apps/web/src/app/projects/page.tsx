"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { fetchProjects, deleteProject } from "../../lib/project";
import type { Project } from "../../types/project";
import ProjectCard from "../../components/ProjectCard";
import CreateProjectModal from "../../components/CreateProjectModal";
import { FolderIcon, PlusIcon, SearchIcon, SparklesIcon, UserIcon } from "../../components/Icons";

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refreshProjects = async () => {
    try {
      const res = await fetchProjects();
      if (res.success && res.data?.projects) {
        setProjects(res.data.projects);
      } else {
        setFetchError(res.message || "Failed to load projects");
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error loading projects");
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
  };

  // Filter projects by search query
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

  // Guest State
  if (!authLoading && !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
          <UserIcon className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Sign in to manage projects
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mb-6">
          Every project belongs to an authenticated developer. Sign in or create an account to view
          and connect repositories.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-900 mb-2">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Milestone 3 • Project Management Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Your Software Projects
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Connect repositories to generate interactive graphs and architecture summaries.
          </p>
        </div>

        <button
          id="connect-project-top-btn"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            id="projects-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or repositories..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        {/* Counter Badge */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 self-end sm:self-auto">
          <span>
            Showing{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">{filteredProjects.length}</strong>{" "}
            of <strong className="text-zinc-800 dark:text-zinc-200">{projects.length}</strong>{" "}
            projects
          </span>
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 animate-pulse"
            />
          ))}
        </div>
      ) : fetchError ? (
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 text-center">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{fetchError}</p>
          <button
            type="button"
            onClick={refreshProjects}
            className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20 text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <FolderIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            No projects connected yet
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
            Connect any public GitHub repository to start building your interactive Project Graph.
          </p>
          <button
            id="empty-state-connect-btn"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Connect First Project</span>
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 text-xs sm:text-sm">
          No projects matched &quot;{searchQuery}&quot;
        </div>
      ) : (
        /* Projects Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
}
