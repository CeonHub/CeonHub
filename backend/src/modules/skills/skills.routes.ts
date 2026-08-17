import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/response";
import { searchSkills } from "./skills.service";

const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const skillsRouter: Router = Router();

/** Public: powers the skill pickers on profile and job forms. */
skillsRouter.get("/", async (req, res) => {
  const { q, limit } = querySchema.parse(req.query);
  sendSuccess(res, { skills: await searchSkills(q, limit) });
});
