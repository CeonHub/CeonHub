import { adminEmailDomain, isAdminEmail } from "../../config/env";
import { prisma } from "../../database/prisma";
import { ApiError } from "../../utils/apiError";
import { recordAudit } from "../../utils/audit";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/token";
import { getSessionUser, type SessionUser } from "../users/users.service";
import type { AdminRegisterInput, LoginInput } from "./auth.schema";

export interface AuthResult {
  token: string;
  user: SessionUser;
}

/**
 * Staff sign-up: creates an ADMIN account with a password.
 *
 * The email domain is the only thing standing between a stranger and an admin
 * account, so the check is repeated here rather than trusted from the schema
 * alone. This function is what a future caller (a CLI, a seed) would reach for,
 * and it must not depend on its caller having validated first.
 */
export async function registerAdmin(input: AdminRegisterInput): Promise<AuthResult> {
  if (!isAdminEmail(input.email)) {
    throw ApiError.badRequest(`Staff accounts must use an @${adminEmailDomain} email address`);
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict("An account with that email address already exists");
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: "ADMIN",
    },
    select: { id: true, role: true },
  });

  // An account granting itself admin is worth a row even though nobody but the
  // new admin was involved: it is the one action here with no prior actor.
  await recordAudit({
    actorId: user.id,
    action: "user.admin.registered",
    entityType: "USER",
    entityId: user.id,
    metadata: { email: input.email },
  });

  return {
    token: signToken({ sub: user.id, role: user.role }),
    user: await getSessionUser(user.id),
  };
}

/**
 * Password sign-in, reserved for staff.
 *
 * Candidates and employers join and return through LinkedIn (see
 * linkedin.service.ts); there is no password registration for them. Admins register
 * with `registerAdmin` above and keep a password, and this is the only route that
 * accepts one.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true, role: true, status: true },
  });

  // Same message whether the email is unknown or the password is wrong: the API
  // must not tell an attacker which addresses are registered.
  const invalid = ApiError.unauthorized("Invalid email or password");
  if (!user) {
    // Still spend time hashing so the response time does not reveal the answer.
    await hashPassword(input.password);
    throw invalid;
  }

  // Candidate and employer accounts sign in with LinkedIn. Saying so discloses that
  // the address is registered, but the alternative is someone who can never work out
  // why their correct credentials are rejected.
  if (user.role !== "ADMIN" || !user.passwordHash) {
    throw ApiError.badRequest(
      "This account signs in with LinkedIn. Use the “Continue with LinkedIn” button.",
    );
  }

  // The domain gate applies on the way in as well as at sign-up, so an admin whose
  // address predates the rule (or was moved off the domain) cannot keep signing in.
  // It sits after the role check on purpose: a candidate typing their own address
  // here should still be told to use LinkedIn rather than about the staff domain.
  if (!isAdminEmail(input.email)) {
    throw ApiError.forbidden(
      `Staff sign-in is limited to @${adminEmailDomain} email addresses.`,
    );
  }

  const matches = await verifyPassword(input.password, user.passwordHash);
  if (!matches) throw invalid;

  if (user.status === "DISABLED") {
    throw ApiError.forbidden("This account has been disabled. Contact support.");
  }

  return {
    token: signToken({ sub: user.id, role: user.role }),
    user: await getSessionUser(user.id),
  };
}
