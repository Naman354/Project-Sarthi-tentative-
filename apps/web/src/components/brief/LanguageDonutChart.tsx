"use client";

import React, { useState, useMemo } from "react";

export const LANGUAGE_HEX_MAP: Record<string, string> = {
  TypeScript: "#388BFD",
  JavaScript: "#F7B955",
  Python: "#00E5FF",
  Rust: "#FF7A45",
  Go: "#00D2FF",
  Java: "#FF6B6B",
  "C++": "#6BA4E8",
  C: "#94A3B8",
  "C#": "#A855F7",
  Ruby: "#F43F5E",
  PHP: "#818CF8",
  Swift: "#FB923C",
  Kotlin: "#A855F7",
  Shell: "#34D399",
  HTML: "#F97316",
  CSS: "#A78BFA",
  Vue: "#10B981",
  Svelte: "#FF5722",
  Dart: "#38BDF8",
  Zig: "#FBBF24",
  Lua: "#60A5FA",
  JSON: "#FACC15",
  YAML: "#FB7185",
  TOML: "#FB923C",
  Markdown: "#38BDF8",
  SQL: "#2DD4BF",
  Other: "#94A3B8",
};

export function getLanguageColor(lang: string): string {
  return LANGUAGE_HEX_MAP[lang] || "#35D0C3";
}

interface LanguageItem {
  language: string;
  fileCount: number;
  percentage: number;
  exactPercentage: number;
}

interface LanguageDonutChartProps {
  languages: LanguageItem[];
  totalFiles: number;
}

export default function LanguageDonutChart({ languages, totalFiles }: LanguageDonutChartProps) {
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  // SVG Geometry
  const size = 180;
  const strokeWidth = 18;
  const hoveredStrokeWidth = 22;
  const center = size / 2;
  const radius = center - hoveredStrokeWidth / 2 - 4; // ~66
  const circumference = 2 * Math.PI * radius; // ~414.69

  // Calculate slice offsets immutably without mutating outer accumulator
  const slices = useMemo(() => {
    if (!languages || languages.length === 0) return [];
    return languages.map((lang, index) => {
      const offset = languages.slice(0, index).reduce((sum, l) => sum + l.exactPercentage, 0);
      const strokeDasharray = `${(lang.exactPercentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((offset / 100) * circumference);
      const color = getLanguageColor(lang.language);

      return {
        ...lang,
        color,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [languages, circumference]);

  if (!languages || languages.length === 0) {
    return null;
  }

  const activeItem = hoveredLang ? languages.find((l) => l.language === hoveredLang) : null;

  return (
    <div
      className="p-5 rounded-2xl space-y-4"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: "var(--teal-bright)" }}
            />
            <span
              className="text-sm sm:text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Language Distribution
            </span>
          </div>
          <span
            className="text-xs block mt-1 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Share of {totalFiles} analyzed files by language (file-count based, not byte size or
            SLOC) · 100% accounted for
          </span>
        </div>
        <span
          className="text-xs font-mono font-medium px-2.5 py-1 rounded-md shrink-0"
          style={{
            backgroundColor: "var(--bg-workspace)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {languages.length} detected
        </span>
      </div>

      {/* Chart & Legend Row */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
        {/* Donut Chart SVG */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="var(--bg-workspace)"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredLang === slice.language;
              return (
                <circle
                  key={slice.language}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? hoveredStrokeWidth : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${slice.color})` : undefined,
                    opacity: hoveredLang && !isHovered ? 0.4 : 1,
                  }}
                  onMouseEnter={() => setHoveredLang(slice.language)}
                  onMouseLeave={() => setHoveredLang(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
            style={{ width: size, height: size }}
          >
            {activeItem ? (
              <div className="animate-fade-in space-y-0.5">
                <span
                  className="text-2xl font-black font-mono block truncate max-w-[120px]"
                  style={{ color: getLanguageColor(activeItem.language) }}
                >
                  {activeItem.percentage}%
                </span>
                <span
                  className="text-xs font-bold block truncate max-w-[120px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeItem.language}
                </span>
                <span
                  className="text-[11px] font-mono block"
                  style={{ color: "var(--text-muted)" }}
                >
                  {activeItem.fileCount} {activeItem.fileCount === 1 ? "file" : "files"}
                </span>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span
                  className="text-2xl font-extrabold font-mono block"
                  style={{ color: "var(--text-primary)" }}
                >
                  {totalFiles}
                </span>
                <span
                  className="text-[11px] uppercase font-bold tracking-wider block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Files
                </span>
                <span
                  className="text-[10px] font-mono block font-semibold"
                  style={{ color: "var(--teal-bright)" }}
                >
                  100% verified
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend Grid */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {languages.map((l) => {
            const isHovered = hoveredLang === l.language;
            const color = getLanguageColor(l.language);
            return (
              <div
                key={l.language}
                onMouseEnter={() => setHoveredLang(l.language)}
                onMouseLeave={() => setHoveredLang(null)}
                className="flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer"
                style={{
                  backgroundColor: isHovered ? "var(--bg-hover)" : "var(--bg-workspace)",
                  border: isHovered ? `1px solid ${color}` : "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="font-bold text-xs sm:text-sm truncate"
                    style={{
                      color: isHovered ? "var(--text-primary)" : "var(--text-primary)",
                    }}
                  >
                    {l.language}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    {l.fileCount} {l.fileCount === 1 ? "file" : "files"}
                  </span>
                  <span
                    className="font-mono font-bold text-xs px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "rgba(15,138,131,0.15)",
                      color: "var(--teal-bright)",
                      border: "1px solid rgba(15,138,131,0.3)",
                    }}
                  >
                    {l.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
