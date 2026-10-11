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
      className="sticky top-0 z-50 w-full border-b"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border-default)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link
          href="/"
          id="navbar-brand-link"
          className="flex items-center gap-2.5 group focus:outline-none shrink-0"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--teal-dim)", border: "1px solid var(--teal-primary)" }}
          >
            <NetworkGraphIcon
              className="w-4 h-4 transition-transform group-hover:scale-110"
              style={{ color: "var(--teal-bright)" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Project Sarthi
            </span>
            <span
              className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
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
        <nav className="flex items-center gap-1">
          {[
            { href: "/", label: "Explore" },
            { href: "/projects", label: "Projects" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              id={`nav-link-${label.toLowerCase()}`}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-all"
              style={{
                color: isActive(href) ? "var(--teal-bright)" : "var(--text-secondary)",
                backgroundColor: isActive(href) ? "rgba(15,138,131,0.12)" : "transparent",
              }}
            >
              {label}
            </Link>
          ))}

          {/* Auth Section */}
          {isLoading ? (
            <div
              className="h-7 w-20 rounded-md animate-pulse"
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
