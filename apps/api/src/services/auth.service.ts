import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import type { AuthJwtPayload, AuthUser, TokenPair } from "../types/auth.types.js";
import type { LoginInput, RegisterInput } from "../utils/validators/auth.validator.js";
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from "../utils/errors.js";
import type { User } from "@prisma/client";

const BCRYPT_SALT_ROUNDS = 12;

export class AuthService {
  constructor(private readonly userRepo: UserRepository = userRepository) {}

  toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: AuthJwtPayload): TokenPair {
    const accessToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      JWT_CONFIG.accessSecret,
      { expiresIn: JWT_CONFIG.accessExpiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      JWT_CONFIG.refreshSecret,
      { expiresIn: JWT_CONFIG.refreshExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): AuthJwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.accessSecret) as jwt.JwtPayload;
      if (!decoded["userId"] || !decoded["email"]) {
        throw new UnauthorizedError("Malformed token payload", "INVALID_TOKEN");
      }
      return {
        userId: decoded["userId"] as string,
        email: decoded["email"] as string,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Access token has expired", "TOKEN_EXPIRED");
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid access token", "INVALID_TOKEN");
    }
  }

  verifyRefreshToken(token: string): AuthJwtPayload {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.refreshSecret) as jwt.JwtPayload;
      if (!decoded["userId"] || !decoded["email"]) {
        throw new UnauthorizedError("Malformed refresh token payload", "INVALID_TOKEN");
      }
      return {
        userId: decoded["userId"] as string,
        email: decoded["email"] as string,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Refresh token has expired", "REFRESH_TOKEN_EXPIRED");
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }
  }

  async register(
    input: RegisterInput
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists", "EMAIL_EXISTS");
    }

    const passwordHash = await this.hashPassword(input.password);
    const createdUser = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const userPayload: AuthJwtPayload = {
      userId: createdUser.id,
      email: createdUser.email,
    };

    const tokens = this.generateTokens(userPayload);

    return {
      user: this.toAuthUser(createdUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    input: LoginInput
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await this.comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const userPayload: AuthJwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const tokens = this.generateTokens(userPayload);

    return {
      user: this.toAuthUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(
    refreshToken: string
  ): Promise<{ user: AuthUser; accessToken: string; newRefreshToken: string }> {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError("User associated with token no longer exists", "USER_NOT_FOUND");
    }

    const userPayload: AuthJwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const tokens = this.generateTokens(userPayload);

    return {
      user: this.toAuthUser(user),
      accessToken: tokens.accessToken,
      newRefreshToken: tokens.refreshToken,
    };
  }

  async getUserProfile(userId: string): Promise<AuthUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }
    return this.toAuthUser(user);
  }
}

export const authService = new AuthService();
