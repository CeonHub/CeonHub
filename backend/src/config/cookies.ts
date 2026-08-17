import type { CookieOptions, Response } from "express";
import { env, isProduction } from "./env";
import { TOKEN_MAX_AGE_MS } from "../utils/token";

/**
 * The session cookie is httpOnly, so the token is never readable by JavaScript.
 *
 * In production the frontend (e.g. Vercel) and the API (e.g. Render) usually sit on
 * different sites, which forces SameSite=None — and SameSite=None requires Secure,
 * i.e. HTTPS on both ends. Deployments that share a parent domain can set
 * COOKIE_SAMESITE=lax and COOKIE_DOMAIN for a stricter setup.
 */
function baseOptions(): CookieOptions {
  const sameSite = env.COOKIE_SAMESITE ?? (isProduction ? "none" : "lax");

  return {
    httpOnly: true,
    secure: isProduction || sameSite === "none",
    sameSite,
    path: "/",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.COOKIE_NAME, token, { ...baseOptions(), maxAge: TOKEN_MAX_AGE_MS });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.COOKIE_NAME, baseOptions());
}
