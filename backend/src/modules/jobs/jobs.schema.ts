import { z } from "zod";
import { JOB_CATEGORIES } from "../../utils/categories";
import { paginationSchema } from "../../utils/pagination";
import { MAX_SKILLS_PER_ENTITY } from "../skills/skills.service";
import { employmentTypeValues } from "../candidates/candidates.schema";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

/** Checkbox values arrive as "true"/"false" strings in query parameters. */
const booleanFlag = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");

export const jobStatusValues = ["DRAFT", "PUBLISHED", "PAUSED", "CLOSED"] as const;

export const createJobSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(140),
  description: z.string().trim().min(30, "Describe the role in at least 30 characters").max(20_000),
  location: optionalText(120),
  remote: booleanFlag.default(false),
  employmentType: z.enum(employmentTypeValues),
  category: z.enum(JOB_CATEGORIES),
  compensation: optionalText(80),
  currency: optionalText(8),
  immediateHire: booleanFlag.default(false),
  private: booleanFlag.default(false),
  internship: booleanFlag.default(false),
  freelance: booleanFlag.default(false),
  sideIncome: booleanFlag.default(false),
  /** Only DRAFT or PUBLISHED at creation; the rest are transitions. */
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  expiresAt: z.iso.datetime().nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(MAX_SKILLS_PER_ENTITY).optional(),
});

export const updateJobSchema = createJobSchema
  .omit({ status: true })
  .partial()
  .extend({
    /** Employers can move a job between these four states. HIDDEN is admin-only. */
    status: z.enum(jobStatusValues).optional(),
  });

export const listJobsSchema = paginationSchema.extend({
  q: z.string().trim().max(140).optional(),
  location: z.string().trim().max(120).optional(),
  remote: booleanFlag.optional(),
  employmentType: z.enum(employmentTypeValues).optional(),
  category: z.enum(JOB_CATEGORIES).optional(),
  immediateHire: booleanFlag.optional(),
  freelance: booleanFlag.optional(),
  internship: booleanFlag.optional(),
  sideIncome: booleanFlag.optional(),
  companyId: z.string().trim().max(40).optional(),
  skill: z.string().trim().max(60).optional(),
});

export const listMyJobsSchema = paginationSchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "HIDDEN"]).optional(),
  q: z.string().trim().max(140).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ListJobsInput = z.infer<typeof listJobsSchema>;
export type ListMyJobsInput = z.infer<typeof listMyJobsSchema>;
