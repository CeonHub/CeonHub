import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./invitations.controller";

export const invitationsRouter: Router = Router();

invitationsRouter.post("/", requireAuth, requireRole("EMPLOYER"), controller.create);
invitationsRouter.get("/", requireAuth, controller.list);
invitationsRouter.get("/:id", requireAuth, controller.getById);
// Answering an invitation is the invited candidate's decision alone.
invitationsRouter.patch("/:id", requireAuth, requireRole("CANDIDATE"), controller.respond);
