import type { CookieOptions } from "express";

export const JWT_CONFIG = {
  accessSecret: process.env.JWT_ACCESS_SECRET || "sarthi_dev_jwt_access_secret_key_default_32bytes",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || "sarthi_dev_jwt_refresh_secret_key_default_32bytes",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  cookieName: "refreshToken",
} as const;

export const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

export function getClearRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
}
