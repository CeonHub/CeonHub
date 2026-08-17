import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

export const applicationStatusValues = [
  "SUBMITTED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

/** Statuses an employer may set. Candidates may only withdraw. */
export const employerStatusValues = [
  "SUBMITTED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

export const createApplicationSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(applicationStatusValues),
});

export const listApplicationsSchema = paginationSchema.extend({
  status: z.enum(applicationStatusValues).optional(),
  jobId: z.string().trim().max(40).optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ListApplicationsInput = z.infer<typeof listApplicationsSchema>;
