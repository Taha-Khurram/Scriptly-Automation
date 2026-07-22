/**
 * Central, env-driven configuration for the automation framework.
 *
 * Every runtime knob (base URL, credentials, presentation options) is read once
 * from the environment — populated from a local `.env` via dotenv — and exposed
 * through a single frozen `config` object imported everywhere else.
 *
 * All string values are `.trim()`-ed so a stray space in `.env` (or a shell
 * variable) can never leak into a browser channel / URL and break a run.
 */
import 'dotenv/config';

function asBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function asInt(value: string | undefined, fallback: number): number {
  const n = Number((value ?? '').trim());
  return Number.isFinite(n) && value !== undefined && value.trim() !== '' ? n : fallback;
}

export const config = {
  /** Base URL of the running Scriptly Flask app. */
  baseURL: (process.env.BASE_URL ?? 'http://localhost:5000').trim().replace(/\/+$/, ''),

  /** Public site slug used by public-site tests (self-skips if the site 404s). */
  siteSlug: (process.env.SITE_SLUG ?? 'demo').trim(),

  /** Global default timeout for actions / navigation / expect, in ms. */
  defaultTimeout: asInt(process.env.DEFAULT_TIMEOUT, 30_000),

  /** Tier 2 (authenticated) credentials — empty means auth tests are skipped. */
  testEmail: (process.env.TEST_EMAIL ?? '').trim(),
  testPassword: (process.env.TEST_PASSWORD ?? '').trim(),

  /** Gate for quota-consuming AI tests (generate / humanize / publish). */
  runExpensive: (process.env.RUN_EXPENSIVE ?? '').trim() === '1',

  // --- Presentation knobs (headed debugging / demos) ------------------------
  /** Run browsers visibly. Always forced headless in CI. */
  headed: asBool(process.env.HEADED, false),
  /** e.g. "chrome" / "msedge" to use an installed browser instead of bundled Chromium. */
  channel: ((process.env.BROWSER_CHANNEL ?? '').trim() || undefined) as string | undefined,
  /** Slow every action down by this many ms so a headed run is watchable. */
  slowMo: asInt(process.env.SLOW_MO, 0),
  /** Launch the window maximized (drops the fixed viewport). */
  maximized: asBool(process.env.MAXIMIZED, false),
  viewportWidth: asInt(process.env.WINDOW_WIDTH, 1920),
  viewportHeight: asInt(process.env.WINDOW_HEIGHT, 1080),
} as const;

/** True only when both credentials are present. */
export const hasCredentials = Boolean(config.testEmail && config.testPassword);

/** Where the authenticated storage state is persisted by the setup project. */
export const AUTH_FILE = 'playwright/.auth/user.json';
