import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./admin.controller";

export const adminRouter: Router = Router();

// Every admin route sits behind both middlewares; no admin action is reachable
// without an ADMIN role checked against the database on this request.
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/stats", controller.stats);
adminRouter.get("/users", controller.listUsers);
adminRouter.patch("/users/:id/status", controller.setUserStatus);
adminRouter.get("/jobs", controller.listJobs);
adminRouter.patch("/jobs/:id/status", controller.setJobStatus);
adminRouter.get("/companies", controller.listCompanies);
