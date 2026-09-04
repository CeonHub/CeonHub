import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

export const listUsersSchema = paginationSchema.extend({
  q: z.string().trim().max(140).optional(),
  role: z.enum(["CANDIDATE", "EMPLOYER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export const listAdminJobsSchema = paginationSchema.extend({
  q: z.string().trim().max(140).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED", "HIDDEN"]).optional(),
});

/**
 * Moderation states. Content edits and the DRAFT/PAUSED transitions go through
 * PATCH /api/jobs/:id, which admins are also allowed to call.
 */
export const updateJobStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "HIDDEN", "CLOSED"]),
});

/**
 * Every company, unlike the public directory, which only lists those with a
 * published job. Staff need the empty ones too, to post the first job under them.
 */
export const listAdminCompaniesSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type ListAdminJobsInput = z.infer<typeof listAdminJobsSchema>;
export type ListAdminCompaniesInput = z.infer<typeof listAdminCompaniesSchema>;
