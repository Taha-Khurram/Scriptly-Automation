/**
 * BlogApi — service client for the blog content pipeline.
 *
 * Wraps the raw endpoints and, most importantly, exposes read-back queries
 * (`list`, `get`, `statusOf`, `findNew`) so a test can assert the *persisted*
 * state after every mutation instead of trusting the mutation's own response.
 */
import { APIResponse, expect } from '@playwright/test';
import { ApiClient } from './api-client';
import { pollTask } from '../utils/helpers';
import { Blog, BlogListResponse, BlogStatus, TaskAccepted } from './types';

const AI_TIMEOUT_MS = 120_000;

export class BlogApi extends ApiClient {
  // --- reads (assert 200 internally and return typed data) -------------------

  /** Fetch a page of blogs. Asserts 200 and returns the parsed listing. */
  async list(params: { status?: string; page?: number; category?: string } = {}): Promise<BlogListResponse> {
    const resp = await this.get('/api/all-blogs', {
      status: params.status,
      page: params.page,
      category: params.category,
    });
    expect(resp.status(), `GET /api/all-blogs failed: ${await resp.text()}`).toBe(200);
    return this.json<BlogListResponse>(resp);
  }

  /** All blog ids currently on page 1 (newest first) — for new-blog detection. */
  async knownIds(): Promise<Set<string>> {
    const { blogs } = await this.list({ status: 'all', page: 1 });
    return new Set(blogs.map((b) => b.id));
  }

  /** The first blog on page 1 whose id is not in `knownIds` (a freshly created one). */
  async findNew(knownIds: Set<string>): Promise<Blog | null> {
    const { blogs } = await this.list({ status: 'all', page: 1 });
    return blogs.find((b) => !knownIds.has(b.id)) ?? null;
  }

  /** Look a single blog up in the listing (null if it is not present). */
  async getById(blogId: string): Promise<Blog | null> {
    const { blogs } = await this.list({ status: 'all', page: 1 });
    return blogs.find((b) => b.id === blogId) ?? null;
  }

  /** The current, upper-cased status of a blog (null if it is gone). */
  async statusOf(blogId: string): Promise<BlogStatus | null> {
    const blog = await this.getById(blogId);
    return blog ? String(blog.status ?? '').toUpperCase() : null;
  }

  // --- mutations (return the raw response for status/error assertions) -------

  /** Kick off AI generation. Returns the 202 response carrying `task_id`. */
  generate(prompt: string, autoSubmit = false): Promise<APIResponse> {
    return this.request.post('/api/generate', {
      data: { prompt, auto_submit: autoSubmit },
      headers: { 'Content-Type': 'application/json' },
      timeout: AI_TIMEOUT_MS,
    });
  }

  humanize(blogId: string): Promise<APIResponse> {
    return this.request.post(`/api/humanize/${blogId}`, {
      data: '{}',
      headers: { 'Content-Type': 'application/json' },
      timeout: AI_TIMEOUT_MS,
    });
  }

  optimizeSeo(blogId: string, region = 'US'): Promise<APIResponse> {
    return this.request.post(`/api/seo/optimize-blog/${blogId}`, {
      data: { region },
      headers: { 'Content-Type': 'application/json' },
      timeout: AI_TIMEOUT_MS,
    });
  }

  setStatus(blogId: string, status: BlogStatus): Promise<APIResponse> {
    return this.post(`/api/update_status/${blogId}`, { status });
  }

  remove(blogId: string): Promise<APIResponse> {
    return this.delete(`/api/delete_blog/${blogId}`);
  }

  // --- async task helpers ----------------------------------------------------

  /** Extract `task_id` from a 202 response and poll it to completion. */
  async waitForTask(accepted: APIResponse): Promise<void> {
    const body = await this.json<TaskAccepted>(accepted);
    await pollTask(this.request, `/api/generate/status/${body.task_id}`, { timeoutMs: 300_000 });
  }
}
