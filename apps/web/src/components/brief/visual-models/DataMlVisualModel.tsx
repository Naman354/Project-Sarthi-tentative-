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
  const stages = [
    {
      title: "Data Sources & Ingestion",
      icon: "📊",
      desc: "Datasets, loaders & raw inputs",
      items: areas.filter((a) => /data|dataset|loader|source|input/i.test(a.name)),
    },
    {
      title: "Preprocessing & Features",
      icon: "🧪",
      desc: "Feature transforms & cleaning",
      items: areas.filter((a) => /prep|transform|clean|feature|pipeline/i.test(a.name)),
    },
    {
      title: "Model & Training",
      icon: "🧠",
      desc: "Network layers, loss & weights",
      items: areas.filter(
        (a) =>
          /model|train|layer|network|weight|torch|nn/i.test(a.name) &&
          !/eval|metric|test/i.test(a.name)
      ),
    },
    {
      title: "Inference & Metrics",
      icon: "📈",
      desc: "Predictions, evaluation & export",
      items: areas.filter((a) => /infer|predict|eval|metric|test|serve|output/i.test(a.name)),
    },
  ];

  // Distribute unassigned areas
  const assignedIds = new Set(stages.flatMap((s) => s.items.map((i) => i.id)));
  const unassigned = areas.filter((a) => !assignedIds.has(a.id));
  unassigned.forEach((area, index) => {
    const targetIdx = index % stages.length;
    stages[targetIdx]?.items.push(area);
  });

  const activeStages = stages.filter((s) => s.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span>🧠</span>
          <span>Data &amp; Machine Learning Pipeline</span>
        </span>
        <span>Data Ingestion ➔ Feature Prep ➔ Modeling ➔ Evaluation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {activeStages.map((stage, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-900/40 pb-2 mb-2">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1">
                  <span>{stage.icon}</span>
                  <span>{stage.title}</span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3">{stage.desc}</p>

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
                          : "border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate">{item.name}</span>
                        {item.associatedFiles.length > 0 && (
                          <span className="text-[9px] font-mono px-1 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                            {item.associatedFiles.length}f
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {item.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {idx < activeStages.length - 1 && (
              <div className="hidden md:flex justify-end pt-2 text-rose-300">
                <span className="text-xs">➔</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
