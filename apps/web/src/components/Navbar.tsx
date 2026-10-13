"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { NetworkGraphIcon, LogOutIcon } from "./Icons";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: "rgba(11, 23, 26, 0.92)",
        borderColor: "var(--border-default)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          href="/"
          id="navbar-brand-link"
          className="flex items-center gap-3 group focus:outline-none shrink-0"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
            style={{
              backgroundColor: "rgba(15,138,131,0.18)",
              border: "1.5px solid var(--teal-primary)",
              boxShadow: "0 2px 8px rgba(15,138,131,0.25)",
              color: "var(--teal-bright)",
            }}
          >
            <NetworkGraphIcon className="w-4.5 h-4.5" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm sm:text-base tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Project Sarthi
            </span>
            <span
              className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              Beta
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-2">
          {[
            { href: "/", label: "Explore" },
            { href: "/projects", label: "Projects" },
          ].map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                id={`nav-link-${label.toLowerCase()}`}
                className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                style={{
                  color: active ? "var(--teal-bright)" : "var(--text-secondary)",
                  backgroundColor: active ? "rgba(15,138,131,0.14)" : "transparent",
                  border: active ? "1px solid rgba(53,208,195,0.35)" : "1px solid transparent",
                }}
              >
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Auth Section */}
          {isLoading ? (
            <div
              className="h-8 w-24 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--bg-elevated)" }}
            />
          ) : user ? (
            <div className="flex items-center gap-1.5 ml-2">
              {/* User chip */}
              <div
                id="user-profile-badge"
                className="flex items-center gap-2 px-2.5 py-1 rounded-md"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: "var(--teal-dim)", color: "var(--teal-bright)" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className="text-xs font-medium max-w-[100px] truncate hidden sm:block"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.name}
                </span>
              </div>

              {/* Logout */}
              <button
                type="button"
                id="navbar-logout-btn"
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
                style={{
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#e05c5c";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "rgba(224,92,92,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
                title="Sign out"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 ml-2">
              <Link
                href="/login"
                id="navbar-login-link"
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-all"
                style={{ color: "var(--text-secondary)" }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                id="navbar-register-link"
                className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
                style={{
                  backgroundColor: "var(--teal-primary)",
                  color: "var(--text-primary)",
                }}
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
