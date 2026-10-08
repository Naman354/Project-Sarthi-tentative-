import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Fallback for unhandled unexpected exceptions
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : message,
    errorCode: "INTERNAL_SERVER_ERROR",
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
    errorCode: "NOT_FOUND",
  });
}
