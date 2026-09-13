"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  message: string;
  database?: string;
}

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: HealthData = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function checkHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/health`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data: HealthData = await res.json();
        if (!ignore) {
          setHealth(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to connect to API");
          setLoading(false);
        }
      }
    }

    void checkHealth();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="w-full max-w-xl p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm my-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Milestone 1 System Verification
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          className="text-xs px-3 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? "Checking..." : "Re-check"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Backend API</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === "ok" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {loading ? "Connecting..." : health?.status === "ok" ? "Online (:5000)" : "Offline"}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">PostgreSQL (Prisma)</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.database === "connected" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {loading
                ? "Connecting..."
                : health?.database === "connected"
                  ? "Connected (:5432)"
                  : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {health?.message && (
        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">{health.message}</p>
      )}

      {error && <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">Error: {error}</p>}
    </div>
  );
}
