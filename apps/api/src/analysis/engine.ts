import type { ProjectGraphResponse, ModuleSummaryItem } from "../graph/types.js";
import { healthAnalyzer, type HealthAnalyzer } from "./health.analyzer.js";
import { insightGenerator, type InsightGenerator } from "./insight.generator.js";
import { resumeGenerator, type ResumeGenerator } from "./resume.generator.js";
import type { ProjectHealthReport, AnalysisInsight, ResumeSessionBriefing } from "./types.js";

export interface EngineAnalysisResult {
  health: ProjectHealthReport;
  insights: AnalysisInsight[];
  resume: ResumeSessionBriefing;
}

export class AnalysisEngine {
  constructor(
    private readonly health: HealthAnalyzer = healthAnalyzer,
    private readonly insights: InsightGenerator = insightGenerator,
    private readonly resume: ResumeGenerator = resumeGenerator
  ) {}

  analyze(
    currentGraph: ProjectGraphResponse,
    modules: ModuleSummaryItem[],
    previousGraph: ProjectGraphResponse | null = null,
    lastAnalysisDate: Date | null = null
  ): EngineAnalysisResult {
    // 1. Compute project health metrics
    const healthReport = this.health.analyze(currentGraph, modules);

    // 2. Generate human-readable insights
    const generatedInsights = this.insights.generate(currentGraph, modules, healthReport);

    // 3. Generate Resume Session briefing
    const resumeBriefing = this.resume.generate(
      currentGraph,
      previousGraph,
      modules,
      healthReport,
      generatedInsights,
      lastAnalysisDate
    );

    return {
      health: healthReport,
      insights: generatedInsights,
      resume: resumeBriefing,
    };
  }
}

export const analysisEngine = new AnalysisEngine();
