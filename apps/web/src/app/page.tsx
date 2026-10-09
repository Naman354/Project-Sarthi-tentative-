"use client";

import React, { useState } from "react";
import Link from "next/link";
import SystemStatus from "./SystemStatus";
import AuthStatus from "./AuthStatus";
import {
  SparklesIcon,
  NetworkGraphIcon,
  ArrowRightIcon,
  CodeIcon,
  TargetIcon,
  SearchIcon,
  SlidersIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "../components/Icons";

export default function Home() {
  const [showDevStatus, setShowDevStatus] = useState(false);

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 sm:py-20 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <main className="w-full max-w-6xl flex flex-col items-center relative z-10 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold backdrop-blur-sm shadow-xs">
            <SparklesIcon className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>Software Understanding Platform • Milestones 1–9 Live</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
            Understand Any Codebase in{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Minutes
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Git remembers{" "}
            <span className="text-zinc-900 dark:text-zinc-200 font-medium">what changed</span>.
            Project Sarthi remembers{" "}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              what the software means
            </span>
            . Interactive knowledge graphs, architectural insights, and instant context recovery.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/projects"
              id="hero-projects-cta"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all cursor-pointer group"
            >
              <span>Open Projects Workspace</span>
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register"
              id="hero-register-cta"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition-all"
            >
              <span>Create Free Account</span>
            </Link>
          </div>

          {/* Omnibar Hint */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <SearchIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Global Omnibar Search enabled inside projects:</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* 4 Pillars of Project Sarthi */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Knowledge Graph */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <NetworkGraphIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Interactive Project Graph
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Visual topological map of modules, API routes, controllers, and Prisma schemas with
                pan, zoom, and instant node inspection.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Canvas &amp; Minimap</span>
            </div>
          </div>

          {/* Card 2: Focus Mode & Search */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm hover:border-purple-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <TargetIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Focus Mode &amp; Omnibar
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Milestone 9 brings universal{" "}
                <kbd className="font-mono text-[10px] px-1 bg-zinc-200 dark:bg-zinc-800 rounded">
                  Ctrl+K
                </kbd>{" "}
                search and 1-hop subgraph isolation to cut through complex codebase noise.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>Subgraph Isolation</span>
            </div>
          </div>

          {/* Card 3: Health & Insights */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Architectural Health
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Automated detection of circular dependencies, orphan modules, and documentation
                deficits with overall project health scoring.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Risk &amp; Metric Radar</span>
            </div>
          </div>

          {/* Card 4: Resume Session */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <CodeIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Resume Session Briefing
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Eliminates the &quot;where was I working?&quot; cognitive friction by answering what
                changed, what depends on what, and what to tackle next.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Instant Context Recovery</span>
            </div>
          </div>
        </div>

        {/* Milestone 9 Polish Spotlight */}
        <div className="w-full p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Milestone 9 Highlights
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 flex items-center gap-2">
                <SlidersIcon className="w-5 h-5 text-indigo-500" />
                Usability, Search &amp; Polish
              </h2>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm self-start sm:self-auto"
            >
              <span>Explore Projects</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                Feature
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                Global Omnibar
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Press{" "}
                <kbd className="font-mono text-[10px] px-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                  Ctrl+K
                </kbd>{" "}
                anywhere to jump across routes, models, modules, and architectural insights.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                Feature
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                Graph Focus Mode
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Select any route or service to isolate its 1-hop neighborhood, automatically dimming
                irrelevant nodes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Feature
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                Sleek Skeletons &amp; Feedback
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Fluid loading skeletons, animated progress modal, and graceful recovery states
                across all workspaces.
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Developer Verification Section (PostgreSQL & Auth Checks) */}
        <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowDevStatus(!showDevStatus)}
            className="w-full flex items-center justify-between p-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
              <span>Developer Environment Status (Database &amp; Auth Diagnostics)</span>
            </div>
            {showDevStatus ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>

          {showDevStatus && (
            <div className="p-6 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SystemStatus />
                <AuthStatus />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
