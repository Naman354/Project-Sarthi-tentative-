"use client";

import React, { useState } from "react";
import type { ProjectBrief, EvidenceSummary } from "../../types/brief";
import ProjectFingerprintHero from "./ProjectFingerprintHero";
import AdaptiveVisualModel from "./visual-models/AdaptiveVisualModel";
import CapabilityCard from "./CapabilityCard";
import EvidenceExplorer from "./EvidenceExplorer";

interface ProjectBriefViewProps {
  brief: ProjectBrief;
  evidenceSummary?: EvidenceSummary;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing?: boolean;
}

export default function ProjectBriefView({
  brief,
  evidenceSummary,
  onRefresh,
  onReset,
  isRefreshing = false,
}: ProjectBriefViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "evidence">("overview");
  const [showCapabilities, setShowCapabilities] = useState(true);

  const commitShort = brief.commitSha ? brief.commitSha.substring(0, 7) : "HEAD";
  const commitUrl = `https://github.com/${brief.owner}/${brief.repo}/tree/${brief.commitSha}`;

  const scrollToCapabilities = () => {
    setShowCapabilities(true);
    const el = document.getElementById("capabilities-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. Top Navigation & Status Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Explore Another</span>
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

          {/* Repo Name & GitHub Link */}
          <a
            href={brief.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-zinc-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
          >
            <span>
              {brief.owner} / {brief.repo}
            </span>
            <svg
              className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          {/* Pinned Commit Badge */}
          <a
            href={commitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            title="Click to view repository snapshot on GitHub"
          >
            <span className="text-zinc-400">commit:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {commitShort}
            </span>
          </a>
        </div>

        {/* Right side status badges & actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generator badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              brief.generatedBy === "groq"
                ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {brief.generatedBy === "groq"
              ? `AI Brief (${brief.modelUsed || "Groq Free Tier"})`
              : "Deterministic Evidence Overview"}
          </span>

          {brief.cached && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Cached Snapshot
            </span>
          )}

          {/* Refresh Action */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Re-run analysis and refresh Project Brief"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-500" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? "Analyzing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Deterministic Fallback Alert Banner (when active) */}
      {brief.generatedBy === "deterministic-fallback" && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 p-4 flex items-start gap-3">
          <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <p className="font-semibold mb-0.5">Deterministic Evidence Overview Active</p>
            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
              {brief.limitationsAndGaps[0] ||
                "AI synthesis was unavailable or free-tier rate limits were reached. This brief was deterministically generated directly from repository manifests, documentation, and source inventory."}
            </p>
          </div>
        </div>
      )}

      {/* 2. THE HERO: Project Fingerprint */}
      <ProjectFingerprintHero
        brief={brief}
        evidenceSummary={evidenceSummary}
        onExploreCapabilities={scrollToCapabilities}
      />

      {/* View Tabs: Main Overview vs Secondary Evidence Explorer */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>Architectural Overview &amp; Systems</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "evidence"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>Verified Source Evidence</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">
              {Object.keys(brief.evidenceMap).length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-10">
          {/* 3. CENTRAL VISUALIZATION: Project-Adaptive Architecture Model */}
          <section aria-label="Project-Adaptive Architecture Map">
            <AdaptiveVisualModel
              areas={brief.conceptualMap.areas}
              relationships={brief.conceptualMap.relationships}
              projectCategory={brief.technicalOverview.projectCategory}
              evidenceMap={brief.evidenceMap}
              commitSha={brief.commitSha}
              owner={brief.owner}
              repo={brief.repo}
            />
          </section>

          {/* 4. CONCISE SUPPORTING CONTEXT: Capabilities Accordion / Grid */}
          <section id="capabilities-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <span>Core Project Capabilities</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {brief.capabilities.length} Verified
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Concise capabilities grounded in repository evidence and documentation
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCapabilities(!showCapabilities)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showCapabilities ? "Hide Capabilities" : "Show Capabilities"}
              </button>
            </div>

            {showCapabilities && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-fade-in">
                {brief.capabilities.map((capability) => (
                  <CapabilityCard
                    key={capability.id}
                    capability={capability}
                    evidenceMap={brief.evidenceMap}
                    commitSha={brief.commitSha}
                    owner={brief.owner}
                    repo={brief.repo}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 5. Newcomer Guided Codebase Tour */}
          {brief.guidedTour.length > 0 && (
            <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-sm p-6 space-y-4">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                    ✦
                  </span>
                  <span>Newcomer Guided Tour</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Recommended order to explore this repository&apos;s structure
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {brief.guidedTour.map((step) => {
                  const targetUrl = step.targetFile
                    ? `https://github.com/${brief.owner}/${brief.repo}/blob/${brief.commitSha}/${step.targetFile.replace(/^\/+/, "")}`
                    : null;

                  return (
                    <div
                      key={step.step}
                      className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                            Step {step.step}
                          </span>
                          {targetUrl && (
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-zinc-500 hover:text-indigo-600 font-medium inline-flex items-center gap-1"
                            >
                              <span>View File</span>
                              <svg
                                className="w-2.5 h-2.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                          {step.title}
                        </h5>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      {step.targetFile && (
                        <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50">
                          <span className="font-mono text-[11px] text-zinc-500 truncate block">
                            {step.targetFile}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 6. Honest Limitations & Gaps */}
          {brief.limitationsAndGaps.length > 0 && (
            <section className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-amber-600"
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
                <span>Analysis Gaps &amp; Known Limitations</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                {brief.limitationsAndGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        /* Secondary Tab: All Source Evidence Explorer */
        <section aria-label="Verified Source Evidence Explorer" className="space-y-4">
          <EvidenceExplorer evidenceMap={brief.evidenceMap} commitSha={brief.commitSha} />
        </section>
      )}
    </div>
  );
}
