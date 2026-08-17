import type { Request } from "express";
import { ApiError } from "./apiError";

/**
 * Express 5 types route parameters as `string | string[]` because of wildcard
 * patterns. Every route in CeonHub uses simple `:id` parameters, so this narrows
 * once instead of at each call site.
 */
export function pathParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.badRequest(`Missing "${name}" in the request path`);
  }
  return value;
}
