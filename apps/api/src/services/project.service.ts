import { projectRepository, type ProjectRepository } from "../repositories/project.repository.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../utils/validators/project.validator.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { Project } from "@prisma/client";

export class ProjectService {
  constructor(private readonly projectRepo: ProjectRepository = projectRepository) {}

  normalizeGithubUrl(url: string): string {
    let cleanUrl = url.trim();
    // Remove trailing slash
    while (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    // Remove .git suffix
    if (cleanUrl.endsWith(".git")) {
      cleanUrl = cleanUrl.slice(0, -4);
    }
    return cleanUrl;
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<Project> {
    const normalizedUrl = this.normalizeGithubUrl(input.githubUrl);

    return this.projectRepo.create({
      ownerId: userId,
      name: input.name,
      description: input.description,
      githubUrl: normalizedUrl,
      defaultBranch: input.defaultBranch || "main",
    });
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return this.projectRepo.findByOwnerId(userId);
  }

  async getProjectById(userId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found", "PROJECT_NOT_FOUND");
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenError(
        "You do not have permission to access this project",
        "FORBIDDEN_PROJECT_ACCESS"
      );
    }

    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<Project> {
    // Validate project existence and ownership
    await this.getProjectById(userId, projectId);

    return this.projectRepo.update(projectId, input);
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    // Validate project existence and ownership
    await this.getProjectById(userId, projectId);

    await this.projectRepo.delete(projectId);
  }
}

export const projectService = new ProjectService();
