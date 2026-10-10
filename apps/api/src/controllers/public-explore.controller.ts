import type { Request, Response } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { simpleGit, type SimpleGit } from "simple-git";
import {
  exploreRepositoryInputSchema,
  GITHUB_PUBLIC_REPO_REGEX,
} from "../brief/schemas.js";
import { universalEvidenceCollector } from "../brief/evidence-collector.js";
import { groqBriefService } from "../brief/groq-brief.service.js";
import { projectBriefCache } from "../brief/brief-cache.js";

export class PublicExploreController {
  async explore(req: Request, res: Response): Promise<void> {
    const parseResult = exploreRepositoryInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid repository URL",
        errors: parseResult.error.issues,
      });
      return;
    }

    const { githubUrl, forceRefresh } = parseResult.data;
    const match = githubUrl.match(GITHUB_PUBLIC_REPO_REGEX);
    if (!match || !match[1] || !match[2]) {
      res.status(400).json({
        success: false,
        message: "URL must be a public GitHub repository (e.g. https://github.com/owner/repository)",
      });
      return;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    const canonicalUrl = `https://github.com/${owner}/${repo}`;

    const tempBaseDir = path.resolve(process.cwd(), "temp", "public_explore");
    const uniqueSessionId = `${owner}_${repo}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const targetDir = path.join(tempBaseDir, uniqueSessionId);

    try {
      await fs.mkdir(tempBaseDir, { recursive: true });

      // 1. Shallow clone repository pinned to latest commit
      const git: SimpleGit = simpleGit({
        timeout: {
          block: 40000, // 40-second clone timeout
        },
      });

      try {
        await git.clone(canonicalUrl, targetDir, ["--depth", "1", "--single-branch"]);
      } catch (cloneErr: unknown) {
        const msg = cloneErr instanceof Error ? cloneErr.message : String(cloneErr);
        res.status(400).json({
          success: false,
          message:
            "Could not clone repository. Please verify that this is an accessible public GitHub repository without private access restrictions.",
          details: msg,
        });
        return;
      }

      // 2. Extract commit hash and branch
      const localGit = simpleGit(targetDir);
      let commitSha = "HEAD";
      let branch = "main";

      try {
        const log = await localGit.log({ maxCount: 1 });
        if (log.latest?.hash) {
          commitSha = log.latest.hash;
        }
        const branchSummary = await localGit.branch();
        branch = branchSummary.current || "main";
      } catch {
        commitSha = "HEAD";
      }

      // 3. Collect universal repository evidence bundle
      const bundle = await universalEvidenceCollector.collect(targetDir, {
        repoUrl: canonicalUrl,
        commitSha,
        branch,
        owner,
        repo,
      });

      // 4. Generate Project Brief (or load from commit cache)
      const brief = await groqBriefService.generateBrief(bundle, {
        forceRefresh: Boolean(forceRefresh),
      });

      res.status(200).json({
        success: true,
        data: {
          brief,
          evidenceSummary: {
            totalEvidenceRecords: bundle.evidenceRecords.length,
            languages: bundle.languages,
            projectTypes: bundle.projectTypes,
            totalFiles: bundle.structure.totalFiles,
            totalDirectories: bundle.structure.totalDirectories,
            parserCoverage: bundle.parserCoverage,
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        success: false,
        message: `Failed to analyze repository: ${msg}`,
      });
    } finally {
      // 5. Clean up temporary clone workspace safely
      try {
        await fs.rm(targetDir, { recursive: true, force: true });
      } catch {
        // Ignore deletion cleanup error
      }
    }
  }

  async preview(req: Request, res: Response): Promise<void> {
    const rawUrl = typeof req.query.url === "string" ? req.query.url.trim() : "";
    if (!rawUrl) {
      res.status(400).json({ success: false, message: "Missing repository URL parameter" });
      return;
    }

    const match = rawUrl.match(GITHUB_PUBLIC_REPO_REGEX);
    if (!match || !match[1] || !match[2]) {
      res.status(400).json({ success: false, message: "Invalid GitHub repository URL" });
      return;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");
    const canonicalUrl = `https://github.com/${owner}/${repo}`;
    const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

    // Check if we have any cached brief for this repo URL (e.g. from previous run)
    // We look in projectBriefCache for matching repoUrl
    const cached = await projectBriefCache.get(canonicalUrl, "HEAD", model);
    if (cached) {
      res.status(200).json({
        success: true,
        data: {
          available: true,
          brief: cached,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        available: false,
        canonicalUrl,
        owner,
        repo,
      },
    });
  }
}

export const publicExploreController = new PublicExploreController();
