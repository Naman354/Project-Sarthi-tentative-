import prisma from "../config/prisma.js";
import type { Prisma, HealthMetric } from "@prisma/client";
import type { AnalysisHealthMetric } from "../analysis/types.js";

export class HealthMetricRepository {
  async replaceMetrics(projectId: string, metrics: AnalysisHealthMetric[]): Promise<number> {
    return prisma.$transaction(async (tx) => {
      // Clear previous metrics for this project
      await tx.healthMetric.deleteMany({
        where: { projectId },
      });

      if (metrics.length === 0) return 0;

      const created = await tx.healthMetric.createMany({
        data: metrics.map((m) => ({
          projectId,
          name: m.name,
          value: m.value,
          details: m.details as Prisma.InputJsonValue,
        })),
      });

      return created.count;
    });
  }

  async findByProjectId(projectId: string): Promise<HealthMetric[]> {
    return prisma.healthMetric.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const healthMetricRepository = new HealthMetricRepository();
