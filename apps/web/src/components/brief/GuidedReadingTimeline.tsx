"use client";

import React from "react";
import type { GuidedTourStep } from "../../types/brief";
import { ExternalLinkIcon } from "../Icons";

interface GuidedReadingTimelineProps {
  steps: GuidedTourStep[];
  owner: string;
  repo: string;
  commitSha: string;
}

export default function GuidedReadingTimeline({
  steps,
  owner,
  repo,
  commitSha,
}: GuidedReadingTimelineProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <section
      id="tour-section"
      className="rounded-2xl p-6 sm:p-7 space-y-6"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
      }}
    >
      {/* Section Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <h3
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: "rgba(15,138,131,0.15)",
                color: "var(--teal-bright)",
                border: "1px solid rgba(15,138,131,0.3)",
              }}
            >
              ✦
            </span>
            <span>Where to Start Reading</span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Recommended sequential reading order grounded in actual repository source files
          </p>
        </div>

        <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
          {steps.length} sequential steps
        </span>
      </div>

      {/* Connected Progression Timeline */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, idx) => {
            const targetUrl = step.targetFile
              ? `https://github.com/${owner}/${repo}/blob/${commitSha}/${step.targetFile.replace(/^\/+/, "")}`
              : null;
            const fileName = step.targetFile ? step.targetFile.split("/").pop() : null;

            return (
              <div
                key={step.step || idx}
                className="p-5 rounded-xl flex flex-col justify-between relative group transition-all"
                style={{
                  backgroundColor: "var(--bg-workspace)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  {/* Step Sequence Badge & Target Action */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                        style={{
                          backgroundColor: "rgba(15,138,131,0.2)",
                          color: "var(--teal-bright)",
                          border: "1px solid rgba(53,208,195,0.4)",
                        }}
                      >
                        {step.step || idx + 1}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Step {step.step || idx + 1} of {steps.length}
                      </span>
                    </div>

                    {targetUrl && (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold inline-flex items-center gap-1 transition-colors group-hover:text-white"
                        style={{ color: "var(--teal-bright)" }}
                        title="Open file in GitHub"
                      >
                        <span>Inspect</span>
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Step Title */}
                  <h4 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </h4>

                  {/* Step Description */}
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {step.description}
                  </p>
                </div>

                {/* Emphasized Recommended Target File Pill */}
                {step.targetFile && (
                  <div
                    className="mt-4 pt-3 border-t flex items-center justify-between gap-2"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
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
                      <span
                        className="font-mono text-xs truncate font-medium"
                        style={{ color: "var(--text-primary)" }}
                        title={step.targetFile}
                      >
                        {fileName}
                      </span>
                    </div>

                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      start here
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
