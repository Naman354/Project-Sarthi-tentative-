import type { Request } from "express";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthJwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  errors?: unknown[];
}
