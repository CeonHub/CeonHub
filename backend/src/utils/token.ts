import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../generated/prisma/enums";

export interface TokenPayload {
  /** User id. */
  sub: string;
  role: Role;
}

const EXPIRES_IN_SECONDS = env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60;

export const TOKEN_MAX_AGE_MS = EXPIRES_IN_SECONDS * 1000;

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN_SECONDS });
}

/**
 * Returns the payload, or null when the token is missing, expired, tampered with
 * or signed with a different secret. The caller decides what to do about it.
 *
 * The role inside the token is only a hint: authorization always re-reads the user
 * from the database, so a stale token cannot grant a role the user no longer has.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || !decoded.sub) return null;
    return { sub: String(decoded.sub), role: decoded.role as Role };
  } catch {
    return null;
  }
}

/**
 * Short-lived signed payloads used outside sessions, currently the OAuth `state`
 * parameter, which must survive a round trip through LinkedIn untampered.
 */
export function signShortLivedToken(payload: object, expiresInSeconds: number): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyShortLivedToken<T>(token: string): T | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return typeof decoded === "string" ? null : (decoded as T);
  } catch {
    return null;
  }
}
