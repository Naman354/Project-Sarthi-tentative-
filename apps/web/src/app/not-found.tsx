import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">404 - Page Not Found</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 mb-6">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
