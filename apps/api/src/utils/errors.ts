export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, errorCode: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", errorCode = "BAD_REQUEST", details?: unknown) {
    super(400, message, errorCode, details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", errorCode = "UNAUTHORIZED", details?: unknown) {
    super(401, message, errorCode, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", errorCode = "FORBIDDEN", details?: unknown) {
    super(403, message, errorCode, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", errorCode = "NOT_FOUND", details?: unknown) {
    super(404, message, errorCode, details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "Conflict with existing resource",
    errorCode = "CONFLICT",
    details?: unknown
  ) {
    super(409, message, errorCode, details);
    this.name = "ConflictError";
  }
}
