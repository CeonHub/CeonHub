import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authRateLimit } from "../../middleware/rateLimit";
import * as controller from "./users.controller";

export const usersRouter: Router = Router();

usersRouter.patch("/me", requireAuth, controller.updateProfile);
usersRouter.patch("/me/password", requireAuth, authRateLimit, controller.changePassword);
