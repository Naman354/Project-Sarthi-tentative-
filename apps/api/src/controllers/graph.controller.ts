import type { Response, NextFunction } from "express";
import { graphService, type GraphService } from "../services/graph.service.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { UnauthorizedError } from "../utils/errors.js";

export class GraphController {
  constructor(private readonly service: GraphService = graphService) {}

  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required", "UNAUTHORIZED");
    }
    return req.user.id;
  }

  getGraph = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      if (!projectId || typeof projectId !== "string") {
        res.status(400).json({
          success: false,
          message: "Valid project ID is required",
        });
        return;
      }

      const versionId = req.query["version"] as string | undefined;
      const graph = await this.service.getGraph(projectId, userId, versionId);

      res.status(200).json({
        success: true,
        data: graph,
      });
    } catch (error) {
      next(error);
    }
  };

  getModules = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      if (!projectId || typeof projectId !== "string") {
        res.status(400).json({
          success: false,
          message: "Valid project ID is required",
        });
        return;
      }

      const versionId = req.query["version"] as string | undefined;
      const modules = await this.service.getModules(projectId, userId, versionId);

      res.status(200).json({
        success: true,
        data: {
          modules,
          total: modules.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getModuleById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      const moduleId = req.params["moduleId"];

      if (
        !projectId ||
        typeof projectId !== "string" ||
        !moduleId ||
        typeof moduleId !== "string"
      ) {
        res.status(400).json({
          success: false,
          message: "Valid project ID and module ID are required",
        });
        return;
      }

      const versionId = req.query["version"] as string | undefined;
      const moduleDetails = await this.service.getModuleDetails(
        projectId,
        userId,
        moduleId,
        versionId
      );

      res.status(200).json({
        success: true,
        data: moduleDetails,
      });
    } catch (error) {
      next(error);
    }
  };

  getVersions = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const projectId = req.params["id"];
      if (!projectId || typeof projectId !== "string") {
        res.status(400).json({
          success: false,
          message: "Valid project ID is required",
        });
        return;
      }

      const versions = await this.service.getVersions(projectId, userId);

      res.status(200).json({
        success: true,
        data: {
          versions,
          total: versions.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const graphController = new GraphController();
