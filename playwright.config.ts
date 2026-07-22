import { defineConfig } from '@playwright/test';
import { config, AUTH_FILE } from './src/config/env';

/**
 * Playwright Test configuration.
 *
 *  - `setup`         : logs in once via the real Firebase flow and saves the
 *                      authenticated storage state (see tests/auth.setup.ts).
 *  - `chromium`      : all UNauthenticated tests (grep-inverts @auth).
 *  - `authenticated` : all @auth tests, reusing the saved storage state.
 *
 * Presentation (headed / channel / slow-mo / maximized) is entirely env-driven
 * via `.env`, so a plain `npm test` honours whatever you configured — no
 * fragile shell variables required. CI always runs headless.
 */

const inCI = !!process.env.CI;

// Launch args: maximize the real window when requested (headed only).
const launchArgs: string[] = [];
if (config.maximized) {
  launchArgs.push(`--window-size=${config.viewportWidth},${config.viewportHeight}`, '--start-maximized');
}

// When maximized we drop the fixed viewport so the page fills the window.
const viewport = config.maximized ? null : { width: config.viewportWidth, height: config.viewportHeight };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: inCI,
  retries: inCI ? 2 : 0,
  workers: inCI ? 1 : undefined,
  timeout: 90_000,
  expect: { timeout: config.defaultTimeout },

  reporter: inCI
    ? [
        ['github'],
        ['list'],
        ['html', { outputFolder: 'reports/html', open: 'never' }],
        ['junit', { outputFile: 'reports/junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'reports/html', open: 'never' }],
      ],

  outputDir: 'reports/artifacts',

  use: {
    baseURL: config.baseURL,
    ignoreHTTPSErrors: true,
    headless: inCI ? true : !config.headed,
    channel: config.channel,
    viewport,
    actionTimeout: config.defaultTimeout,
    navigationTimeout: config.defaultTimeout,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: { slowMo: config.slowMo, args: launchArgs },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      grepInvert: /@auth/,
    },
    {
      name: 'authenticated',
      use: { browserName: 'chromium', storageState: AUTH_FILE },
      grep: /@auth/,
      dependencies: ['setup'],
    },
  ],
});
