import { Router } from "express";
import { publicExploreController } from "../controllers/public-explore.controller.js";

const router = Router();

// Anonymous public exploration routes - no registration or login required
router.post("/explore", (req, res, next) => {
  publicExploreController.explore(req, res).catch(next);
});

router.get("/explore/preview", (req, res, next) => {
  publicExploreController.preview(req, res).catch(next);
});

export default router;
