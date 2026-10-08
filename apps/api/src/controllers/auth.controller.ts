import type { Request, Response, NextFunction } from "express";
import { authService, type AuthService } from "../services/auth.service.js";
import {
  JWT_CONFIG,
  getRefreshTokenCookieOptions,
  getClearRefreshTokenCookieOptions,
} from "../config/jwt.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { UnauthorizedError } from "../utils/errors.js";

export class AuthController {
  constructor(private readonly auth: AuthService = authService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.auth.register(req.body);

      res.cookie(JWT_CONFIG.cookieName, result.refreshToken, getRefreshTokenCookieOptions());

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.auth.login(req.body);

      res.cookie(JWT_CONFIG.cookieName, result.refreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = (req.cookies as Record<string, string> | undefined)?.[
        JWT_CONFIG.cookieName
      ];

      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token is required", "MISSING_REFRESH_TOKEN");
      }

      const result = await this.auth.refresh(refreshToken);

      res.cookie(JWT_CONFIG.cookieName, result.newRefreshToken, getRefreshTokenCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie(JWT_CONFIG.cookieName, getClearRefreshTokenCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          message: "Logged out successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
