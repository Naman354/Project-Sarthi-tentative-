"use client";

import React, { useState, useMemo } from "react";
import type { NormalizedEntity } from "../../types/project";
import { SearchIcon, CodeIcon, ExternalLinkIcon } from "../Icons";

interface RawEntitiesExplorerProps {
  entities: NormalizedEntity[];
  repoUrl?: string;
  commitSha?: string;
}

const ENTITY_TYPE_STYLES: Record<string, string> = {
  module: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  route: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  controller: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  service: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  model: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  component: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  page: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  doc: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  default: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

export default function RawEntitiesExplorer({
  entities,
  repoUrl,
  commitSha,
}: RawEntitiesExplorerProps) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    entities.forEach((e) => types.add(e.type));
    return Array.from(types).sort();
  }, [entities]);

  const filteredEntities = useMemo(() => {
    return entities.filter((ent) => {
      const matchesType = selectedTypeFilter === "all" || ent.type === selectedTypeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ent.name.toLowerCase().includes(q) ||
        ent.filePath.toLowerCase().includes(q) ||
        ent.type.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [entities, selectedTypeFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: "rgba(15,138,131,0.15)",
                  color: "var(--teal-bright)",
                  border: "1px solid rgba(15,138,131,0.3)",
                }}
              >
                <CodeIcon className="w-4 h-4" />
              </span>
              <h2
                className="text-lg sm:text-xl font-extrabold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Raw Entities Explorer
              </h2>
            </div>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              Detailed AST-level indexed entities discovered across source manifests, routes,
              models, and controllers.
            </p>
          </div>

          <span
            className="text-xs font-mono font-medium px-3 py-1 rounded-md shrink-0 self-start sm:self-auto"
            style={{
              backgroundColor: "var(--bg-workspace)",
              color: "var(--teal-bright)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {entities.length} normalized entities
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedTypeFilter("all")}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor:
                  selectedTypeFilter === "all" ? "var(--teal-primary)" : "var(--bg-workspace)",
                color:
                  selectedTypeFilter === "all" ? "var(--text-primary)" : "var(--text-secondary)",
                border:
                  selectedTypeFilter === "all"
                    ? "1px solid var(--teal-bright)"
                    : "1px solid var(--border-subtle)",
              }}
            >
              All ({entities.length})
            </button>
            {availableTypes.map((t) => {
              const count = entities.filter((e) => e.type === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTypeFilter(t)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor:
                      selectedTypeFilter === t ? "var(--teal-primary)" : "var(--bg-workspace)",
                    color:
                      selectedTypeFilter === t ? "var(--text-primary)" : "var(--text-secondary)",
                    border:
                      selectedTypeFilter === t
                        ? "1px solid var(--teal-bright)"
                        : "1px solid var(--border-subtle)",
                  }}
                >
                  {t} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full sm:w-64 shrink-0"
            style={{
              backgroundColor: "var(--bg-workspace)",
              borderColor: "var(--border-default)",
            }}
          >
            <SearchIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search entities or paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-zinc-500"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* Entities Table */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[10px]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <tr>
                <th className="py-3 px-4">Entity Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source File Path</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {filteredEntities.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No entities found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEntities.map((ent, idx) => {
                  const badgeStyle = ENTITY_TYPE_STYLES[ent.type] || ENTITY_TYPE_STYLES.default;
                  const targetUrl =
                    repoUrl && ent.filePath
                      ? `${repoUrl.replace(/\/$/, "")}/blob/${commitSha || "main"}/${ent.filePath.replace(/^\/+/, "")}`
                      : null;

                  return (
                    <tr key={ent.id || idx} className="transition-colors hover:bg-white/[0.03]">
                      <td className="py-3 px-4 font-bold" style={{ color: "var(--text-primary)" }}>
                        {ent.name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}
                        >
                          {ent.type}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 font-mono text-[11px] truncate max-w-md"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {ent.filePath}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {targetUrl ? (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                            style={{ color: "var(--teal-bright)" }}
                          >
                            <span>View Source</span>
                            <ExternalLinkIcon className="w-3 h-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
