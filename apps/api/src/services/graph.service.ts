import { projectRepository } from "../repositories/project.repository.js";
import { graphRepository, type GraphRepository } from "../repositories/graph.repository.js";
import { graphBuilder, type GraphBuilder } from "../graph/builder.js";
import type { ParserManagerResult } from "../parsers/types.js";
import type { RepositoryMetadata } from "./repository.service.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type {
  ProjectGraphResponse,
  ModuleSummaryItem,
  ModuleDetailResponse,
  GraphVersionSummary,
  GraphStats,
} from "../graph/types.js";

export interface PersistResult {
  graphVersion: {
    id: string;
    versionNumber: number;
    analysisTimestamp: Date;
    gitCommitHash: string | null;
    repositoryBranch: string | null;
    parserVersion: string | null;
  };
  stats: GraphStats;
  warnings: string[];
}

export class GraphService {
  constructor(
    private readonly graphRepo: GraphRepository = graphRepository,
    private readonly builder: GraphBuilder = graphBuilder
  ) {}

  async buildAndPersistGraph(
    projectId: string,
    parseResult: ParserManagerResult,
    metadata?: RepositoryMetadata | null
  ): Promise<PersistResult> {
    // 1. Build and validate graph
    const buildResult = this.builder.build(parseResult);

    // 2. Persist to PostgreSQL via Prisma transaction
    const graphVersion = await this.graphRepo.persistGraph(
      projectId,
      {
        gitCommitHash: metadata?.commitHash || null,
        repositoryBranch: metadata?.branch || null,
        parserVersion: "v1.0.0-m6",
      },
      buildResult.nodes,
      buildResult.edges
    );

    return {
      graphVersion: {
        id: graphVersion.id,
        versionNumber: graphVersion.versionNumber,
        analysisTimestamp: graphVersion.analysisTimestamp,
        gitCommitHash: graphVersion.gitCommitHash,
        repositoryBranch: graphVersion.repositoryBranch,
        parserVersion: graphVersion.parserVersion,
      },
      stats: buildResult.stats,
      warnings: buildResult.warnings,
    };
  }

  async getGraph(
    projectId: string,
    userId: string,
    versionId?: string
  ): Promise<ProjectGraphResponse> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    let targetVersionId = versionId;
    if (!targetVersionId) {
      if (project.currentGraphVersionId) {
        targetVersionId = project.currentGraphVersionId;
      } else {
        const latest = await this.graphRepo.findLatestVersion(projectId);
        if (!latest) {
          throw new NotFoundError(
            "No graph has been generated yet for this project",
            "GRAPH_NOT_FOUND"
          );
        }
        targetVersionId = latest.id;
      }
    }

    const graph = await this.graphRepo.getGraph(targetVersionId);
    if (!graph) {
      throw new NotFoundError("Graph version not found", "GRAPH_NOT_FOUND");
    }

    return graph;
  }

  async getModules(
    projectId: string,
    userId: string,
    versionId?: string
  ): Promise<ModuleSummaryItem[]> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    let targetVersionId = versionId || project.currentGraphVersionId;
    if (!targetVersionId) {
      const latest = await this.graphRepo.findLatestVersion(projectId);
      if (!latest) {
        return [];
      }
      targetVersionId = latest.id;
    }

    return this.graphRepo.getModules(targetVersionId);
  }

  async getModuleDetails(
    projectId: string,
    userId: string,
    moduleId: string,
    versionId?: string
  ): Promise<ModuleDetailResponse> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    let targetVersionId = versionId || project.currentGraphVersionId;
    if (!targetVersionId) {
      const latest = await this.graphRepo.findLatestVersion(projectId);
      if (!latest) {
        throw new NotFoundError("Graph not found", "GRAPH_NOT_FOUND");
      }
      targetVersionId = latest.id;
    }

    const details = await this.graphRepo.getModuleDetails(targetVersionId, moduleId);
    if (!details) {
      throw new NotFoundError(`Module '${moduleId}' not found in project graph`);
    }

    return details;
  }

  async getVersions(projectId: string, userId: string): Promise<GraphVersionSummary[]> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    return this.graphRepo.listVersions(projectId);
  }
}

export const graphService = new GraphService();
