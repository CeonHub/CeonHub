import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import * as applicationsController from "../applications/applications.controller";
import * as controller from "./jobs.controller";

export const jobsRouter: Router = Router();

// Public search. Only published, non-private, unexpired jobs are returned.
jobsRouter.get("/", controller.list);
jobsRouter.get("/meta", controller.meta);

// Employer-owned listing, declared before "/:id".
jobsRouter.get("/mine", requireAuth, requireRole("EMPLOYER"), controller.listMine);

jobsRouter.post("/", requireAuth, requireRole("EMPLOYER"), controller.create);

// optionalAuth: the response depends on who is asking (owner, invited candidate, …).
jobsRouter.get("/:id", optionalAuth, controller.getById);

jobsRouter.patch("/:id", requireAuth, requireRole("EMPLOYER", "ADMIN"), controller.update);
jobsRouter.delete("/:id", requireAuth, requireRole("EMPLOYER", "ADMIN"), controller.remove);

// Applying belongs to the job's URL space; the handler lives in the applications module.
jobsRouter.post(
  "/:id/applications",
  requireAuth,
  requireRole("CANDIDATE"),
  applicationsController.create,
);
