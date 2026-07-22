/** Small shared helpers used across specs. */
import { APIRequestContext } from '@playwright/test';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface TaskStatus {
  status?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Poll a background task (generation / humanize) until it finishes.
 *
 * `statusUrl` is the fully-built `/api/generate/status/<task_id>` URL. Resolves
 * with the final status payload on success; throws on failure or timeout.
 * Task lifecycle: pending -> running -> completed|failed.
 */
export async function pollTask(
  request: APIRequestContext,
  statusUrl: string,
  { timeoutMs = 300_000, intervalMs = 3_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<TaskStatus> {
  const deadline = Date.now() + timeoutMs;
  let last: TaskStatus = {};
  while (Date.now() < deadline) {
    const resp = await request.get(statusUrl);
    if (resp.status() === 200) {
      last = (await resp.json()) as TaskStatus;
      if (last.status === 'completed') return last;
      if (last.status === 'failed') throw new Error(`Task failed: ${last.error}`);
    }
    await sleep(intervalMs);
  }
  throw new Error(`Task did not finish within ${timeoutMs}ms; last payload=${JSON.stringify(last)}`);
}
