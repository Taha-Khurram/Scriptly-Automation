/**
 * Authentication setup project.
 *
 * Logs in once through the real Firebase flow and saves the authenticated
 * storage state to `playwright/.auth/user.json`. The `authenticated` project
 * then reuses that state for every @auth test — so we log in once, not per test.
 *
 * When credentials are not configured we still write an EMPTY storage state so
 * the authenticated project can load; the individual @auth tests then skip
 * themselves via `hasCredentials`, mirroring the original suite's auto-skip.
 */
import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { config, hasCredentials, AUTH_FILE } from '../src/config/env';
import { LoginPage } from '../src/pages/login-page';

setup('authenticate', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  if (!hasCredentials) {
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, 'TEST_EMAIL / TEST_PASSWORD not set — @auth tests will be skipped');
    return;
  }

  // Explicitly maximize the real browser window right after it is initialised,
  // so a headed demo run fills the screen regardless of --start-maximized.
  if (config.headed && config.maximized) {
    try {
      const session = await page.context().newCDPSession(page);
      const { windowId } = await session.send('Browser.getWindowForTarget');
      await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'maximized' } });
    } catch {
      // Non-CDP browsers (e.g. Firefox/WebKit) — --start-maximized already applied.
    }
  }

  const login = new LoginPage(page);
  await login.open();
  await login.signIn(config.testEmail, config.testPassword);

  // A successful Firebase login redirects to the dashboard.
  await page.waitForURL('**/dashboard', { timeout: config.defaultTimeout });

  await page.context().storageState({ path: AUTH_FILE });
});
