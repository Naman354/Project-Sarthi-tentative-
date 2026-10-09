import type { Project, Analysis } from "@prisma/client";
import type { ModuleSummaryItem, GraphStats, GraphVersionSummary } from "../graph/types.js";

export type InsightSeverity = "low" | "medium" | "high" | "critical";

export interface AnalysisInsight {
  title: string;
  description: string;
  severity: InsightSeverity;
  relatedNodeId?: string | undefined;
  relatedModule?: string | undefined;
}

export type HealthStatus = "healthy" | "warning" | "critical";

export interface AnalysisHealthMetric {
  name: string;
  value: number; // e.g. percentage or normalized score 0 - 100
  status: HealthStatus;
  details: Record<string, unknown>;
}

export interface ProjectHealthReport {
  overallScore: number;
  status: HealthStatus;
  metrics: AnalysisHealthMetric[];
  evaluatedAt: Date;
}

export interface NavigationRecommendation {
  title: string;
  targetModule: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface ResumeSessionBriefing {
  lastAnalyzed: Date | null;
  timeSinceLastAnalysis: string;
  hasPreviousVersion: boolean;
  previousVersionNumber?: number | undefined;
  currentVersionNumber: number;
  changesSummary: {
    nodesAdded: number;
    nodesRemoved: number;
    edgesAdded: number;
    edgesRemoved: number;
    modifiedModules: string[];
  };
  suggestedStartingPoint: {
    moduleName: string;
    rationale: string;
  };
  navigationRecommendations: NavigationRecommendation[];
  keyRisks: string[];
}

export interface ProjectOverviewData {
  project: Project;
  latestAnalysis: Analysis | null;
  graphVersion: GraphVersionSummary | null;
  stats: GraphStats | null;
  modules: ModuleSummaryItem[];
  topInsights: AnalysisInsight[];
  health: ProjectHealthReport;
}
