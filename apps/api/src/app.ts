import express from "express";
import cors from "cors";
import prisma from "./config/prisma.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

export default app;
