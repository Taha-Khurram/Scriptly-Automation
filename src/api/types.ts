/**
 * Domain types for the Scriptly HTTP API.
 *
 * These mirror the shapes the Flask app actually returns (verified against the
 * route handlers), so specs and the API clients get real autocompletion and the
 * TypeScript compiler catches a drift between a test's assumption and the API.
 */

/** Blog status values as stored/returned by the app (compared case-insensitively). */
export type BlogStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | string;

/** A single blog row as returned by the listing endpoints. */
export interface Blog {
  id: string;
  title?: string;
  status?: BlogStatus;
  created_at?: string;
  [key: string]: unknown;
}

/** Response of `GET /api/all-blogs` — `{ success, ...paginated }`. */
export interface BlogListResponse {
  success: boolean;
  blogs: Blog[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Response of an async-kicking endpoint (`/api/generate`, `/api/humanize/<id>`). */
export interface TaskAccepted {
  success?: boolean;
  task_id: string;
  [key: string]: unknown;
}

/** Generic `{ success, ... }` body returned by mutating endpoints. */
export interface MutationResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

/** Response of `POST /api/categories`. */
export interface CreateCategoryResult extends MutationResult {
  id: string;
  name: string;
}
