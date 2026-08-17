import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authRateLimit } from "../../middleware/rateLimit";
import * as controller from "./auth.controller";
import * as linkedinController from "./linkedin.controller";

export const authRouter: Router = Router();

// There is no password registration: candidates and employers join with LinkedIn.
// Password sign-in remains for ADMIN accounts, which LinkedIn cannot create.
authRouter.post("/login", authRateLimit, controller.login);
authRouter.post("/logout", controller.logout);
authRouter.get("/me", requireAuth, controller.me);

/** Which social sign-in providers this deployment has configured. */
authRouter.get("/providers", linkedinController.providers);

// Sign in with LinkedIn (OpenID Connect). Both routes are browser navigations
// rather than API calls: they redirect instead of returning JSON.
authRouter.get("/linkedin", authRateLimit, linkedinController.linkedinStart);
authRouter.get("/linkedin/callback", linkedinController.linkedinCallback);
