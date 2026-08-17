import type { Request, RequestHandler } from "express";
import { env } from "../config/env";
import { prisma } from "../database/prisma";
import { verifyToken } from "../utils/token";
import { ApiError } from "../utils/apiError";
import type { Role } from "../generated/prisma/enums";
import type { AuthUser } from "../types/express";

/**
 * Resolves the caller from the session cookie.
 *
 * The user is re-read from the database on every request rather than trusted from
 * the token, so a disabled or deleted account loses access immediately and a role
 * change takes effect without re-login.
 */
async function resolveUser(req: Request): Promise<AuthUser | null> {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const token = cookies?.[env.COOKIE_NAME];
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, status: true },
  });

  return user;
}

/** Rejects the request unless a valid session belongs to an active user. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const user = await resolveUser(req);

  if (!user) {
    next(ApiError.unauthorized());
    return;
  }
  if (user.status === "DISABLED") {
    next(ApiError.forbidden("This account has been disabled"));
    return;
  }

  req.user = user;
  next();
};

/** Attaches the user when signed in, but lets anonymous callers through. */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const user = await resolveUser(req);
  if (user && user.status === "ACTIVE") {
    req.user = user;
  }
  next();
};

/** Must be used after requireAuth. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden("Your account type cannot perform this action"));
      return;
    }
    next();
  };
}

/**
 * Narrows `req.user` for controllers that run behind requireAuth. Throwing here
 * would mean a route was wired without the middleware.
 */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}
