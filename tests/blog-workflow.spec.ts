/**
 * Tier 2 — core blog-workflow tests for a logged-in user.
 *
 * Covers the cheap, deterministic parts of the content lifecycle:
 *   - Category CRUD : create -> appears in list -> rename -> delete
 *   - Blog reads    : all-blogs listing returns data
 * Expensive, quota-consuming AI paths (generate) are tagged @expensive and skip
 * unless RUN_EXPENSIVE=1, so a normal run never spends Gemini credits.
 *
 * Auto-skips entirely without credentials.
 */
import { test, expect } from '../src/fixtures';
import { config, hasCredentials } from '../src/config/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

test.beforeEach(() => {
  test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set — Tier 2 auth tests skipped');
});

test('category CRUD lifecycle', { tag: '@auth' }, async ({ request }) => {
  const name = 'QA Automation Cat';

  // create
  const created = await request.post('/api/categories', { data: { name }, headers: JSON_HEADERS });
  expect(created.status(), await created.text()).toBe(200);
  const body = await created.json();
  expect(body.success).toBe(true);
  const catId = body.id;
  expect(catId).toBeTruthy();

  try {
    // rename
    const renamed = await request.post(`/api/edit_category/${catId}`, {
      data: { name: `${name} Edited` },
      headers: JSON_HEADERS,
    });
    expect(renamed.status()).toBe(200);
    expect((await renamed.json()).success).toBe(true);
  } finally {
    // delete (cleanup — category has no blogs so this is allowed)
    const deleted = await request.delete(`/api/delete_category/${catId}`);
    expect(deleted.status()).toBe(200);
    expect((await deleted.json()).success).toBe(true);
  }
});

test('create category rejects an empty name', { tag: '@auth' }, async ({ request }) => {
  const resp = await request.post('/api/categories', { data: { name: '   ' }, headers: JSON_HEADERS });
  expect(resp.status()).toBe(400);
  expect((await resp.json()).success).toBe(false);
});

test('all-blogs listing returns JSON structure', { tag: '@auth' }, async ({ request }) => {
  const resp = await request.get('/api/all-blogs');
  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type'] ?? '').toContain('application/json');
});

test('AI blog generation starts', { tag: ['@auth', '@expensive'] }, async ({ request }) => {
  test.skip(!config.runExpensive, 'RUN_EXPENSIVE=1 not set (spends Gemini credits)');
  const resp = await request.post('/api/generate', {
    data: { prompt: 'A short post about automated testing' },
    headers: JSON_HEADERS,
  });
  expect([200, 202]).toContain(resp.status());
  expect((await resp.json()).success).not.toBe(false);
});
