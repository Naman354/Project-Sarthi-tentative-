import React from "react";
import Link from "next/link";
import SystemStatus from "./SystemStatus";
import AuthStatus from "./AuthStatus";
import { SparklesIcon, NetworkGraphIcon, ArrowRightIcon } from "../components/Icons";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12 sm:py-16 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      <main className="w-full max-w-5xl flex flex-col items-center relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold backdrop-blur-sm">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Vertical Feature Progress • Milestones 1 & 2 Live</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Software Understanding Platform
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Git remembers{" "}
            <span className="text-zinc-900 dark:text-zinc-200 font-medium">what changed</span>.
            Project Sarthi remembers{" "}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              what the software means
            </span>
            .
          </p>
        </div>

        {/* Milestone Verification Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Milestone 1 Status Card */}
          <div className="w-full">
            <SystemStatus />
          </div>

          {/* Milestone 2 Status Card */}
          <div className="w-full">
            <AuthStatus />
          </div>
        </div>

        {/* Roadmap Preview Section */}
        <div className="w-full mt-10 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <NetworkGraphIcon className="w-5 h-5 text-indigo-500" />
                Engineering Roadmap
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Vertical slice progression according to Chapter 13
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900/60">
                Milestones 1, 2 & 3 Live
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <Link
              href="/projects"
              id="roadmap-card-milestone-3"
              className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30 hover:border-indigo-500/60 transition-all group block relative"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Live Now
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Milestone 3 – Projects Dashboard
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Project creation, user ownership, project dashboard, and metadata management.
              </p>
              <div className="mt-3 flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-medium gap-1">
                <span>Open Dashboard</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Upcoming
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                Milestone 4 – GitHub
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Repository cloning with simple-git, branch tracking, and commit metadata.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Upcoming
              </span>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                Milestone 5 – Parsers
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                AST Visitors for React, Express, Prisma & Markdown normalization.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
