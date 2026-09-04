"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, type QueryValue } from "./api";

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-runs the request, e.g. after a mutation or from an ErrorState retry button. */
  reload: () => void;
}

interface Result<T> {
  data: T | null;
  error: Error | null;
  key: string;
}

/**
 * Minimal data fetching for client pages: request, loading, error, retry.
 *
 * Deliberately not a caching library. The MVP has no need for one, and every
 * dashboard list is small and user-specific.
 */
export function useApiQuery<T>(
  path: string | null,
  query?: Record<string, QueryValue>,
): QueryState<T> {
  const [attempt, setAttempt] = useState(0);
  const key = `${attempt}:${path ?? ""}:${JSON.stringify(query ?? null)}`;

  const [result, setResult] = useState<Result<T>>({ data: null, error: null, key: "" });

  useEffect(() => {
    // A null path means "nothing to fetch yet"; the derived values below already
    // report not-loading and no data for that case.
    if (!path) return;

    const controller = new AbortController();
    let active = true;

    apiFetch<T>(path, { query, signal: controller.signal })
      .then((data) => {
        if (active) setResult({ data, error: null, key });
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setResult({
          data: null,
          error: error instanceof Error ? error : new Error("Request failed"),
          key,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // `key` already encodes path, query and retry count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const fresh = result.key === key;
  return {
    data: fresh ? result.data : null,
    error: fresh ? result.error : null,
    loading: path !== null && !fresh,
    reload,
  };
}
