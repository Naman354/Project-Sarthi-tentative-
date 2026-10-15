"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchProjectById, fetchProjectStatus } from "../../../lib/project";

function ProjectRedirectContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params?.["id"] as string;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    (async () => {
      try {
        // Map legacy tab parameter to unified workspace destination & mode
        const legacyTab = searchParams?.get("tab");
        const existingSection = searchParams?.get("section");
        const existingMode = searchParams?.get("mode");

        let extraParams = "";
        if (existingSection) {
          extraParams += `&section=${encodeURIComponent(existingSection)}`;
          if (existingMode) {
            extraParams += `&mode=${encodeURIComponent(existingMode)}`;
          }
        } else if (legacyTab) {
          if (legacyTab === "graph") {
            extraParams += "&section=explorer&mode=graph";
          } else if (legacyTab === "modules") {
            extraParams += "&section=explorer&mode=modules";
          } else if (legacyTab === "insights") {
            extraParams += "&section=health";
          } else if (legacyTab === "entities") {
            extraParams += "&section=entities";
          } else if (legacyTab === "overview") {
            extraParams += "&section=overview";
          }
        }

        // 1. Attempt to fetch project record to resolve repository URL
        const res = await fetchProjectById(projectId);
        if (!isMounted) return;

        if (res.success && res.data?.project) {
          const repo = res.data.project.githubUrl;
          router.replace(
            `/?project=${encodeURIComponent(projectId)}&repo=${encodeURIComponent(repo)}${extraParams}`
          );
          return;
        }

        // 2. Attempt project status as fallback
        const statusRes = await fetchProjectStatus(projectId);
        if (!isMounted) return;

        if (statusRes.success && statusRes.data?.project) {
          const repo = statusRes.data.project.githubUrl;
          router.replace(
            `/?project=${encodeURIComponent(projectId)}&repo=${encodeURIComponent(repo)}${extraParams}`
          );
          return;
        }

        // 3. Fallback: navigate with project ID directly to unified workspace
        router.replace(`/?project=${encodeURIComponent(projectId)}${extraParams}`);
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Error resolving project";
        console.warn("Direct project redirect fallback:", msg);
        setErrorMessage(msg);
        router.replace(`/?project=${encodeURIComponent(projectId)}`);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [projectId, router, searchParams]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]"
      style={{ backgroundColor: "var(--bg-workspace)", color: "var(--text-primary)" }}
    >
      <div className="w-9 h-9 border-2 border-[var(--teal-primary)] border-t-[var(--teal-bright)] rounded-full animate-spin mb-4" />
      <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Opening Unified Workspace
      </h2>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Redirecting to canonical engineering workbench...
      </p>

      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300">
          <p className="mb-2">{errorMessage}</p>
          <Link href="/projects" className="underline text-teal-400">
            Back to Projects Hub
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex-1 flex items-center justify-center p-16"
          style={{ backgroundColor: "var(--bg-workspace)" }}
        >
          <div className="w-8 h-8 border-2 border-[var(--teal-primary)] border-t-[var(--teal-bright)] rounded-full animate-spin" />
        </div>
      }
    >
      <ProjectRedirectContent />
    </Suspense>
  );
}
