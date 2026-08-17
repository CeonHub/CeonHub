import rateLimit from "express-rate-limit";
import { env, isTest } from "../config/env";
import { sendError } from "../utils/response";

/**
 * In-memory rate limiting. That is enough for a single-instance MVP deployment;
 * running several backend instances requires a shared store (documented in
 * docs/deployment.md).
 */
const shared = {
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  // Rate limits would make the test suite flaky and prove nothing about the code.
  skip: () => isTest,
  handler: (_req: unknown, res: Parameters<typeof sendError>[0]) =>
    sendError(res, 429, "RATE_LIMITED", "Too many requests, please try again later"),
};

/** Applied to every /api route. */
export const apiRateLimit = rateLimit({
  ...shared,
  limit: env.RATE_LIMIT_MAX,
});

/** Tighter limit for credential endpoints (login, register, password change). */
export const authRateLimit = rateLimit({
  ...shared,
  limit: env.AUTH_RATE_LIMIT_MAX,
});
