/**
 * Custom test fixtures.
 *
 * Extends the base Playwright `test` with ready-built page objects so specs read
 * at intent level (`loginPage.signIn(...)`) instead of newing up objects. Import
 * `{ test, expect }` from here in every spec.
 */
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { SignupPage } from './pages/signup-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { DashboardPage } from './pages/dashboard-page';
import { PublicSitePage } from './pages/public-site-page';

interface PageObjects {
  loginPage: LoginPage;
  signupPage: SignupPage;
  forgotPasswordPage: ForgotPasswordPage;
  dashboardPage: DashboardPage;
  publicSitePage: PublicSitePage;
}

export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  signupPage: async ({ page }, use) => use(new SignupPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  publicSitePage: async ({ page }, use) => use(new PublicSitePage(page)),
});

export { expect } from '@playwright/test';
