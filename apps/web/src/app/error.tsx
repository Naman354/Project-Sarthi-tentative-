"use client";

import React from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-rose-500">Something went wrong</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {error.message || "An error occurred while rendering this page."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
