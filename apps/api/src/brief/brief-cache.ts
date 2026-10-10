import { createHash } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import type { ProjectBrief } from "./types.js";

const PROMPT_VERSION = "v1.0";
const SCHEMA_VERSION = "v1.0";

export class ProjectBriefCache {
  private inMemoryCache = new Map<string, ProjectBrief>();
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.resolve(process.cwd(), "temp", "cache", "briefs");
  }

  computeKey(repoUrl: string, commitSha: string, modelId: string): string {
    const raw = `${repoUrl.toLowerCase()}#${commitSha}#${modelId}#${PROMPT_VERSION}#${SCHEMA_VERSION}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  async get(repoUrl: string, commitSha: string, modelId: string): Promise<ProjectBrief | null> {
    const key = this.computeKey(repoUrl, commitSha, modelId);

    // 1. Check in-memory cache
    const memHit = this.inMemoryCache.get(key);
    if (memHit) {
      return { ...memHit, cached: true };
    }

    // 2. Check disk cache
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`);
      const raw = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw) as ProjectBrief;
      this.inMemoryCache.set(key, parsed);
      return { ...parsed, cached: true };
    } catch {
      return null;
    }
  }

  async set(
    repoUrl: string,
    commitSha: string,
    modelId: string,
    brief: ProjectBrief
  ): Promise<void> {
    const key = this.computeKey(repoUrl, commitSha, modelId);
    this.inMemoryCache.set(key, brief);

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const filePath = path.join(this.cacheDir, `${key}.json`);
      await fs.writeFile(filePath, JSON.stringify(brief, null, 2), "utf-8");
    } catch {
      // In-memory cache is still intact even if disk write fails
    }
  }

  async clear(): Promise<void> {
    this.inMemoryCache.clear();
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

export const projectBriefCache = new ProjectBriefCache();
