"use client";

import React, { useSyncExternalStore } from "react";
import type { RecentRepositoryItem } from "../../types/brief";

interface RecentRepositoriesBarProps {
  onSelectRepo: (url: string) => void;
}

const RECENT_REPOS_STORAGE_KEY = "sarthi_recent_repos";
const RECENT_REPOS_EVENT = "sarthi_recent_repos_updated";

const EMPTY_REPOS: RecentRepositoryItem[] = [];
let cachedRaw: string | null = null;
let cachedRepos: RecentRepositoryItem[] = EMPTY_REPOS;

function getSnapshot(): RecentRepositoryItem[] {
  if (typeof window === "undefined") {
    return EMPTY_REPOS;
  }
  try {
    const raw = localStorage.getItem(RECENT_REPOS_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedRepos;
    }
    cachedRaw = raw;
    cachedRepos = raw ? (JSON.parse(raw) as RecentRepositoryItem[]) : EMPTY_REPOS;
    return cachedRepos;
  } catch {
    return EMPTY_REPOS;
  }
}

function getServerSnapshot(): RecentRepositoryItem[] {
  return EMPTY_REPOS;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(RECENT_REPOS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(RECENT_REPOS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveRecentRepo(item: RecentRepositoryItem): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENT_REPOS_STORAGE_KEY);
    const existing: RecentRepositoryItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((r) => r.repoUrl.toLowerCase() !== item.repoUrl.toLowerCase());
    const updated = [item, ...filtered].slice(0, 8);
    localStorage.setItem(RECENT_REPOS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(RECENT_REPOS_EVENT));
  } catch {
    // Ignore storage errors
  }
}

export default function RecentRepositoriesBar({ onSelectRepo }: RecentRepositoriesBarProps) {
  const recentRepos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleClear = () => {
    try {
      localStorage.removeItem(RECENT_REPOS_STORAGE_KEY);
      window.dispatchEvent(new Event(RECENT_REPOS_EVENT));
    } catch {
      // Ignore storage errors
    }
  };

  if (recentRepos.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Recently Explored Repositories</span>
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
        >
          Clear history
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {recentRepos.map((item) => (
          <button
            key={item.repoUrl}
            type="button"
            onClick={() => onSelectRepo(item.repoUrl)}
            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/80 dark:bg-zinc-900/80 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                {item.owner}/{item.repo}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                {item.primaryLanguage}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-normal">
              {item.purpose}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
