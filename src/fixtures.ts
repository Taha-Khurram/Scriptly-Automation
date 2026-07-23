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
import { BlogApi } from './api/blog-api';
import { CategoryApi } from './api/category-api';

interface Fixtures {
  // Page objects (UI-level).
  loginPage: LoginPage;
  signupPage: SignupPage;
  forgotPasswordPage: ForgotPasswordPage;
  dashboardPage: DashboardPage;
  publicSitePage: PublicSitePage;
  // Service clients (API-level). In the `authenticated` project these carry the
  // saved session, so they can both mutate and read state back.
  blogApi: BlogApi;
  categoryApi: CategoryApi;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  signupPage: async ({ page }, use) => use(new SignupPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  publicSitePage: async ({ page }, use) => use(new PublicSitePage(page)),
  blogApi: async ({ request }, use) => use(new BlogApi(request)),
  categoryApi: async ({ request }, use) => use(new CategoryApi(request)),
});

export { expect } from '@playwright/test';
