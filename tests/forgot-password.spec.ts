/** Forgot Password screen tests (/forgot-password). */
import { test, expect } from '../src/fixtures';

test('forgot password page loads', { tag: '@smoke' }, async ({ forgotPasswordPage, page }) => {
  await forgotPasswordPage.open();
  expect(await forgotPasswordPage.isLoaded()).toBe(true);
  expect(page.url().toLowerCase()).toContain('forgot');
});

test('forgot password has email field', async ({ forgotPasswordPage }) => {
  await forgotPasswordPage.open();
  await expect(forgotPasswordPage.emailInput).toBeVisible();
});

test('forgot password links back to login', async ({ forgotPasswordPage }) => {
  await forgotPasswordPage.open();
  await expect(forgotPasswordPage.loginLink).toBeVisible();
});

test('unknown email check reports a missing account', async ({ request }) => {
  // POST /api/auth/check-email makes a live Firebase Admin lookup, so a
  // transient transport error is retried once before the assertion.
  const payload = { email: 'does-not-exist-9f8a7b@gmail.com' };
  let resp;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      resp = await request.post('/api/auth/check-email', { data: payload });
      break;
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  expect(resp).toBeTruthy();
  expect([404, 400, 500]).toContain(resp!.status());
  const body = await resp!.json();
  expect(body.exists).toBe(false);
});
