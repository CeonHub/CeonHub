import { prisma } from "../../database/prisma";
import { ApiError } from "../../utils/apiError";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signToken } from "../../utils/token";
import { getSessionUser, type SessionUser } from "../users/users.service";
import type { LoginInput } from "./auth.schema";

export interface AuthResult {
  token: string;
  user: SessionUser;
}

/**
 * Password sign-in, reserved for staff.
 *
 * Candidates and employers join and return through LinkedIn (see
 * linkedin.service.ts); there is no password registration. Admin accounts cannot be
 * created that way — they are made by the seed or directly in the database — so they
 * keep a password, and this is the only route that accepts one.
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
