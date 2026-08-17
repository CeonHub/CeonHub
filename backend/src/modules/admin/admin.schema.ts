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

/** Admins hide or close jobs; they do not edit their content. */
export const updateJobStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "HIDDEN", "CLOSED"]),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type ListAdminJobsInput = z.infer<typeof listAdminJobsSchema>;
