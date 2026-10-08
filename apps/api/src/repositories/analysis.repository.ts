import prisma from "../config/prisma.js";
import type { Analysis } from "@prisma/client";

export interface CreateAnalysisData {
  projectId: string;
  status: string;
  summary?: string | undefined;
  parserVersion?: string | undefined;
  graphVersionId?: string | undefined;
}

export interface UpdateAnalysisData {
  status?: string | undefined;
  summary?: string | undefined;
  analysisDuration?: number | undefined;
  graphVersionId?: string | undefined;
  parserVersion?: string | undefined;
}

export class AnalysisRepository {
  async create(data: CreateAnalysisData): Promise<Analysis> {
    return prisma.analysis.create({
      data: {
        projectId: data.projectId,
        status: data.status,
        summary: data.summary || null,
        parserVersion: data.parserVersion || null,
        graphVersionId: data.graphVersionId || null,
      },
    });
  }

  async update(id: string, data: UpdateAnalysisData): Promise<Analysis> {
    return prisma.analysis.update({
      where: {
        id,
      },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.analysisDuration !== undefined ? { analysisDuration: data.analysisDuration } : {}),
        ...(data.graphVersionId !== undefined ? { graphVersionId: data.graphVersionId } : {}),
        ...(data.parserVersion !== undefined ? { parserVersion: data.parserVersion } : {}),
      },
    });
  }

  async findById(id: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({
      where: {
        id,
      },
    });
  }

  async findLatestByProjectId(projectId: string): Promise<Analysis | null> {
    return prisma.analysis.findFirst({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async listByProjectId(projectId: string, limit = 10): Promise<Analysis[]> {
    return prisma.analysis.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }
}

export const analysisRepository = new AnalysisRepository();
