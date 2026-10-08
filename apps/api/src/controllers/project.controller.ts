import type { Response, NextFunction } from "express";
import { projectService, type ProjectService } from "../services/project.service.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { UnauthorizedError } from "../utils/errors.js";

export class ProjectController {
  constructor(private readonly project: ProjectService = projectService) {}

  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required", "UNAUTHORIZED");
    }
    return req.user.id;
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const project = await this.project.createProject(userId, req.body);

      res.status(201).json({
        success: true,
        data: {
          project,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projects = await this.project.getProjectsByUser(userId);

      res.status(200).json({
        success: true,
        data: {
          projects,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      if (!projectId || typeof projectId !== "string") {
        res.status(400).json({ success: false, message: "Valid project ID is required" });
        return;
      }

      const project = await this.project.getProjectById(userId, projectId);

      res.status(200).json({
        success: true,
        data: {
          project,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      if (!projectId || typeof projectId !== "string") {
        res.status(400).json({ success: false, message: "Valid project ID is required" });
        return;
      }

      const project = await this.project.updateProject(userId, projectId, req.body);

      res.status(200).json({
        success: true,
        data: {
          project,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      if (!projectId || typeof projectId !== "string") {
        res.status(400).json({ success: false, message: "Valid project ID is required" });
        return;
      }

      await this.project.deleteProject(userId, projectId);

      res.status(200).json({
        success: true,
        data: {
          message: "Project deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const projectController = new ProjectController();
