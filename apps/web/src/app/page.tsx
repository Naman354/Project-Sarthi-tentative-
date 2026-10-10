"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import type { ExploreResponse } from "../types/brief";
import ProjectBriefView from "../components/brief/ProjectBriefView";
import RecentRepositoriesBar, { saveRecentRepo } from "../components/brief/RecentRepositoriesBar";
import {
  SparklesIcon,
  NetworkGraphIcon,
  ArrowRightIcon,
  TargetIcon,
  ShieldCheckIcon,
} from "../components/Icons";

const EXAMPLE_REPOS = [
  { label: "Express", url: "https://github.com/expressjs/express", tech: "Node.js" },
  { label: "Flask", url: "https://github.com/pallets/flask", tech: "Python" },
  { label: "mdBook", url: "https://github.com/rust-lang/mdBook", tech: "Rust" },
];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exploreData, setExploreData] = useState<ExploreResponse | null>(null);

  const handleExplore = async (targetUrl?: string, forceRefresh = false) => {
    const urlToAnalyze = (targetUrl || repoUrl).trim();
    if (!urlToAnalyze) {
      setErrorMessage("Please enter a public GitHub repository URL.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      setLoadingStep("Validating public GitHub repository URL...");
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStep("Cloning repository snapshot & extracting commit SHA...");
      const res = await api.post<ExploreResponse>(
        "/public/explore",
        { githubUrl: urlToAnalyze, forceRefresh },
        { skipAuth: true }
      );

      if (!res.success || !res.data) {
        throw new Error(res.message || "Could not analyze repository");
      }

      setLoadingStep("Finalizing evidence-backed Project Brief...");
      await new Promise((r) => setTimeout(r, 200));

      setExploreData(res.data);

      // Save to recent repositories in localStorage
      const brief = res.data.brief;
      saveRecentRepo({
        repoUrl: brief.repoUrl,
        owner: brief.owner,
        repo: brief.repo,
        commitSha: brief.commitSha,
        purpose: brief.purpose,
        primaryLanguage: brief.technicalOverview.primaryLanguage,
        analyzedAt: brief.generatedAt,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleRefresh = () => {
    if (exploreData?.brief?.repoUrl) {
      handleExplore(exploreData.brief.repoUrl, true);
    }
  };

  const handleReset = () => {
    setExploreData(null);
    setRepoUrl("");
    setErrorMessage(null);
  };

  // If a Project Brief is active, show the Project Brief View
  if (exploreData) {
    return (
      <div className="flex flex-col flex-1 items-center px-4 py-8 sm:py-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
        <main className="w-full relative z-10">
          <ProjectBriefView
            brief={exploreData.brief}
            evidenceSummary={exploreData.evidenceSummary}
            onRefresh={handleRefresh}
            onReset={handleReset}
            isRefreshing={isLoading}
          />
        </main>
      </div>
    );
  }

  // Otherwise, render the initial landing exploration journey
  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 sm:py-20 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <main className="w-full max-w-5xl flex flex-col items-center relative z-10 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold backdrop-blur-sm shadow-xs">
            <SparklesIcon className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>Instant Repository Explorer • No Account Required</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
            Understand Any Codebase in{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Five Minutes
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Paste a public GitHub repository to get an evidence-backed{" "}
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Project Brief</span>:
            understand its purpose, discover capabilities, navigate its conceptual structure, and verify claims through source permalinks.
          </p>

          {/* Repository Exploration Input Bar */}
          <div className="w-full max-w-2xl mx-auto pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExplore();
              }}
              className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl border-2 border-indigo-500/30 hover:border-indigo-500/60 focus-within:border-indigo-500 bg-white dark:bg-zinc-900 shadow-xl shadow-indigo-500/10 transition-all"
            >
              <div className="flex items-center gap-2.5 flex-1 w-full pl-3 pr-2 py-2 sm:py-0">
                <svg
                  className="w-5 h-5 text-zinc-400 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>

                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  disabled={isLoading}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Explore Project</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Example Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-zinc-500">
              <span className="text-[11px] font-semibold text-zinc-400">Quick Examples:</span>
              {EXAMPLE_REPOS.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setRepoUrl(ex.url);
                    handleExplore(ex.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-zinc-600 dark:text-zinc-300 transition-colors font-medium cursor-pointer"
                >
                  {ex.label} <span className="opacity-60 text-[10px]">({ex.tech})</span>
                </button>
              ))}
            </div>

            {/* Live Progress State */}
            {isLoading && loadingStep && (
              <div className="mt-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-3 animate-fade-in">
                <svg className="w-4 h-4 animate-spin text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="font-medium">{loadingStep}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-fade-in">
                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recently Explored Repositories from localStorage */}
        <RecentRepositoriesBar
          onSelectRepo={(url) => {
            setRepoUrl(url);
            handleExplore(url);
          }}
        />

        {/* 4 Pillars of Project Sarthi */}
        <div className="w-full pt-4 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              Built for Fast, Evidence-Backed Understanding
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Honest explanations grounded in verified repository files, manifests, and documentation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Pillar 1 */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                5-Minute Project Brief
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Plain-language project purpose and audience. Answers what this software does before asking you to read raw code.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <TargetIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Discovered Capabilities
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Prioritized capabilities labelled as documented, implementation-found, or inferred with source permalinks.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <NetworkGraphIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Conceptual Architecture Map
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Visual parts and relationships summarizing major responsibilities without cluttering the screen with dense nodes.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                Zero-Cost &amp; Verified Evidence
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Powered by Groq&apos;s free tier. All claims link to real commit-pinned files on GitHub, preventing hallucinations.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Authenticated Workspace Link */}
        <div className="pt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
          <span>Looking for the authenticated private workspace?</span>
          <Link
            href="/projects"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Go to Projects Workspace →
          </Link>
        </div>
      </main>
    </div>
  );
}
