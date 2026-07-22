/** Sign Up screen tests (/signup). */
import { test, expect } from '../src/fixtures';
import { NON_GMAIL_EMAIL, STRONG_PASSWORD, VALID_GMAIL } from '../src/data/test-data';

test('signup page loads', { tag: '@smoke' }, async ({ signupPage }) => {
  await signupPage.open();
  expect(await signupPage.isLoaded()).toBe(true);
});

test('signup has all fields', async ({ signupPage }) => {
  await signupPage.open();
  await expect(signupPage.nameInput).toBeVisible();
  await expect(signupPage.emailInput).toBeVisible();
  await expect(signupPage.passwordInput).toBeVisible();
  await expect(signupPage.submitButton).toBeVisible();
});

test('signup shows policy hints', async ({ signupPage }) => {
  await signupPage.open();
  await expect(signupPage.gmailHint()).toBeVisible();
  await expect(signupPage.passwordPolicyHint()).toBeVisible();
});

test('signup links back to login', async ({ signupPage }) => {
  await signupPage.open();
  await expect(signupPage.loginLink).toBeVisible();
});

test('invite email prefills and locks the field', async ({ signupPage }) => {
  // /signup?invite=<email> should prefill and lock the email field.
  await signupPage.open(undefined, { invite: VALID_GMAIL });
  await expect(signupPage.emailInput).toHaveValue(VALID_GMAIL);
  const readOnly = await signupPage.emailInput.evaluate((el: HTMLInputElement) => el.readOnly);
  expect(readOnly).toBe(true);
});

test('non-gmail email keeps the gmail-only guidance visible', async ({ signupPage }) => {
  await signupPage.open();
  await signupPage.fillForm('QA Tester', NON_GMAIL_EMAIL, STRONG_PASSWORD);
  // The Gmail-only rule is surfaced on the page regardless of input.
  await expect(signupPage.gmailHint()).toBeVisible();
});
