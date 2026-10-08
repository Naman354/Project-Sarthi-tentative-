import { projectRepository } from "../repositories/project.repository.js";
import {
  analysisRepository,
  type AnalysisRepository,
} from "../repositories/analysis.repository.js";
import {
  repositoryService,
  type RepositoryService,
  type RepositoryMetadata,
} from "./repository.service.js";
import { parserManager, type ParserManager } from "../parsers/manager.js";
import type { ParserManagerResult } from "../parsers/types.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Analysis, Project } from "@prisma/client";

export interface AnalysisStatusResponse {
  project: Project;
  latestAnalysis: Analysis | null;
  isCloned: boolean;
  metadata: RepositoryMetadata | null;
  parseResult?: ParserManagerResult | null;
}

export interface AnalyzeProjectResponse {
  project: Project;
  analysis: Analysis;
  metadata: RepositoryMetadata;
  parseResult: ParserManagerResult;
}

export class AnalysisService {
  constructor(
    private readonly repoService: RepositoryService = repositoryService,
    private readonly analysisRepo: AnalysisRepository = analysisRepository,
    private readonly parserMgr: ParserManager = parserManager
  ) {}

  async analyzeProject(projectId: string, userId: string): Promise<AnalyzeProjectResponse> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    // Create analysis run in pending/in_progress state
    const analysis = await this.analysisRepo.create({
      projectId,
      status: "in_progress",
      summary: "Repository synchronization and parser engine started",
      parserVersion: "v1.0.0-m5",
    });

    const startTime = performance.now();

    try {
      // Step 2 in Chapter 11: Clone or Pull Repository
      const syncResult = await this.repoService.cloneOrPull(projectId, project.githubUrl);
      const metadata = await this.repoService.getMetadata(projectId);
      const repoPath = this.repoService.getRepoPath(projectId);

      // Step 3-7 in Chapter 11: Run Parser Engine & Plugins
      const parseResult = await this.parserMgr.parseRepository(repoPath);

      const durationSeconds = Math.round(((performance.now() - startTime) / 1000) * 100) / 100;

      // Update project record with latest detected metadata
      const detectedFramework =
        parseResult.technologies.technologies.find(
          (t) => t === "Next.js" || t === "Express" || t === "React"
        ) || metadata.detectedFramework;

      const detectedLanguage =
        parseResult.technologies.technologies.includes("Prisma") ||
        parseResult.technologies.technologies.includes("Express")
          ? metadata.detectedLanguage || "TypeScript"
          : metadata.detectedLanguage;

      const updatedProject = await projectRepository.update(projectId, {
        defaultBranch: metadata.branch,
        lastAnalysis: new Date(),
        language: detectedLanguage,
        framework: detectedFramework,
      });

      // Update analysis record with completed status and parsed summary
      const shortHash = metadata.commitHash ? metadata.commitHash.slice(0, 7) : "HEAD";
      const summary = `Repository ${syncResult.action} (${metadata.branch} @ ${shortHash}). Parser engine discovered ${parseResult.stats.totalEntities} entities (${parseResult.stats.modulesCount} modules, ${parseResult.stats.routesCount} routes, ${parseResult.stats.modelsCount} models, ${parseResult.stats.componentsCount} components) across ${parseResult.stats.totalRelationships} relationships.`;

      const completedAnalysis = await this.analysisRepo.update(analysis.id, {
        status: "completed",
        summary,
        analysisDuration: durationSeconds,
        parserVersion: "v1.0.0-m5",
      });

      return {
        project: updatedProject,
        analysis: completedAnalysis,
        metadata,
        parseResult,
      };
    } catch (err: unknown) {
      const durationSeconds = Math.round(((performance.now() - startTime) / 1000) * 100) / 100;
      const errorMsg = err instanceof Error ? err.message : "Repository synchronization failed";

      await this.analysisRepo.update(analysis.id, {
        status: "failed",
        summary: errorMsg,
        analysisDuration: durationSeconds,
      });

      throw err;
    }
  }

  async getProjectStatus(projectId: string, userId: string): Promise<AnalysisStatusResponse> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const latestAnalysis = await this.analysisRepo.findLatestByProjectId(projectId);
    const isCloned = await this.repoService.isCloned(projectId);

    let metadata: RepositoryMetadata | null = null;
    let parseResult: ParserManagerResult | null = null;

    if (isCloned) {
      try {
        metadata = await this.repoService.getMetadata(projectId);
      } catch {
        metadata = null;
      }

      try {
        const repoPath = this.repoService.getRepoPath(projectId);
        parseResult = await this.parserMgr.parseRepository(repoPath);
      } catch {
        parseResult = null;
      }
    }

    return {
      project,
      latestAnalysis,
      isCloned,
      metadata,
      parseResult,
    };
  }

  async getProjectEntities(projectId: string, userId: string): Promise<ParserManagerResult> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const isCloned = await this.repoService.isCloned(projectId);
    if (!isCloned) {
      throw new NotFoundError(
        "Repository has not been synchronized yet. Run analyze first.",
        "REPO_NOT_CLONED"
      );
    }

    const repoPath = this.repoService.getRepoPath(projectId);
    return this.parserMgr.parseRepository(repoPath);
  }
}

export const analysisService = new AnalysisService();
