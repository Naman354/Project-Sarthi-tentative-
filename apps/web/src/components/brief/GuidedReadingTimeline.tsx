"use client";

import React from "react";
import type { GuidedTourStep } from "../../types/brief";
import { ExternalLinkIcon } from "../Icons";

interface GuidedReadingTimelineProps {
  steps: GuidedTourStep[];
  owner: string;
  repo: string;
  commitSha: string;
  maxSteps?: number;
  onViewAll?: () => void;
}

export default function GuidedReadingTimeline({
  steps,
  owner,
  repo,
  commitSha,
  maxSteps,
  onViewAll,
}: GuidedReadingTimelineProps) {
  if (!steps || steps.length === 0) return null;

  const displaySteps = maxSteps ? steps.slice(0, maxSteps) : steps;

  return (
    <section
      id="tour-section"
      aria-label="Where to Start Reading Code"
      className="rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Section Header */}
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
              ✦
            </span>
            <h2
              className="text-lg sm:text-xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Where to Start Reading Code
            </h2>
          </div>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
            A guided sequential path through important files to build an accurate mental model of
            this repository.
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
          {steps.length} ordered steps
        </span>
      </div>

      {/* Connected Progression Timeline */}
      <div className="relative">
        {/* Subtle Horizontal Progression Line on Desktop */}
        <div
          className="hidden md:block absolute top-7 left-8 right-8 h-0.5 z-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,138,131,0.4) 0%, rgba(53,208,195,0.6) 50%, rgba(15,138,131,0.4) 100%)",
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {displaySteps.map((step, idx) => {
            const targetUrl = step.targetFile
              ? `https://github.com/${owner}/${repo}/blob/${commitSha}/${step.targetFile.replace(/^\/+/, "")}`
              : null;
            const fileName = step.targetFile ? step.targetFile.split("/").pop() : null;
            const fileDir = step.targetFile
              ? step.targetFile.split("/").slice(0, -1).join("/")
              : "";

            return (
              <div
                key={step.step || idx}
                className="p-5 sm:p-6 rounded-2xl flex flex-col justify-between relative group transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
              >
                <div className="space-y-3">
                  {/* Step Sequence Badge & Target Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shadow-sm"
                        style={{
                          backgroundColor: "var(--teal-primary)",
                          color: "var(--text-primary)",
                          border: "1.5px solid var(--teal-bright)",
                        }}
                      >
                        {step.step || idx + 1}
                      </span>
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Step {step.step || idx + 1} of {steps.length}
                      </span>
                    </div>

                    <span
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(15,138,131,0.12)",
                        color: "var(--teal-bright)",
                        border: "1px solid rgba(15,138,131,0.25)",
                      }}
                    >
                      {idx === 0 ? "Entrypoint" : idx === 1 ? "Core Flow" : "Extension"}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3
                    className="text-base sm:text-lg font-bold tracking-tight pt-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Target File Container & Action Button */}
                {step.targetFile && (
                  <div
                    className="mt-5 pt-4 border-t space-y-2.5"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2.5 text-xs font-mono truncate">
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: "var(--teal-bright)" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="truncate">
                        {fileDir && <span style={{ color: "var(--text-muted)" }}>{fileDir}/</span>}
                        <span
                          className="font-bold font-mono"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {fileName}
                        </span>
                      </div>
                    </div>

                    {targetUrl && (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-md"
                        style={{
                          backgroundColor: "rgba(15,138,131,0.15)",
                          color: "var(--teal-bright)",
                          border: "1px solid rgba(53,208,195,0.3)",
                        }}
                        title={`Open ${step.targetFile} on GitHub at commit ${commitSha.substring(0, 7)}`}
                      >
                        <span>Inspect in GitHub</span>
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* View all steps button when previewing */}
        {onViewAll && steps.length > displaySteps.length && (
          <div
            className="pt-4 flex items-center justify-between border-t mt-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {displaySteps.length} of {steps.length} guided steps.
            </span>
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer hover:brightness-110"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(53,208,195,0.3)",
              }}
            >
              <span>View Full Reading Guide ({steps.length} Steps) →</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
