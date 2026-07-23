/**
 * Tier 2 — core blog-workflow tests for a logged-in user.
 *
 * Covers the cheap, deterministic parts of the content lifecycle and — the key
 * point — verifies every mutation by reading the state *back* from the API,
 * rather than trusting the mutation's own `success: true` response:
 *   - Category CRUD : create → read-back exists + rendered → rename → read-back
 *                     renamed → delete → read-back gone (404)
 *   - Category guards: empty name, unknown id (negative paths)
 *   - Blog reads    : all-blogs listing returns a well-formed, paginated page
 * Expensive, quota-consuming AI paths (generate) are tagged @expensive and skip
 * unless RUN_EXPENSIVE=1, so a normal run never spends Gemini credits.
 *
 * Auto-skips entirely without credentials.
 */
import { test, expect } from '../src/fixtures';
import { config, hasCredentials } from '../src/config/env';
import { CreateCategoryResult, MutationResult } from '../src/api/types';

test.beforeEach(() => {
  test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set — Tier 2 auth tests skipped');
});

// A per-run suffix keeps names unique so repeated / parallel runs never collide.
const runId = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test('category CRUD lifecycle — every step verified by read-back', { tag: '@auth' }, async ({ categoryApi }) => {
  const name = `QA Automation Cat ${runId}`;
  const renamed = `QA Renamed Cat ${runId}`; // deliberately shares no substring with `name`

  // ---- CREATE ---------------------------------------------------------------
  const createResp = await categoryApi.create(name);
  expect(createResp.status(), await createResp.text()).toBe(200);
  const created = (await createResp.json()) as CreateCategoryResult;
  expect(created.success).toBe(true);
  expect(created.name).toBe(name);
  const catId = created.id;
  expect(catId, 'create did not return an id').toBeTruthy();

  try {
    // READ-BACK (role-independent): the category genuinely persisted — the
    // existence probe returns 200, not just "success: true" on the create.
    expect(await categoryApi.exists(catId), 'created category not found via read-back').toBe(true);

    // The /categories page lists ALL categories for an ADMIN, but for a plain
    // USER it only surfaces categories that already have blogs — so a brand-new
    // empty category may not render. Detect that capability once and, when the
    // page does render our category, use it as a second, name-level read-back.
    const pageRendersCategory = await categoryApi.pageShows(name);

    // ---- RENAME -------------------------------------------------------------
    const renameResp = await categoryApi.rename(catId, renamed);
    expect(renameResp.status(), await renameResp.text()).toBe(200);
    expect(((await renameResp.json()) as MutationResult).success).toBe(true);

    // READ-BACK (role-independent): the category still exists after the rename.
    expect(await categoryApi.exists(catId), 'category disappeared after rename').toBe(true);

    // READ-BACK (name-level, when the page renders it): the new name is now
    // shown and the old name is gone — proving the rename was persisted.
    if (pageRendersCategory) {
      expect(await categoryApi.pageShows(renamed), 'renamed category not persisted').toBe(true);
      expect(await categoryApi.pageShows(name), 'old category name still present after rename').toBe(false);
    }
  } finally {
    // ---- DELETE (cleanup — category has no blogs, so this is allowed) --------
    const deleteResp = await categoryApi.remove(catId);
    expect(deleteResp.status(), await deleteResp.text()).toBe(200);
    expect(((await deleteResp.json()) as MutationResult).success).toBe(true);

    // READ-BACK: the category is genuinely gone (probe now 404).
    expect(await categoryApi.exists(catId), 'deleted category still present via read-back').toBe(false);
  }
});

test('create category rejects an empty name', { tag: '@auth' }, async ({ categoryApi }) => {
  const resp = await categoryApi.create('   ');
  expect(resp.status()).toBe(400);
  expect(((await resp.json()) as MutationResult).success).toBe(false);
});

test('rename rejects an empty name', { tag: '@auth' }, async ({ categoryApi }) => {
  // The handler validates the name before it looks the category up, so a
  // throwaway id is enough to exercise the guard without creating data.
  const resp = await categoryApi.rename(`missing-${runId}`, '   ');
  expect(resp.status()).toBe(400);
  expect(((await resp.json()) as MutationResult).success).toBe(false);
});

test('rename of a non-existent category is rejected (404)', { tag: '@auth' }, async ({ categoryApi }) => {
  const resp = await categoryApi.rename(`missing-${runId}`, 'Whatever');
  expect(resp.status()).toBe(404);
  expect(((await resp.json()) as MutationResult).success).toBe(false);
});

test('delete of a non-existent category is rejected (404)', { tag: '@auth' }, async ({ categoryApi }) => {
  const resp = await categoryApi.remove(`missing-${runId}`);
  expect(resp.status()).toBe(404);
  expect(((await resp.json()) as MutationResult).success).toBe(false);
});

test('all-blogs listing returns a well-formed, paginated page', { tag: '@auth' }, async ({ blogApi }) => {
  const body = await blogApi.list({ status: 'all', page: 1 });
  expect(body.success).toBe(true);
  expect(Array.isArray(body.blogs), 'blogs should be an array').toBe(true);
  expect(typeof body.total, 'total should be a number').toBe('number');
  expect(body.page).toBeGreaterThanOrEqual(1);
  expect(body.per_page).toBeGreaterThan(0);
});

test('AI blog generation starts', { tag: ['@auth', '@expensive'] }, async ({ blogApi }) => {
  test.skip(!config.runExpensive, 'RUN_EXPENSIVE=1 not set (spends Gemini credits)');
  const resp = await blogApi.generate('A short post about automated testing');
  expect([200, 202]).toContain(resp.status());
  expect((await resp.json()).success).not.toBe(false);
});
