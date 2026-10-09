import { projectRepository } from "../repositories/project.repository.js";
import { graphRepository, type GraphRepository } from "../repositories/graph.repository.js";
import {
  analysisRepository,
  type AnalysisRepository,
} from "../repositories/analysis.repository.js";
import { insightRepository, type InsightRepository } from "../repositories/insight.repository.js";
import {
  healthMetricRepository,
  type HealthMetricRepository,
} from "../repositories/health.repository.js";
import {
  analysisEngine,
  type AnalysisEngine,
  type EngineAnalysisResult,
} from "../analysis/engine.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type {
  ProjectOverviewData,
  ProjectHealthReport,
  ResumeSessionBriefing,
  AnalysisInsight,
  HealthStatus,
  AnalysisHealthMetric,
} from "../analysis/types.js";
import type { Insight } from "@prisma/client";

export class AnalysisEngineService {
  constructor(
    private readonly projectRepo = projectRepository,
    private readonly graphRepo: GraphRepository = graphRepository,
    private readonly analysisRepo: AnalysisRepository = analysisRepository,
    private readonly insightRepo: InsightRepository = insightRepository,
    private readonly healthRepo: HealthMetricRepository = healthMetricRepository,
    private readonly engine: AnalysisEngine = analysisEngine
  ) {}

  async runAnalysis(
    projectId: string,
    analysisId: string,
    graphVersionId: string
  ): Promise<EngineAnalysisResult> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const currentGraph = await this.graphRepo.getGraph(graphVersionId);
    if (!currentGraph) {
      throw new NotFoundError("Current graph version not found");
    }

    const modules = await this.graphRepo.getModules(graphVersionId);

    // Look for previous graph version to compute diffs/resume briefing
    let previousGraph = null;
    const allVersions = await this.graphRepo.listVersions(projectId);
    const previousVersion = allVersions.find(
      (v) => v.versionNumber === currentGraph.version.versionNumber - 1
    );
    if (previousVersion) {
      previousGraph = await this.graphRepo.getGraph(previousVersion.id);
    }

    // Run Analysis Engine algorithms
    const result = this.engine.analyze(currentGraph, modules, previousGraph, project.lastAnalysis);

    // Persist Insights and Health Metrics in PostgreSQL
    await this.insightRepo.createMany(projectId, analysisId, result.insights);
    await this.healthRepo.replaceMetrics(projectId, result.health.metrics);

    return result;
  }

  async getOverview(projectId: string, userId: string): Promise<ProjectOverviewData> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const latestAnalysis = await this.analysisRepo.findLatestByProjectId(projectId);
    const versions = await this.graphRepo.listVersions(projectId);
    const latestVersionSummary = versions[0] || null;

    let stats = null;
    let modules: ProjectOverviewData["modules"] = [];
    let healthReport: ProjectHealthReport = {
      overallScore: 100,
      status: "healthy",
      metrics: [],
      evaluatedAt: new Date(),
    };

    if (latestVersionSummary) {
      const graph = await this.graphRepo.getGraph(latestVersionSummary.id);
      if (graph) {
        stats = graph.stats;
        modules = await this.graphRepo.getModules(latestVersionSummary.id);
        const engineResult = this.engine.analyze(graph, modules);
        healthReport = engineResult.health;
      }
    }

    const dbInsights = await this.insightRepo.findByProjectId(projectId, 5);
    const topInsights: AnalysisInsight[] = dbInsights.map((i) => ({
      title: i.title,
      description: i.description,
      severity: i.severity as AnalysisInsight["severity"],
      relatedNodeId: i.relatedNodeId || undefined,
      relatedModule: i.relatedModule || undefined,
    }));

    return {
      project,
      latestAnalysis,
      graphVersion: latestVersionSummary,
      stats,
      modules,
      topInsights,
      health: healthReport,
    };
  }

  async getInsights(projectId: string, userId: string): Promise<Insight[]> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    return this.insightRepo.findByProjectId(projectId);
  }

  async getHealth(projectId: string, userId: string): Promise<ProjectHealthReport> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const latestVersion = await this.graphRepo.findLatestVersion(projectId);
    if (!latestVersion) {
      return {
        overallScore: 0,
        status: "critical",
        metrics: [],
        evaluatedAt: new Date(),
      };
    }

    const graph = await this.graphRepo.getGraph(latestVersion.id);
    if (!graph) {
      return {
        overallScore: 0,
        status: "critical",
        metrics: [],
        evaluatedAt: new Date(),
      };
    }

    const modules = await this.graphRepo.getModules(latestVersion.id);
    const persistedDbMetrics = await this.healthRepo.findByProjectId(projectId);

    if (persistedDbMetrics.length > 0) {
      const metrics: AnalysisHealthMetric[] = persistedDbMetrics.map((m) => {
        const val = m.value ?? 0;
        const status: HealthStatus = val >= 75 ? "healthy" : val >= 45 ? "warning" : "critical";
        return {
          name: m.name,
          value: val,
          status,
          details: (m.details as Record<string, unknown>) || {},
        };
      });

      const overallScore = Math.round(
        metrics.reduce((acc, m) => acc + m.value, 0) / Math.max(1, metrics.length)
      );
      const overallStatus: HealthStatus =
        overallScore >= 80 ? "healthy" : overallScore >= 55 ? "warning" : "critical";

      return {
        overallScore,
        status: overallStatus,
        metrics,
        evaluatedAt: new Date(),
      };
    }

    // Compute fresh if not persisted yet
    const computed = this.engine.analyze(graph, modules);
    return computed.health;
  }

  async getResume(projectId: string, userId: string): Promise<ResumeSessionBriefing> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenError("You do not have access to this project");
    }

    const versions = await this.graphRepo.listVersions(projectId);
    const currentVersionSummary = versions[0];
    if (!currentVersionSummary) {
      throw new NotFoundError("No graph versions available for this project. Run analysis first.");
    }

    const currentGraph = await this.graphRepo.getGraph(currentVersionSummary.id);
    if (!currentGraph) {
      throw new NotFoundError("Current graph data not found");
    }

    const modules = await this.graphRepo.getModules(currentVersionSummary.id);

    let previousGraph = null;
    const prevVersion = versions[1];
    if (prevVersion) {
      previousGraph = await this.graphRepo.getGraph(prevVersion.id);
    }

    const engineResult = this.engine.analyze(
      currentGraph,
      modules,
      previousGraph,
      project.lastAnalysis
    );

    return engineResult.resume;
  }
}

export const analysisEngineService = new AnalysisEngineService();
