import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import * as controller from "./applications.controller";

export const applicationsRouter: Router = Router();

// Every route is scoped to the caller inside the service: candidates see their own
// applications, employers those to their company's jobs, admins everything.
applicationsRouter.get("/", requireAuth, controller.list);
applicationsRouter.get("/:id", requireAuth, controller.getById);
applicationsRouter.patch("/:id", requireAuth, controller.updateStatus);
