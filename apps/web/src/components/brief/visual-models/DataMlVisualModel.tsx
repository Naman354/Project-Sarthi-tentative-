"use client";

import React, { useMemo } from "react";
import type { ConceptualArea } from "../../../types/brief";

interface DataMlVisualModelProps {
  areas: ConceptualArea[];
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
}

export default function DataMlVisualModel({
  areas,
  selectedAreaId,
  onSelectArea,
}: DataMlVisualModelProps) {
  const hasNotebooks = areas.some((a) => a.associatedFiles.some((f) => f.endsWith(".ipynb")));
  const hasModelArtifacts = areas.some((a) =>
    /model|weight|checkpoint|onnx|pt|torch|nn/i.test(a.name)
  );

  const stages = useMemo(() => {
    const rawStages = [
      {
        id: "data-ingestion",
        title: "Data Sources & Ingestion",
        icon: "📊",
        desc: "Datasets, loaders, input formats & raw schemas",
        badge: "Input Data",
        color: "var(--teal-bright)",
        bg: "rgba(15,138,131,0.12)",
        border: "rgba(53,208,195,0.35)",
        items: areas.filter((a) => /data|dataset|loader|source|input|fetch|raw/i.test(a.name)),
      },
      {
        id: "data-prep",
        title: "Preprocessing & Features",
        icon: "🧪",
        desc: "Transforms, cleaning routines, feature extraction & pipelines",
        badge: "Transforms",
        color: "var(--accent-orange)",
        bg: "rgba(242,140,69,0.12)",
        border: "rgba(242,140,69,0.35)",
        items: areas.filter((a) => /prep|transform|clean|feature|pipeline|token/i.test(a.name)),
      },
      {
        id: "data-model",
        title: hasModelArtifacts ? "Model Architectures & Training" : "Analytics & Compute Core",
        icon: "🧠",
        desc: hasModelArtifacts
          ? "Network layers, loss functions, optimizer, & checkpointing"
          : "Statistical models, algorithmic transforms & compute logic",
        badge: hasModelArtifacts ? "Model Engine" : "Compute Core",
        color: "var(--accent-purple)",
        bg: "rgba(144,100,217,0.12)",
        border: "rgba(144,100,217,0.35)",
        items: areas.filter(
          (a) =>
            /model|train|layer|network|weight|torch|compute|algorithm|engine/i.test(a.name) &&
            !/eval|metric|test/i.test(a.name)
        ),
      },
      {
        id: "data-eval",
        title: "Inference & Evaluation",
        icon: "📈",
        desc: "Predictions, metric evaluation, reports & export artifacts",
        badge: "Evaluation",
        color: "var(--accent-green)",
        bg: "rgba(85,184,121,0.12)",
        border: "rgba(85,184,121,0.35)",
        items: areas.filter((a) =>
          /infer|predict|eval|metric|test|serve|output|artifact/i.test(a.name)
        ),
      },
    ];

    // Distribute unassigned areas into compute stage
    const assignedIds = new Set(rawStages.flatMap((s) => s.items.map((i) => i.id)));
    const unassigned = areas.filter((a) => !assignedIds.has(a.id));
    if (unassigned.length > 0) {
      const modelStage = rawStages.find((s) => s.id === "data-model");
      if (modelStage) {
        modelStage.items.push(...unassigned);
      }
    }

    return rawStages.filter((s) => s.items.length > 0);
  }, [areas, hasModelArtifacts]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-1 gap-1">
        <span
          className="font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>🧠</span>
          <span>Data &amp; Machine Learning Workflow</span>
        </span>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          {hasNotebooks && (
            <span
              className="px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: "rgba(244,176,79,0.15)",
                color: "var(--accent-amber)",
                border: "1px solid rgba(244,176,79,0.3)",
              }}
            >
              Jupyter Notebooks Verified
            </span>
          )}
          <span style={{ color: "var(--text-muted)" }}>
            Ingestion ➔ Transforms ➔ Modeling ➔ Evaluation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: `1px solid ${stage.border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <div>
              <div
                className="flex items-center justify-between pb-2 mb-2.5 border-b"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span
                  className="text-xs font-bold flex items-center gap-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span>{stage.icon}</span>
                  <span>{stage.title}</span>
                </span>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: stage.bg,
                    color: stage.color,
                    border: `1px solid ${stage.border}`,
                  }}
                >
                  {stage.badge}
                </span>
              </div>
              <p
                className="text-[11px] mb-3 leading-tight"
                style={{ color: "var(--text-secondary)" }}
              >
                {stage.desc}
              </p>

              <div className="space-y-2">
                {stage.items.map((item) => {
                  const isSelected = item.id === selectedAreaId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectArea(item.id)}
                      className="w-full text-left p-2.5 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? "var(--bg-hover)" : "var(--bg-workspace)",
                        border: isSelected
                          ? "1px solid var(--teal-bright)"
                          : "1px solid var(--border-subtle)",
                        boxShadow: isSelected
                          ? "0 0 14px rgba(53,208,195,0.25)"
                          : "0 2px 6px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className="text-xs font-bold truncate"
                          style={{
                            color: isSelected ? "var(--teal-bright)" : "var(--text-primary)",
                          }}
                        >
                          {item.name}
                        </span>
                        {item.associatedFiles.length > 0 && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[10px] line-clamp-2 leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
