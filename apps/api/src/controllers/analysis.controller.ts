import type { Response, NextFunction } from "express";
import { analysisService, type AnalysisService } from "../services/analysis.service.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { UnauthorizedError } from "../utils/errors.js";

export class AnalysisController {
  constructor(private readonly service: AnalysisService = analysisService) {}

  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required", "UNAUTHORIZED");
    }
    return req.user.id;
  }

  analyze = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const result = await this.service.analyzeProject(projectId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (
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

      const status = await this.service.getProjectStatus(projectId, userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };

  getEntities = async (
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

      const result = await this.service.getProjectEntities(projectId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const analysisController = new AnalysisController();
