import bcrypt from "bcryptjs";
import { isTest } from "../config/env";

/**
 * bcryptjs is a pure-JavaScript implementation: no native build step, so the API
 * deploys anywhere Node runs. Cost 10 is the practical sweet spot for it; tests use
 * the minimum so the suite is not dominated by key stretching.
 */
const COST = isTest ? 4 : 10;

/** bcrypt only considers the first 72 bytes; the schema rejects longer passwords. */
export const MAX_PASSWORD_LENGTH = 72;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
