"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { NetworkGraphIcon, LogOutIcon } from "./Icons";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          href="/"
          id="navbar-brand-link"
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-white">
              <NetworkGraphIcon className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                Project Sarthi
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                MVP v1.0
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              Software Understanding Platform
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            id="nav-link-overview"
            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Overview
          </Link>
          <Link
            href="/projects"
            id="nav-link-projects"
            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Projects
          </Link>

          {/* Dynamic Auth Section */}
          {isLoading ? (
            <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Chip */}
              <div
                id="user-profile-badge"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                id="navbar-logout-btn"
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                title="Sign out of your session"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                id="navbar-login-link"
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                id="navbar-register-link"
                className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
