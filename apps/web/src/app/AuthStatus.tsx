"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ShieldCheckIcon, UserIcon, ArrowRightIcon } from "../components/Icons";
import type { User } from "../types/auth";

export default function AuthStatus() {
  const { user, accessToken, isLoading, logout } = useAuth();
  const [testingProtected, setTestingProtected] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testProtectedEndpoint = async () => {
    setTestingProtected(true);
    setTestResult(null);
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      if (res.success && res.data?.user) {
        setTestResult(`✓ 200 OK: Protected claim verified for ${res.data.user.email}`);
      } else {
        setTestResult(`✗ Failed: ${res.message || "Unauthorized"}`);
      }
    } catch (err) {
      setTestResult(`✗ Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setTestingProtected(false);
    }
  };

  return (
    <div className="w-full max-w-xl p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm my-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              user ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-indigo-500" />
            Milestone 2 Auth Verification
          </h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
          JWT + Cookies
        </span>
      </div>

      {isLoading ? (
        <div className="h-24 flex items-center justify-center text-xs text-zinc-400">
          <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
          Verifying session...
        </div>
      ) : user ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Authenticated Session
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">User ID</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px] truncate block">
                  {user.id}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">Access Token</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">
                  {accessToken ? "Present in memory" : "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Test Protected Route */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="test-protected-btn"
              onClick={testProtectedEndpoint}
              disabled={testingProtected}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {testingProtected ? (
                <>
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Testing /auth/me...
                </>
              ) : (
                "Test GET /auth/me"
              )}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>

          {testResult && (
            <p
              id="auth-test-result"
              className={`text-xs p-2.5 rounded-lg border font-mono ${
                testResult.startsWith("✓")
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
              }`}
            >
              {testResult}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Guest Session
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Sign in or create an account to start authenticating API requests.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              id="auth-status-login-btn"
              className="text-xs font-medium px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Sign In
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/register"
              id="auth-status-register-btn"
              className="text-xs font-medium px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
