/** Stable, machine-readable error codes returned by the API. */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/**
 * Errors thrown anywhere in the app; the central error handler turns them into the
 * standard JSON error envelope. Anything that is *not* an ApiError is treated as an
 * unexpected failure and reported as INTERNAL_ERROR without leaking details.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Invalid request", details?: unknown): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static validation(message = "Invalid request", details?: unknown): ApiError {
    return new ApiError(422, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have access to this resource"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "Resource already exists"): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }

  static internal(message = "Something went wrong"): ApiError {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
