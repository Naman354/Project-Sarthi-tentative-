import type { Response, NextFunction } from "express";
import {
  analysisEngineService,
  type AnalysisEngineService,
} from "../services/analysis-engine.service.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { UnauthorizedError } from "../utils/errors.js";

export class AnalysisEngineController {
  constructor(private readonly service: AnalysisEngineService = analysisEngineService) {}

  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required", "UNAUTHORIZED");
    }
    return req.user.id;
  }

  getOverview = async (
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

      const overview = await this.service.getOverview(projectId, userId);

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  };

  getInsights = async (
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

      const insights = await this.service.getInsights(projectId, userId);

      res.status(200).json({
        success: true,
        data: {
          insights,
          total: insights.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getHealth = async (
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

      const health = await this.service.getHealth(projectId, userId);

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  };

  getResume = async (
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

      const resume = await this.service.getResume(projectId, userId);

      res.status(200).json({
        success: true,
        data: resume,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const analysisEngineController = new AnalysisEngineController();
