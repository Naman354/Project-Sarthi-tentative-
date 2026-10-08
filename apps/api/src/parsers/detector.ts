import path from "node:path";
import fs from "node:fs/promises";
import type { TechnologyReport } from "./types.js";

export class TechnologyDetector {
  private readonly IGNORED_DIRS = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
    ".turbo",
    ".cache",
  ]);

  async detect(repoPath: string): Promise<TechnologyReport> {
    const techSet = new Set<string>();
    const details: Record<string, boolean | string> = {};

    let dependencies: Record<string, string> = {};

    // 1. Inspect Root package.json
    try {
      const rootPkgPath = path.join(repoPath, "package.json");
      const raw = await fs.readFile(rootPkgPath, "utf-8");
      const parsed = JSON.parse(raw);
      dependencies = {
        ...(parsed.dependencies || {}),
        ...(parsed.devDependencies || {}),
      };
    } catch {
      // No root package.json, continue
    }

    // Check known packages
    if (dependencies["next"]) {
      techSet.add("Next.js");
      techSet.add("React");
      details["Next.js"] = dependencies["next"] || true;
      details["React"] = dependencies["react"] || true;
    } else if (dependencies["react"]) {
      techSet.add("React");
      details["React"] = dependencies["react"] || true;
    }

    if (dependencies["express"]) {
      techSet.add("Express");
      details["Express"] = dependencies["express"] || true;
    }

    if (dependencies["prisma"] || dependencies["@prisma/client"]) {
      techSet.add("Prisma");
      details["Prisma"] = dependencies["@prisma/client"] || dependencies["prisma"] || true;
    }

    if (dependencies["mongoose"]) {
      techSet.add("Mongoose");
      details["Mongoose"] = dependencies["mongoose"] || true;
    }

    // 2. Scan for specific files across repository
    await this.scanRepositoryFiles(repoPath, techSet, details);

    return {
      technologies: Array.from(techSet),
      details,
    };
  }

  private async scanRepositoryFiles(
    dirPath: string,
    techSet: Set<string>,
    details: Record<string, boolean | string>,
    depth = 0
  ): Promise<void> {
    if (depth > 6) return;

    let entries: string[] = [];
    try {
      entries = await fs.readdir(dirPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (this.IGNORED_DIRS.has(entry)) continue;

      const fullPath = path.join(dirPath, entry);
      let isDir = false;
      try {
        const stat = await fs.stat(fullPath);
        isDir = stat.isDirectory();
      } catch {
        continue;
      }

      if (isDir) {
        // Recursive dive
        await this.scanRepositoryFiles(fullPath, techSet, details, depth + 1);
      } else {
        const lower = entry.toLowerCase();

        // Prisma schema detection
        if (lower === "schema.prisma" || lower.endsWith(".prisma")) {
          techSet.add("Prisma");
          details["Prisma (Schema File)"] = true;
        }

        // Markdown documentation detection
        if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
          techSet.add("Markdown");
          details["Markdown Documentation"] = true;
        }

        // OpenAPI / Swagger detection
        if (
          lower === "openapi.yaml" ||
          lower === "openapi.json" ||
          lower === "swagger.yaml" ||
          lower === "swagger.json"
        ) {
          techSet.add("OpenAPI");
          details["OpenAPI Specification"] = true;
        }

        // Subpackage package.json detection (e.g. monorepo workspaces)
        if (lower === "package.json" && depth > 0) {
          try {
            const raw = await fs.readFile(fullPath, "utf-8");
            const parsed = JSON.parse(raw);
            const deps = {
              ...(parsed.dependencies || {}),
              ...(parsed.devDependencies || {}),
            };

            if (deps["next"]) {
              techSet.add("Next.js");
              techSet.add("React");
              details["Next.js"] = deps["next"] || true;
            } else if (deps["react"]) {
              techSet.add("React");
              details["React"] = deps["react"] || true;
            }

            if (deps["express"]) {
              techSet.add("Express");
              details["Express"] = deps["express"] || true;
            }

            if (deps["prisma"] || deps["@prisma/client"]) {
              techSet.add("Prisma");
              details["Prisma"] = true;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

export const technologyDetector = new TechnologyDetector();
