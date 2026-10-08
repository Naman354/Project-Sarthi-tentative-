import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import { simpleGit, type SimpleGit } from "simple-git";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export interface RepositoryMetadata {
  branch: string;
  commitHash: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  fileCount: number;
  directoryCount: number;
  totalSizeBytes: number;
  detectedLanguage: string | null;
  detectedFramework: string | null;
  topLevelEntries: string[];
}

export interface SyncResult {
  action: "cloned" | "pulled";
  repoPath: string;
}

export class RepositoryService {
  private baseStorageDir: string;

  constructor() {
    this.baseStorageDir =
      process.env.REPOSITORIES_STORAGE_DIR || path.resolve(process.cwd(), "temp", "repositories");
  }

  getRepoPath(projectId: string): string {
    return path.join(this.baseStorageDir, projectId);
  }

  async isCloned(projectId: string): Promise<boolean> {
    const repoPath = this.getRepoPath(projectId);
    try {
      const gitDir = path.join(repoPath, ".git");
      const stat = await fs.stat(gitDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async cloneOrPull(projectId: string, githubUrl: string): Promise<SyncResult> {
    const repoPath = this.getRepoPath(projectId);
    const alreadyCloned = await this.isCloned(projectId);

    if (alreadyCloned) {
      try {
        const git: SimpleGit = simpleGit(repoPath);
        await git.pull();
        return { action: "pulled", repoPath };
      } catch (err: unknown) {
        // If git pull fails due to merge conflict or corrupted worktree, re-clone
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(
          `[RepositoryService] Pull failed for ${projectId} (${errorMessage}), re-cloning...`
        );
        await this.deleteRepository(projectId);
      }
    }

    // Clone fresh repository
    await fs.mkdir(this.baseStorageDir, { recursive: true });
    try {
      const git: SimpleGit = simpleGit();
      await git.clone(githubUrl, repoPath);
      return { action: "cloned", repoPath };
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      // Clean up failed clone directory if left partially created
      await this.deleteRepository(projectId).catch(() => {});
      throw new BadRequestError(`Failed to clone repository: ${rawMessage}`, "CLONE_FAILED");
    }
  }

  async getMetadata(projectId: string): Promise<RepositoryMetadata> {
    const repoPath = this.getRepoPath(projectId);
    const exists = await this.isCloned(projectId);
    if (!exists) {
      throw new NotFoundError("Repository is not cloned locally", "REPO_NOT_FOUND");
    }

    const git: SimpleGit = simpleGit(repoPath);

    // 1. Git branch
    let branch = "main";
    try {
      const branchSummary = await git.branch();
      branch = branchSummary.current || "main";
    } catch {
      branch = "main";
    }

    // 2. Git commit info
    let commitHash = "";
    let commitMessage = "";
    let commitAuthor = "";
    let commitDate = "";

    try {
      const log = await git.log({ maxCount: 1 });
      if (log.latest) {
        commitHash = log.latest.hash;
        commitMessage = log.latest.message;
        commitAuthor = log.latest.author_name;
        commitDate = log.latest.date;
      }
    } catch {
      // In case repository has empty history
    }

    // 3. Scan directory files and detect signals
    const scanResult = await this.scanDirectory(repoPath);

    return {
      branch,
      commitHash,
      commitMessage,
      commitAuthor,
      commitDate,
      fileCount: scanResult.fileCount,
      directoryCount: scanResult.directoryCount,
      totalSizeBytes: scanResult.totalSizeBytes,
      detectedLanguage: scanResult.detectedLanguage,
      detectedFramework: scanResult.detectedFramework,
      topLevelEntries: scanResult.topLevelEntries,
    };
  }

  async deleteRepository(projectId: string): Promise<void> {
    const repoPath = this.getRepoPath(projectId);
    try {
      if (fsSync.existsSync(repoPath)) {
        await fs.rm(repoPath, { recursive: true, force: true });
      }
    } catch (err: unknown) {
      console.warn(`[RepositoryService] Could not remove repo directory ${repoPath}:`, err);
    }
  }

  private async scanDirectory(dirPath: string): Promise<{
    fileCount: number;
    directoryCount: number;
    totalSizeBytes: number;
    detectedLanguage: string | null;
    detectedFramework: string | null;
    topLevelEntries: string[];
  }> {
    const IGNORED_DIRS = new Set([
      ".git",
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      ".turbo",
      ".cache",
    ]);

    let fileCount = 0;
    let directoryCount = 0;
    let totalSizeBytes = 0;
    let hasTsConfig = false;
    let hasPackageJson = false;
    let packageJsonContent: Record<string, unknown> | null = null;
    let hasPython = false;
    let hasGo = false;
    let hasRust = false;

    let topLevelEntries: string[] = [];
    try {
      topLevelEntries = await fs.readdir(dirPath);
    } catch {
      topLevelEntries = [];
    }

    const traverse = async (currentDir: string): Promise<void> => {
      let entries: string[] = [];
      try {
        entries = await fs.readdir(currentDir);
      } catch {
        return;
      }

      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry)) {
          continue;
        }

        const fullPath = path.join(currentDir, entry);
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            directoryCount++;
            await traverse(fullPath);
          } else if (stat.isFile()) {
            fileCount++;
            totalSizeBytes += stat.size;

            if (entry === "tsconfig.json") {
              hasTsConfig = true;
            } else if (entry === "package.json" && currentDir === dirPath) {
              hasPackageJson = true;
              try {
                const raw = await fs.readFile(fullPath, "utf-8");
                packageJsonContent = JSON.parse(raw);
              } catch {
                // Ignore parse error
              }
            } else if (
              entry === "requirements.txt" ||
              entry === "Pipfile" ||
              entry === "pyproject.toml"
            ) {
              hasPython = true;
            } else if (entry === "go.mod") {
              hasGo = true;
            } else if (entry === "Cargo.toml") {
              hasRust = true;
            }
          }
        } catch {
          // Ignore unreadable file/folder
        }
      }
    };

    await traverse(dirPath);

    // Detect primary language & framework
    let detectedLanguage: string | null = null;
    let detectedFramework: string | null = null;

    if (hasPackageJson) {
      detectedLanguage = hasTsConfig ? "TypeScript" : "JavaScript";
      if (packageJsonContent) {
        const deps = {
          ...((packageJsonContent["dependencies"] as Record<string, string>) || {}),
          ...((packageJsonContent["devDependencies"] as Record<string, string>) || {}),
        };

        if ("next" in deps) {
          detectedFramework = "Next.js";
        } else if ("react" in deps) {
          detectedFramework = "React";
        } else if ("express" in deps) {
          detectedFramework = "Express";
        } else if ("vue" in deps || "nuxt" in deps) {
          detectedFramework = "Vue";
        } else if ("@nestjs/core" in deps) {
          detectedFramework = "NestJS";
        }
      }
    } else if (hasPython) {
      detectedLanguage = "Python";
    } else if (hasGo) {
      detectedLanguage = "Go";
    } else if (hasRust) {
      detectedLanguage = "Rust";
    }

    return {
      fileCount,
      directoryCount,
      totalSizeBytes,
      detectedLanguage,
      detectedFramework,
      topLevelEntries: topLevelEntries.filter((e) => !IGNORED_DIRS.has(e)),
    };
  }
}

export const repositoryService = new RepositoryService();
