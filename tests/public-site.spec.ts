/**
 * Public blog site tests (/site/<slug>).
 *
 * These self-skip when the configured SITE_SLUG does not resolve to a real site,
 * so the suite stays green on a fresh database.
 */
import { test, expect } from '../src/fixtures';
import { config } from '../src/config/env';
import { PUBLIC_SITE_FEEDS, PUBLIC_SITE_PAGES } from '../src/data/test-data';

test.describe('public site pages', () => {
  test.beforeEach(async ({ publicSitePage }) => {
    const resp = await publicSitePage.openPage('');
    test.skip(resp !== null && resp.status() === 404, `Public site '${config.siteSlug}' not found — set SITE_SLUG`);
  });

  test('public home loads', { tag: '@public' }, async ({ publicSitePage }) => {
    await expect(publicSitePage.page.locator('body')).toBeVisible();
  });

  for (const subpath of PUBLIC_SITE_PAGES) {
    test(`public page responds — ${subpath || '/'}`, { tag: '@public' }, async ({ publicSitePage }) => {
      const resp = await publicSitePage.openPage(subpath);
      expect(resp).not.toBeNull();
      expect(resp!.status(), `${subpath} returned ${resp!.status()}`).toBeLessThan(500);
    });
  }

  test('contact page has a form', { tag: '@public' }, async ({ publicSitePage }) => {
    await publicSitePage.openPage('/contact');
    await expect(publicSitePage.contactForm()).toBeVisible();
  });
});

for (const [path, expectedType] of PUBLIC_SITE_FEEDS) {
  test(`feed content-type — ${path}`, { tag: '@public' }, async ({ request }) => {
    // Feeds only make sense for a real site; skip when the slug doesn't resolve.
    const home = await request.get(`/site/${config.siteSlug}`);
    test.skip(home.status() >= 400, `Public site '${config.siteSlug}' not found — set SITE_SLUG`);
    const resp = await request.get(`/site/${config.siteSlug}${path}`);
    test.skip(resp.status() === 404, `Feed ${path} not available for this site`);
    expect(resp.status()).toBe(200);
    const contentType = (resp.headers()['content-type'] ?? '').toLowerCase();
    expect(contentType, `${path}: got content-type '${contentType}'`).toContain(expectedType);
  });
}

test('unknown site is handled', { tag: '@public' }, async ({ request }) => {
  // An unknown site slug should not 500.
  const resp = await request.get('/site/this-site-does-not-exist-xyz');
  expect(resp.status()).toBeLessThan(500);
});
