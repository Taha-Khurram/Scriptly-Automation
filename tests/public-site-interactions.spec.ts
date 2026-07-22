/**
 * Public blog-site interaction tests: contact, newsletter subscribe, and
 * semantic search.
 *
 * These exercise the public-facing write/search endpoints through their
 * validation paths (no AI cost, no data writes) so they are safe to run against
 * any site. All self-skip when the configured SITE_SLUG does not resolve.
 */
import { test, expect } from '../src/fixtures';
import { config } from '../src/config/env';

const base = `/site/${config.siteSlug}`;

test.beforeEach(async ({ request }) => {
  const resp = await request.get(base);
  test.skip(resp.status() >= 400, `Public site '${config.siteSlug}' not found — set SITE_SLUG`);
});

test('subscribe rejects an invalid email', { tag: '@public' }, async ({ request }) => {
  const resp = await request.post(`${base}/subscribe`, { form: { email: 'not-an-email' } });
  expect(resp.status()).toBe(400);
  expect((await resp.json()).success).toBe(false);
});

test('semantic search requires a query', { tag: '@public' }, async ({ request }) => {
  const resp = await request.post(`${base}/semantic-search`, {
    data: { query: '' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(resp.status()).toBe(400);
  const body = await resp.json();
  expect(body.success).toBe(false);
  expect(body.results).toEqual([]);
});

test('semantic search rejects a too-short query', { tag: '@public' }, async ({ request }) => {
  const resp = await request.post(`${base}/semantic-search`, {
    data: { query: 'a' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(resp.status()).toBe(400);
});

test('contact form renders its fields', { tag: '@public' }, async ({ publicSitePage }) => {
  await publicSitePage.openPage('/contact');
  // Contact form posts name/email/subject/message.
  await expect(publicSitePage.contactForm()).toBeVisible();
  await expect(publicSitePage.contactEmailInput()).toBeVisible();
});
