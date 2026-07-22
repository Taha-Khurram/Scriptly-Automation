/** Login screen tests (/login). */
import { test, expect } from '../src/fixtures';
import { config, hasCredentials } from '../src/config/env';

test('login page loads', { tag: '@smoke' }, async ({ loginPage, page }) => {
  await loginPage.open();
  expect(await loginPage.isLoaded()).toBe(true);
  expect(page.url().toLowerCase()).toContain('login');
});

test('login has all controls', { tag: '@smoke' }, async ({ loginPage }) => {
  await loginPage.open();
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.submitButton).toBeVisible();
  await expect(loginPage.googleButton).toBeVisible();
});

test('login links to signup and forgot password', async ({ loginPage }) => {
  await loginPage.open();
  await expect(loginPage.signupLink).toBeVisible();
  await expect(loginPage.forgotLink).toBeVisible();
});

test('empty submit is blocked by required fields', async ({ loginPage, page }) => {
  await loginPage.open();
  await loginPage.submitButton.click();
  // Browser blocks submission; the email field reports invalid.
  const isInvalid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
  expect(isInvalid).toBe(true);
  expect(page.url().toLowerCase()).toContain('login');
});

test('expired session query is handled', async ({ loginPage }) => {
  // Opening /login?expired=1 must still render the form (no crash).
  await loginPage.open(undefined, { expired: '1' });
  expect(await loginPage.isLoaded()).toBe(true);
});

// --- Tier 2 (authenticated) --------------------------------------------------

test('valid login reaches the dashboard', { tag: '@auth' }, async ({ page }) => {
  test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set');
  // The stored session (created by auth.setup) must resolve straight to the dashboard.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  expect(page.url()).not.toContain('/login');
});

test.describe('wrong password', () => {
  // Force a clean, unauthenticated context for this negative-path test.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('wrong password does not reach the dashboard', { tag: '@auth' }, async ({ loginPage, page }) => {
    test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set');
    await loginPage.open();
    await loginPage.signIn(config.testEmail, 'definitely-wrong-password');
    await page.waitForTimeout(3000);
    expect(page.url()).not.toContain('/dashboard');
  });
});
