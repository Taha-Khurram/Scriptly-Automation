/**
 * Access-control / navigation tests.
 *
 * Every protected dashboard route must bounce a logged-out visitor to /login.
 */
import { test, expect } from '../src/fixtures';
import { PROTECTED_ROUTES } from '../src/data/test-data';

for (const route of PROTECTED_ROUTES) {
  test(`protected route ${route} redirects to login when logged out`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    // The app should redirect an unauthenticated user to the login screen.
    expect(page.url(), `${route} did not redirect to /login (got ${page.url()})`).toContain('/login');
  });
}
