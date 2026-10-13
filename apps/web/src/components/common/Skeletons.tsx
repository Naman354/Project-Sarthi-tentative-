"use client";

import React from "react";

export function SkeletonItem({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }}
    />
  );
}

export function ProjectCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border p-5 flex flex-col justify-between shadow-sm space-y-4"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
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

          <div
            className="pt-3 border-t flex items-center justify-between"
            style={{ borderColor: "var(--border-subtle)" }}
          >
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
      <div
        className="rounded-2xl border p-6 space-y-6"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
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

        <div
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border space-y-2"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <SkeletonItem className="w-20 h-3" />
              <SkeletonItem className="w-32 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div
        className="flex items-center gap-2 border-b pb-2"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonItem key={i} className="w-28 h-9 rounded-xl" />
        ))}
      </div>

      {/* Canvas / Main Content Skeleton */}
      <div
        className="w-full h-[600px] rounded-2xl border flex flex-col items-center justify-center p-8 space-y-4"
        style={{
          backgroundColor: "var(--bg-workspace)",
          borderColor: "var(--border-default)",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center animate-bounce border"
          style={{
            backgroundColor: "rgba(0, 194, 203, 0.12)",
            borderColor: "rgba(0, 194, 203, 0.3)",
          }}
        >
          <div className="w-5 h-5 rounded-full bg-[var(--teal-primary)]" />
        </div>
        <SkeletonItem className="w-48 h-4" />
        <SkeletonItem className="w-64 h-3" />
      </div>
    </div>
  );
}

export function GraphSkeleton() {
  return (
    <div
      className="relative w-full h-[720px] rounded-2xl border overflow-hidden flex flex-col items-center justify-center space-y-4"
      style={{
        backgroundColor: "var(--bg-workspace)",
        borderColor: "var(--border-default)",
      }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0, 194, 203, 0.2) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        <div
          className="w-14 h-14 rounded-2xl border flex items-center justify-center animate-pulse"
          style={{
            backgroundColor: "rgba(0, 194, 203, 0.1)",
            borderColor: "rgba(0, 194, 203, 0.3)",
          }}
        >
          <div className="w-6 h-6 rounded-full bg-[var(--teal-primary)] animate-ping opacity-75" />
        </div>
        <div className="text-sm font-bold text-white">Constructing Graph Topology...</div>
        <div className="text-xs text-[var(--text-muted)] max-w-sm">
          Calculating hierarchical tiers, topological order, and relationship bounds.
        </div>
      </div>
    </div>
  );
}
