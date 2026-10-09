import prisma from "../config/prisma.js";
import type { Insight } from "@prisma/client";
import type { AnalysisInsight } from "../analysis/types.js";

export class InsightRepository {
  async createMany(
    projectId: string,
    analysisId: string | null | undefined,
    insights: AnalysisInsight[]
  ): Promise<number> {
    if (insights.length === 0) return 0;

    const result = await prisma.insight.createMany({
      data: insights.map((i) => ({
        projectId,
        analysisId: analysisId || null,
        title: i.title,
        description: i.description,
        severity: i.severity,
        relatedNodeId: i.relatedNodeId || null,
        relatedModule: i.relatedModule || null,
      })),
    });

    return result.count;
  }

  async findByProjectId(projectId: string, limit = 50): Promise<Insight[]> {
    return prisma.insight.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findByAnalysisId(analysisId: string): Promise<Insight[]> {
    return prisma.insight.findMany({
      where: { analysisId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteByProjectId(projectId: string): Promise<number> {
    const result = await prisma.insight.deleteMany({
      where: { projectId },
    });
    return result.count;
  }
}

export const insightRepository = new InsightRepository();
