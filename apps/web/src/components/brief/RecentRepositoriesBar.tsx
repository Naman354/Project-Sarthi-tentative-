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

export function useRecentRepos(): RecentRepositoryItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function clearRecentRepos(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_REPOS_STORAGE_KEY);
    window.dispatchEvent(new Event(RECENT_REPOS_EVENT));
  } catch {
    // Ignore storage errors
  }
}

export default function RecentRepositoriesBar({ onSelectRepo }: RecentRepositoriesBarProps) {
  const recentRepos = useRecentRepos();

  const handleClear = () => {
    clearRecentRepos();
  };

  if (recentRepos.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <span
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: "var(--teal-bright)" }}
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
          className="text-xs transition-colors cursor-pointer hover:text-rose-400"
          style={{ color: "var(--text-muted)" }}
        >
          Clear history
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {recentRepos.map((item) => (
          <button
            key={item.repoUrl}
            type="button"
            onClick={() => onSelectRepo(item.repoUrl)}
            className="p-3.5 rounded-xl text-left transition-all cursor-pointer group shadow-xs"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span
                className="text-xs sm:text-sm font-bold truncate group-hover:text-[var(--teal-bright)] transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                {item.owner}/{item.repo}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {item.primaryLanguage}
              </span>
            </div>
            <p
              className="text-xs line-clamp-1 leading-normal"
              style={{ color: "var(--text-secondary)" }}
            >
              {item.purpose}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
