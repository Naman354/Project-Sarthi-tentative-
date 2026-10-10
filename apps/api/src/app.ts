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

// CORS configuration allowing credentials for cookies
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

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
