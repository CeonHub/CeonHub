import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./companies.controller";

export const companiesRouter: Router = Router();

// Public.
companiesRouter.get("/", controller.list);

// Employer-owned. Declared before "/:id" so "mine" is not read as an id.
companiesRouter.get("/mine", requireAuth, requireRole("EMPLOYER"), controller.getMine);
companiesRouter.post("/", requireAuth, requireRole("EMPLOYER"), controller.create);
companiesRouter.patch("/:id", requireAuth, requireRole("EMPLOYER", "ADMIN"), controller.update);

// Public, by id or slug.
companiesRouter.get("/:id", controller.getById);
