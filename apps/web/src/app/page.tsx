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

const PILLARS = [
  {
    icon: SparklesIcon,
    color: "var(--teal-bright)",
    bg: "rgba(15,138,131,0.12)",
    border: "rgba(15,138,131,0.25)",
    title: "Technical Overview",
    desc: "Ecosystem facts, detected stack, language breakdown, and structural characteristics grounded in the actual repository manifests.",
  },
  {
    icon: TargetIcon,
    color: "var(--accent-orange)",
    bg: "rgba(242,140,69,0.12)",
    border: "rgba(242,140,69,0.25)",
    title: "Concrete Capabilities",
    desc: "What you can actually accomplish with this project — specific behaviors, jobs, and value it delivers.",
  },
  {
    icon: NetworkGraphIcon,
    color: "var(--accent-blue)",
    bg: "rgba(77,159,216,0.12)",
    border: "rgba(77,159,216,0.25)",
    title: "Architecture Map",
    desc: "A visual model adapted to the project type showing how major components relate, grounded in detected structure.",
  },
  {
    icon: ShieldCheckIcon,
    color: "var(--accent-purple)",
    bg: "rgba(144,100,217,0.12)",
    border: "rgba(144,100,217,0.25)",
    title: "No Account Needed",
    desc: "Paste any public GitHub URL and get results. Free to use, powered by Groq's free tier, with no signup required.",
  },
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

  // If a Project Brief is active
  if (exploreData) {
    return (
      <div
        className="flex flex-col flex-1 relative"
        style={{ backgroundColor: "var(--bg-workspace)" }}
      >
        {/* Subtle canvas texture */}
        <div className="absolute inset-0 canvas-texture opacity-40 pointer-events-none" />
        <main className="w-full relative z-10 px-4 py-6">
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

  // Landing / exploration page
  return (
    <div
      className="flex flex-col flex-1 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-workspace)" }}
    >
      {/* Canvas texture background */}
      <div className="absolute inset-0 canvas-texture opacity-30 pointer-events-none" />

      {/* Subtle atmospheric radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(15,138,131,0.08) 0%, transparent 70%)",
        }}
      />

      <main className="w-full max-w-4xl mx-auto flex flex-col items-center relative z-10 px-4 py-16 sm:py-24 space-y-14">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Pill badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(15,138,131,0.1)",
              border: "1px solid rgba(15,138,131,0.25)",
              color: "var(--teal-bright)",
            }}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Instant Repository Explorer · No Account Required</span>
          </div>

          <h1
            className="text-4xl sm:text-[3.25rem] font-extrabold tracking-tight leading-[1.12]"
            style={{ color: "var(--text-primary)" }}
          >
            Understand Any Codebase <span style={{ color: "var(--teal-bright)" }}>in Minutes</span>
          </h1>

          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Paste a public GitHub repository to get an evidence-backed{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Project Brief</span>:
            understand its purpose, discover capabilities, navigate its conceptual structure, and
            verify claims through source permalinks.
          </p>

          {/* Repository Exploration Input */}
          <div className="w-full max-w-2xl mx-auto pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 0 0 1px rgba(15,138,131,0.15), 0 4px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center gap-2.5 flex-1 w-full pl-3 pr-2 py-2 sm:py-0">
                {/* GitHub icon */}
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--text-muted)" }}
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
                  className="w-full bg-transparent text-sm font-mono focus:outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>

              <button
                type="submit"
                onClick={() => handleExplore()}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                style={{ backgroundColor: "var(--teal-primary)", color: "var(--text-primary)" }}
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Explore Repository</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Example Links */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Try:
              </span>
              {EXAMPLE_REPOS.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setRepoUrl(ex.url);
                    handleExplore(ex.url);
                  }}
                  className="px-2.5 py-1 rounded-md font-mono font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {ex.label}{" "}
                  <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>({ex.tech})</span>
                </button>
              ))}
            </div>

            {/* Loading State */}
            {isLoading && loadingStep && (
              <div
                className="mt-4 p-3.5 rounded-lg flex items-center gap-3 text-xs animate-fade-in"
                style={{
                  backgroundColor: "rgba(15,138,131,0.08)",
                  border: "1px solid rgba(15,138,131,0.2)",
                  color: "var(--teal-bright)",
                }}
              >
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="font-medium">{loadingStep}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                className="mt-4 p-3.5 rounded-lg flex items-center gap-2.5 text-xs animate-fade-in"
                style={{
                  backgroundColor: "rgba(224,92,92,0.08)",
                  border: "1px solid rgba(224,92,92,0.25)",
                  color: "#e88080",
                }}
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Repositories */}
        <RecentRepositoriesBar
          onSelectRepo={(url) => {
            setRepoUrl(url);
            handleExplore(url);
          }}
        />

        {/* 4 Pillars — horizontal compact strip */}
        <div className="w-full space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border-default)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              What Project Sarthi shows you
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border-default)" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-4 rounded-xl flex flex-col gap-3"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: pillar.bg, border: `1px solid ${pillar.border}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: pillar.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                      {pillar.title}
                    </h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workspace link */}
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Looking for the authenticated private workspace?</span>
          <Link
            href="/projects"
            className="font-semibold transition-colors"
            style={{ color: "var(--teal-bright)" }}
          >
            Go to Projects →
          </Link>
        </div>
      </main>
    </div>
  );
}
