import { z } from "zod";
import { passwordSchema } from "../auth/auth.schema";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

/**
 * Display details that live on the role-specific profile. Candidates edit the rest
 * of their profile through /api/candidates/me.
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  /** Employers only: job title at their company. */
  title: z
    .string()
    .trim()
    .max(120)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
});
