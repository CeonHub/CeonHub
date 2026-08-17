import { API_URL } from "./env";

export interface ApiFieldError {
  field: string;
  message: string;
}

/** Thrown for every non-2xx response and for network failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, code: string, message: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  /** Message for a specific form field, if the API reported one. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors.find((error) => error.field === field)?.message;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Seconds; when set, the response is cached and revalidated (server components only). */
  revalidate?: number;
  signal?: AbortSignal;
}

export function buildQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const serialised = params.toString();
  return serialised ? `?${serialised}` : "";
}

/**
 * The single place the frontend talks to the backend.
 *
 * `credentials: "include"` sends the httpOnly session cookie; the browser never
 * reads or stores the token itself. The API base URL always comes from the
 * environment, never a hardcoded host.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, revalidate, signal } = options;
  const url = `${API_URL}${path}${buildQuery(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the CeonHub API. Is it running?");
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || !isSuccessEnvelope(payload)) {
    const { code, message, details } = readError(payload, response.status);
    throw new ApiError(response.status, code, message, details);
  }

  return payload.data as T;
}

interface SuccessEnvelope {
  success: true;
  data: unknown;
}

function isSuccessEnvelope(payload: unknown): payload is SuccessEnvelope {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { success?: unknown }).success === true
  );
}

function readError(
  payload: unknown,
  status: number,
): { code: string; message: string; details: ApiFieldError[] } {
  const error =
    typeof payload === "object" && payload !== null
      ? (payload as { error?: { code?: string; message?: string; details?: unknown } }).error
      : undefined;

  const details = Array.isArray(error?.details)
    ? (error.details as ApiFieldError[]).filter(
        (detail) => typeof detail?.field === "string" && typeof detail?.message === "string",
      )
    : [];

  return {
    code: error?.code ?? "UNKNOWN_ERROR",
    message: error?.message ?? `Request failed with status ${status}`,
    details,
  };
}

/** Turns any thrown value into something safe to show a user. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
