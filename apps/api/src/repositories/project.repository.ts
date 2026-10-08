import prisma from "../config/prisma.js";
import type { Project } from "@prisma/client";

export interface CreateProjectData {
  ownerId: string;
  name: string;
  description?: string | undefined;
  githubUrl: string;
  defaultBranch?: string | undefined;
}

export interface UpdateProjectData {
  name?: string | undefined;
  description?: string | undefined;
  defaultBranch?: string | undefined;
}

export class ProjectRepository {
  async create(data: CreateProjectData): Promise<Project> {
    return prisma.project.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        description: data.description || null,
        githubUrl: data.githubUrl,
        defaultBranch: data.defaultBranch || "main",
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: string, data: UpdateProjectData): Promise<Project> {
    return prisma.project.update({
      where: {
        id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.defaultBranch !== undefined ? { defaultBranch: data.defaultBranch } : {}),
      },
    });
  }

  async delete(id: string): Promise<Project> {
    return prisma.project.delete({
      where: {
        id,
      },
    });
  }

  async countByOwnerId(ownerId: string): Promise<number> {
    return prisma.project.count({
      where: {
        ownerId,
      },
    });
  }
}

export const projectRepository = new ProjectRepository();
