import type { Response } from "express";
import type { ApiErrorCode } from "./apiError";

/**
 * Every endpoint answers with one of these two envelopes:
 *   { "success": true, "data": ... }
 *   { "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }
 */
export interface SuccessBody<T> {
  success: true;
  data: T;
}

export interface ErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PageMeta;
}

export function sendSuccess<T>(res: Response, data: T, status = 200): Response<SuccessBody<T>> {
  return res.status(status).json({ success: true, data });
}

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): Response<ErrorBody> {
  const body: ErrorBody = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return res.status(status).json(body);
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number): PaginatedData<T> {
  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    },
  };
}
