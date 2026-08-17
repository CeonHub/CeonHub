import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/response";
import { isProduction, isTest } from "../config/env";

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, "NOT_FOUND", `No route matches ${req.method} ${req.path}`);
};

/** Body-parser and Express attach `status`/`type` to their own errors. */
function isBodyParserError(error: unknown): error is Error & { status?: number; type?: string } {
  return error instanceof Error && "type" in error;
}

/**
 * Central error handler. Nothing else in the app writes an error response, so the
 * error envelope and the "no stack traces in production" rule are enforced in one place.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    sendError(res, error.status, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(res, 422, "VALIDATION_ERROR", "Invalid request", formatZodIssues(error));
    return;
  }

  if (error instanceof MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const code = status === 413 ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST";
    sendError(res, status, code, error.message);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      sendError(res, 409, "CONFLICT", "A record with these values already exists");
      return;
    }
    if (error.code === "P2025") {
      sendError(res, 404, "NOT_FOUND", "Resource not found");
      return;
    }
  }

  if (isBodyParserError(error)) {
    if (error.type === "entity.too.large") {
      sendError(res, 413, "PAYLOAD_TOO_LARGE", "Request body is too large");
      return;
    }
    if (error.type === "entity.parse.failed") {
      sendError(res, 400, "BAD_REQUEST", "Request body is not valid JSON");
      return;
    }
  }

  // Unexpected: log it server-side, tell the client nothing useful to an attacker.
  if (!isTest) {
    console.error("[unhandled error]", error);
  }
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    isProduction ? "Something went wrong" : errorMessage(error),
  );
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function formatZodIssues(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}
