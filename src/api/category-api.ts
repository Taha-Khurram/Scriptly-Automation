/**
 * CategoryApi — service client for category CRUD.
 *
 * The app has no JSON "list categories" endpoint, so read-back is done two ways:
 *   - `exists(id)`      — probes `GET /api/category/<id>/blogs` (200 ⇒ present,
 *                         404 ⇒ gone). This proves creation/deletion actually
 *                         persisted, independent of the mutation's own response.
 *   - `pageShows(name)` — loads the authenticated `/categories` page and checks
 *                         the name is rendered, proving a create/rename landed in
 *                         the data the UI reads.
 */
import { APIResponse, expect } from '@playwright/test';
import { ApiClient } from './api-client';

export class CategoryApi extends ApiClient {
  // --- mutations -------------------------------------------------------------

  create(name: string): Promise<APIResponse> {
    return this.post('/api/categories', { name });
  }

  rename(categoryId: string, name: string): Promise<APIResponse> {
    return this.post(`/api/edit_category/${categoryId}`, { name });
  }

  remove(categoryId: string): Promise<APIResponse> {
    return this.delete(`/api/delete_category/${categoryId}`);
  }

  // --- read-back -------------------------------------------------------------

  /** Raw `GET /api/category/<id>/blogs` (200 if the category exists, 404 if not). */
  blogsResponse(categoryId: string): Promise<APIResponse> {
    return this.get(`/api/category/${categoryId}/blogs`);
  }

  /**
   * Does the category still exist? Asserts the probe returned a decisive
   * 200/404 (any other status is a real failure, not a yes/no answer).
   */
  async exists(categoryId: string): Promise<boolean> {
    const resp = await this.blogsResponse(categoryId);
    const status = resp.status();
    expect([200, 404], `category existence probe for ${categoryId} returned ${status}: ${await resp.text()}`).toContain(
      status,
    );
    return status === 200;
  }

  /** Is `name` rendered on the authenticated /categories page? */
  async pageShows(name: string): Promise<boolean> {
    const resp = await this.get('/categories');
    expect(resp.status(), `GET /categories failed: ${resp.status()}`).toBe(200);
    return (await resp.text()).includes(name);
  }
}
