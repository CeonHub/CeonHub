import { z } from "zod";
import { adminEmailDomain, isAdminEmail } from "../../config/env";
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
 * created by the seed script or by promoting a user directly in the database,
 * role is never accepted from the client for privileged access.
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["CANDIDATE", "EMPLOYER"]),
  name: nameSchema,
});

/**
 * Staff sign-up. The role is not accepted from the client here either, so reaching
 * this endpoint at all is what asks for ADMIN, and the email domain is the gate.
 *
 * Note this proves only that the address is *on* the domain, not that the person
 * sending it can receive mail there: nothing in the system verifies an address.
 * See docs/architecture.md ("Staff accounts") for what that does and does not buy.
 */
export const adminRegisterSchema = z.object({
  email: emailSchema.refine(
    isAdminEmail,
    `Staff accounts must use an @${adminEmailDomain} email address`,
  ),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
