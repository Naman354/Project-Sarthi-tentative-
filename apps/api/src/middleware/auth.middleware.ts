import type { Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import type { AuthenticatedRequest } from "../types/auth.types.js";
import { UnauthorizedError } from "../utils/errors.js";

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "Authorization header with Bearer token is required",
        "UNAUTHORIZED"
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Bearer token is missing", "UNAUTHORIZED");
    }

    const payload = authService.verifyAccessToken(token);
    const user = await authService.getUserProfile(payload.userId);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
