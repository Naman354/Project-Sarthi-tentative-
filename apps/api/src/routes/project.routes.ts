import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { analysisController } from "../controllers/analysis.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createProjectSchema, updateProjectSchema } from "../utils/validators/project.validator.js";

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.post("/", validateBody(createProjectSchema), projectController.create);
router.get("/", projectController.list);
router.get("/:id", projectController.getById);
router.patch("/:id", validateBody(updateProjectSchema), projectController.update);
router.delete("/:id", projectController.delete);

// Milestone 4 & 5: Repository Integration, Analysis & Normalized Entities
router.post("/:id/analyze", analysisController.analyze);
router.get("/:id/status", analysisController.getStatus);
router.get("/:id/entities", analysisController.getEntities);

export default router;
