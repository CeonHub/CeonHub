import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes";
import { applicationsRouter } from "../modules/applications/applications.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { candidatesRouter } from "../modules/candidates/candidates.routes";
import { companiesRouter } from "../modules/companies/companies.routes";
import { invitationsRouter } from "../modules/invitations/invitations.routes";
import { jobsRouter } from "../modules/jobs/jobs.routes";
import { skillsRouter } from "../modules/skills/skills.routes";
import { usersRouter } from "../modules/users/users.routes";

/**
 * Single mount point for every module router. Each module owns its own paths;
 * this file only decides the prefix.
 */
export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/companies", companiesRouter);
apiRouter.use("/candidates", candidatesRouter);
apiRouter.use("/jobs", jobsRouter);
apiRouter.use("/applications", applicationsRouter);
apiRouter.use("/invitations", invitationsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/skills", skillsRouter);
