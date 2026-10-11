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
    <div
      className="rounded-2xl p-5 sm:p-7 space-y-6"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top Header of the Central Visualization */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <h3
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span>Deep Architectural Topology</span>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              {areas.length} areas
            </span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Category-specialized structural graph and layer inspection
          </p>
        </div>

        {/* View Mode Toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto"
          style={{
            backgroundColor: "var(--bg-workspace)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("adaptive")}
            className="px-3 py-1 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: viewMode === "adaptive" ? "var(--teal-primary)" : "transparent",
              color: viewMode === "adaptive" ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            Project-Specific View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("universal")}
            className="px-3 py-1 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: viewMode === "universal" ? "var(--teal-primary)" : "transparent",
              color: viewMode === "universal" ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            Overview Grid
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
