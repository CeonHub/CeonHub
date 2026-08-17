import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { MAX_SKILLS_PER_ENTITY } from "../skills/skills.service";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .refine(
    (value) => value == null || /^https?:\/\/\S+$/i.test(value),
    "Enter a full URL starting with http:// or https://",
  );

export const availabilityValues = ["AVAILABLE_NOW", "AVAILABLE_SOON", "NOT_AVAILABLE"] as const;

export const employmentTypeValues = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
  "TEMPORARY",
] as const;

export const updateCandidateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  headline: optionalText(140),
  bio: optionalText(4000),
  location: optionalText(120),
  country: optionalText(60),
  availability: z.enum(availabilityValues).optional(),
  desiredEmployment: z.enum(employmentTypeValues).nullable().optional(),
  portfolioUrl: optionalUrl,
  profileVisibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  /** Free-text skill names; unknown ones are created. */
  skills: z.array(z.string().trim().min(1).max(60)).max(MAX_SKILLS_PER_ENTITY).optional(),
});

export const listCandidatesSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  availability: z.enum(availabilityValues).optional(),
  country: z.string().trim().max(60).optional(),
  employmentType: z.enum(employmentTypeValues).optional(),
  /** Skill slug, as returned by GET /api/skills. */
  skill: z.string().trim().max(60).optional(),
});

export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type ListCandidatesInput = z.infer<typeof listCandidatesSchema>;
