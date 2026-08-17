import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { uploadResume } from "../../middleware/upload";
import * as controller from "./candidates.controller";

export const candidatesRouter: Router = Router();

// Candidate profiles are never public: only employers (searching for talent) and
// admins can browse them, and only profiles set to PUBLIC are listed.
candidatesRouter.get("/", requireAuth, requireRole("EMPLOYER", "ADMIN"), controller.list);

// "me" routes come first so they are not captured by "/:id".
candidatesRouter.get("/me", requireAuth, requireRole("CANDIDATE"), controller.getMine);
candidatesRouter.patch("/me", requireAuth, requireRole("CANDIDATE"), controller.updateMine);
candidatesRouter.get("/me/resumes", requireAuth, requireRole("CANDIDATE"), controller.listResumes);
candidatesRouter.post(
  "/me/resume",
  requireAuth,
  requireRole("CANDIDATE"),
  uploadResume,
  controller.uploadResume,
);

candidatesRouter.get("/:id", requireAuth, controller.getById);
candidatesRouter.patch("/:id", requireAuth, controller.updateById);
