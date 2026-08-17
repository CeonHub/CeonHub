import { z } from "zod";
import { MAX_PASSWORD_LENGTH } from "../../utils/password";

/** Normalise first, then validate, so "  Foo@Example.COM " and "foo@example.com" are one account. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters`);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");

/**
 * Only CANDIDATE and EMPLOYER can be chosen at registration. ADMIN accounts are
 * created by the seed script or by promoting a user directly in the database —
 * role is never accepted from the client for privileged access.
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["CANDIDATE", "EMPLOYER"]),
  name: nameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
