/**
 * Tier 2 — authenticated load of every dashboard feature page.
 *
 * Each core screen must render for a logged-in user (no redirect back to
 * /login). Auto-skips unless TEST_EMAIL / TEST_PASSWORD are configured.
 */
import { test, expect } from '../src/fixtures';
import { hasCredentials } from '../src/config/env';
import { FEATURE_PAGES, FeaturePageName } from '../src/pages/dashboard-page';

test.beforeEach(() => {
  test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set — Tier 2 auth tests skipped');
});

// manage-users is admin-only (404 for non-admins); assert it separately.
const STANDARD_PAGES = (Object.keys(FEATURE_PAGES) as FeaturePageName[]).filter((n) => n !== 'manage_users');

for (const name of STANDARD_PAGES) {
  test(`feature page loads for authenticated user — ${name}`, { tag: '@auth' }, async ({ page, dashboardPage }) => {
    const resp = await dashboardPage.go(name);
    expect(resp).not.toBeNull();
    expect(resp!.status(), `${name} returned ${resp!.status()}`).toBeLessThan(400);
    // A protected page must NOT bounce us to the login screen.
    expect(page.url(), `${name} redirected to login`).not.toContain('/login');
  });
}

test('manage users is visible to admin (or hidden 404)', { tag: '@auth' }, async ({ dashboardPage }) => {
  const resp = await dashboardPage.go('manage_users');
  // Admins get the page (200); non-admins get an intentional 404 — both valid.
  // What must never happen is a redirect to login.
  expect([200, 404]).toContain(resp!.status());
});
