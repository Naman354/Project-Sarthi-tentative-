"use client";

import React from "react";

export function SkeletonItem({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse ${className}`} />
  );
}

export function ProjectCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 flex flex-col justify-between shadow-sm space-y-4"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <SkeletonItem className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <SkeletonItem className="w-32 h-4" />
                  <SkeletonItem className="w-20 h-3" />
                </div>
              </div>
              <SkeletonItem className="w-6 h-6 rounded-lg" />
            </div>

            <div className="space-y-2 mb-4">
              <SkeletonItem className="w-full h-3" />
              <SkeletonItem className="w-3/4 h-3" />
            </div>

            <SkeletonItem className="w-40 h-6 rounded-lg mb-4" />
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonItem className="w-20 h-5 rounded-full" />
              <SkeletonItem className="w-16 h-5 rounded" />
            </div>
            <SkeletonItem className="w-12 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SkeletonItem className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <SkeletonItem className="w-48 h-7" />
                <SkeletonItem className="w-24 h-6 rounded-full" />
              </div>
              <SkeletonItem className="w-64 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SkeletonItem className="w-36 h-10 rounded-xl" />
            <SkeletonItem className="w-20 h-10 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-2"
            >
              <SkeletonItem className="w-20 h-3" />
              <SkeletonItem className="w-32 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonItem key={i} className="w-28 h-9 rounded-xl" />
        ))}
      </div>

      {/* Canvas / Main Content Skeleton */}
      <div className="w-full h-[600px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-bounce">
          <div className="w-5 h-5 rounded-full bg-indigo-500" />
        </div>
        <SkeletonItem className="w-48 h-4" />
        <SkeletonItem className="w-64 h-3" />
      </div>
    </div>
  );
}

export function GraphSkeleton() {
  return (
    <div className="relative w-full h-[720px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col items-center justify-center space-y-4">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full bg-indigo-500 animate-ping opacity-75" />
        </div>
        <div className="text-sm font-bold text-zinc-200">Constructing Graph Topology...</div>
        <div className="text-xs text-zinc-500 max-w-sm">
          Calculating hierarchical tiers, topological order, and relationship bounds.
        </div>
      </div>
    </div>
  );
}
