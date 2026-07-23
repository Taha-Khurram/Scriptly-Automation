/**
 * ApiClient — a thin, typed wrapper over Playwright's `APIRequestContext`.
 *
 * It centralises the boilerplate every spec was repeating (JSON headers, query
 * building, JSON parsing) and — crucially — gives the higher-level service
 * clients (BlogApi, CategoryApi, …) a single place to read state *back* from the
 * API so tests can verify that a mutation actually changed the data, not merely
 * that the endpoint returned `success: true`.
 *
 * Mutating helpers deliberately return the raw `APIResponse` so specs keep full
 * control over status/error assertions (including negative paths); read helpers
 * parse and return typed JSON.
 */
import { APIRequestContext, APIResponse } from '@playwright/test';

export const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export type QueryParams = Record<string, string | number | boolean | undefined>;

/** Append a query string, skipping undefined values. */
function withQuery(path: string, params?: QueryParams): string {
  if (!params) return path;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) usp.append(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
}

export class ApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  /** GET a path (optionally with query params). Does not assert status. */
  get(path: string, params?: QueryParams): Promise<APIResponse> {
    return this.request.get(withQuery(path, params));
  }

  /** POST JSON. `data` is serialised by Playwright; headers default to JSON. */
  post(path: string, data: unknown = {}): Promise<APIResponse> {
    return this.request.post(path, { data, headers: JSON_HEADERS });
  }

  /** PATCH JSON. */
  patch(path: string, data: unknown = {}): Promise<APIResponse> {
    return this.request.patch(path, { data, headers: JSON_HEADERS });
  }

  /** DELETE a path. */
  delete(path: string): Promise<APIResponse> {
    return this.request.delete(path);
  }

  /** Parse a response body as typed JSON. */
  protected async json<T>(resp: APIResponse): Promise<T> {
    return (await resp.json()) as T;
  }
}
