import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { analysisController } from "../controllers/analysis.controller.js";
import { graphController } from "../controllers/graph.controller.js";
import { analysisEngineController } from "../controllers/analysis-engine.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createProjectSchema, updateProjectSchema } from "../utils/validators/project.validator.js";

const router = Router();

// Mutating and private collection routes require full authentication
router.post("/", authenticate, validateBody(createProjectSchema), projectController.create);
router.get("/", authenticate, projectController.list);
router.patch("/:id", authenticate, validateBody(updateProjectSchema), projectController.update);
router.delete("/:id", authenticate, projectController.delete);
router.post("/:id/analyze", authenticate, analysisController.analyze);

// Public/read repository endpoints allow guest access for public repos or authenticated owner access
router.get("/:id", optionalAuthenticate, projectController.getById);
router.get("/:id/status", optionalAuthenticate, analysisController.getStatus);
router.get("/:id/entities", optionalAuthenticate, analysisController.getEntities);

// Milestone 6: Project Graph Builder & Module Endpoints
router.get("/:id/graph", optionalAuthenticate, graphController.getGraph);
router.get("/:id/graph/versions", optionalAuthenticate, graphController.getVersions);
router.get("/:id/modules", optionalAuthenticate, graphController.getModules);
router.get("/:id/module/:moduleId", optionalAuthenticate, graphController.getModuleById);

// Milestone 7: Analysis Engine & Insight Generation Endpoints
router.get("/:id/overview", optionalAuthenticate, analysisEngineController.getOverview);
router.get("/:id/insights", optionalAuthenticate, analysisEngineController.getInsights);
router.get("/:id/health", optionalAuthenticate, analysisEngineController.getHealth);
router.get("/:id/resume", optionalAuthenticate, analysisEngineController.getResume);


export default router;
