import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authRateLimit } from "../../middleware/rateLimit";
import * as controller from "./auth.controller";
import * as linkedinController from "./linkedin.controller";

export const authRouter: Router = Router();

// Candidates and employers join with LinkedIn, so there is no general password
// registration. Staff are the exception: LinkedIn cannot create an ADMIN, so they
// sign up and in with a password, gated on the staff email domain.
authRouter.post("/admin/register", authRateLimit, controller.registerAdmin);
authRouter.post("/login", authRateLimit, controller.login);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", requireAuth, controller.me);

/** Which social sign-in providers this deployment has configured. */
authRouter.get("/providers", linkedinController.providers);

// Sign in with LinkedIn (OpenID Connect). Both routes are browser navigations
// rather than API calls: they redirect instead of returning JSON.
authRouter.get("/linkedin", authRateLimit, linkedinController.linkedinStart);
authRouter.get("/linkedin/callback", linkedinController.linkedinCallback);
