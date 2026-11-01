import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import publicExploreRoutes from "./routes/public-explore.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

// Helper to determine if an incoming request origin is allowed by CORS
function isOriginAllowed(origin: string | undefined): boolean {
  // Allow requests with no origin (like curl, Postman, server-to-server, internal health checks)
  if (!origin) return true;

  const cleanOrigin = origin.trim().replace(/\/+$/, "");

  // 1. Always allow localhost and 127.0.0.1 on any port (for local development)
  if (
    /^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)
  ) {
    return true;
  }

  // 2. Allow configured CLIENT_URL (supports comma-separated list and strips trailing slashes)
  if (process.env.CLIENT_URL) {
    const configuredOrigins = process.env.CLIENT_URL.split(",")
      .map((url) => url.trim().replace(/\/+$/, ""))
      .filter(Boolean);

    if (configuredOrigins.includes(cleanOrigin)) {
      return true;
    }
  }

  // 3. Allow any Vercel deployment domain (production, preview branches, and team deployments)
  if (/^https:\/\/[a-zA-Z0-9_\-.]+\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Body parsing and cookie parsing middlewares
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      message: "Project Sarthi API is running",
      database: "connected",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      status: "error",
      message: "Project Sarthi API is running, but database connection failed",
      database: "disconnected",
      error: message,
    });
  }
});

// API Routes
app.use("/public", publicExploreRoutes);
app.use("/api/v1/public", publicExploreRoutes);
app.use("/api/public", publicExploreRoutes);
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);

// 404 Handler & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
