"use client";

import React, { useState } from "react";
import type {
  ConceptualArea,
  ConceptualRelationship,
  EvidenceRecord,
  ProjectCategory,
} from "../../../types/brief";
import WebSystemVisualModel from "./WebSystemVisualModel";
import CliToolVisualModel from "./CliToolVisualModel";
import LibraryVisualModel from "./LibraryVisualModel";
import DataMlVisualModel from "./DataMlVisualModel";
import UniversalVisualModel from "./UniversalVisualModel";
import ContextualDetailPanel from "../ContextualDetailPanel";

interface AdaptiveVisualModelProps {
  areas: ConceptualArea[];
  relationships: ConceptualRelationship[];
  projectCategory?: ProjectCategory;
  evidenceMap: Record<string, EvidenceRecord>;
  commitSha: string;
  owner: string;
  repo: string;
}

export default function AdaptiveVisualModel({
  areas,
  relationships,
  projectCategory = "universal",
  evidenceMap,
  commitSha,
  owner,
  repo,
}: AdaptiveVisualModelProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(areas[0]?.id || null);
  const [viewMode, setViewMode] = useState<"adaptive" | "universal">("adaptive");

  const selectedArea = areas.find((a) => a.id === selectedAreaId) || null;

  // Render the appropriate visual model based on category and viewMode
  const renderVisualModel = () => {
    if (viewMode === "universal") {
      return (
        <UniversalVisualModel
          areas={areas}
          selectedAreaId={selectedAreaId}
          onSelectArea={(id) => setSelectedAreaId(id)}
        />
      );
    }

    switch (projectCategory) {
      case "web-application":
      case "backend-system":
        return (
          <WebSystemVisualModel
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />
        );
      case "cli-tool":
        return (
          <CliToolVisualModel
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />
        );
      case "library-framework":
        return (
          <LibraryVisualModel
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />
        );
      case "data-ml":
        return (
          <DataMlVisualModel
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />
        );
      default:
        return (
          <UniversalVisualModel
            areas={areas}
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />
        );
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-sm p-5 sm:p-7 space-y-6">
      {/* Top Header of the Central Visualization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
            <span>Adaptive Architectural Map</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {areas.length} Components
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Interactive representation tailored to this project&apos;s verified structural patterns
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("adaptive")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              viewMode === "adaptive"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
            }`}
          >
            Project-Aware Layout
          </button>
          <button
            type="button"
            onClick={() => setViewMode("universal")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              viewMode === "universal"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
            }`}
          >
            Modular Grid
          </button>
        </div>
      </div>

      {/* Main Layout: Visual Model + Interactive Contextual Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column: Visual Model */}
        <div className={selectedArea ? "lg:col-span-7" : "lg:col-span-12"}>
          {renderVisualModel()}
        </div>

        {/* Right Column: Contextual Detail Panel */}
        {selectedArea && (
          <div className="lg:col-span-5 sticky top-6">
            <ContextualDetailPanel
              area={selectedArea}
              allAreas={areas}
              relationships={relationships}
              evidenceMap={evidenceMap}
              commitSha={commitSha}
              owner={owner}
              repo={repo}
              onSelectArea={(id) => setSelectedAreaId(id)}
              onClose={() => setSelectedAreaId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
