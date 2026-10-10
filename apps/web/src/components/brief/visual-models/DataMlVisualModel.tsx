"use client";

import React from "react";
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

  const stages = [
    {
      id: "data-ingestion",
      title: "Data Sources & Ingestion",
      icon: "📊",
      desc: "Datasets, loaders, input formats & raw schemas",
      badge: "Input Data",
      items: areas.filter((a) => /data|dataset|loader|source|input|fetch|raw/i.test(a.name)),
    },
    {
      id: "data-prep",
      title: "Feature Engineering & Preprocessing",
      icon: "🧪",
      desc: "Transforms, cleaning routines, feature extraction & pipelines",
      badge: "Transforms",
      items: areas.filter((a) => /prep|transform|clean|feature|pipeline|token/i.test(a.name)),
    },
    {
      id: "data-model",
      title: hasModelArtifacts ? "Model Architectures & Training" : "Analytics & Compute Modules",
      icon: "🧠",
      desc: hasModelArtifacts
        ? "Network layers, loss functions, optimizer, & checkpointing"
        : "Statistical models, algorithmic transforms & compute logic",
      badge: hasModelArtifacts ? "Model Engine" : "Compute Core",
      items: areas.filter(
        (a) =>
          /model|train|layer|network|weight|torch|compute|algorithm|engine/i.test(a.name) &&
          !/eval|metric|test/i.test(a.name)
      ),
    },
    {
      id: "data-eval",
      title: "Inference, Evaluation & Artifacts",
      icon: "📈",
      desc: "Predictions, metric evaluation, reports & export artifacts",
      badge: "Evaluation",
      items: areas.filter((a) => /infer|predict|eval|metric|test|serve|output|artifact/i.test(a.name)),
    },
  ];

  // Distribute unassigned
  const assignedIds = new Set(stages.flatMap((s) => s.items.map((i) => i.id)));
  const unassigned = areas.filter((a) => !assignedIds.has(a.id));
  unassigned.forEach((area, index) => {
    const targetIdx = index % stages.length;
    stages[targetIdx]?.items.push(area);
  });

  const activeStages = stages.filter((s) => s.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1 gap-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span>🧠</span>
          <span>Data &amp; Machine Learning Workflow</span>
        </span>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          {hasNotebooks && (
            <span className="px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
              Jupyter Notebooks Verified
            </span>
          )}
          <span>Data Ingestion ➔ Transforms ➔ Modeling ➔ Evaluation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeStages.map((stage, idx) => (
          <div
            key={stage.id}
            className="p-4 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 shadow-2xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-900/40 pb-2 mb-2.5">
                <span className="text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                  <span>{stage.icon}</span>
                  <span>{stage.title}</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                  {stage.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 leading-tight">
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
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-rose-600 bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-rose-500/30"
                          : "border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800/90 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </span>
                        {item.associatedFiles.length > 0 && (
                          <span className="text-[9px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {idx < activeStages.length - 1 && (
              <div className="hidden lg:flex justify-end pt-2 text-rose-400 font-mono text-xs">
                <span>➔ Next Stage</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
