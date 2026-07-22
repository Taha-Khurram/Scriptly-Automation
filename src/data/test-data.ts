/** Static test data: inputs, expected messages, and route lists. */

/** Protected dashboard routes that must redirect to /login when logged out. */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/create',
  '/drafts',
  '/approval',
  '/categories',
  '/comments',
  '/seo-tools',
  '/optimization',
  '/analytics',
  '/schedule',
  '/leads',
  '/gallery',
  '/newsletter',
  '/app-settings',
] as const;

// Invalid signup inputs -> the app enforces Gmail-only + a strong-password policy.
export const NON_GMAIL_EMAIL = 'tester@outlook.com';
export const VALID_GMAIL = 'tester@gmail.com';
export const STRONG_PASSWORD = 'Str0ng!Pass'; // 8+, uppercase, special, no spaces

/** Public-site sub-pages (relative to /site/<slug>). */
export const PUBLIC_SITE_PAGES = ['', '/blog', '/about', '/contact', '/privacy-policy', '/terms-of-service'] as const;

/** Public-site feeds: [path, expected content-type fragment]. */
export const PUBLIC_SITE_FEEDS: ReadonlyArray<readonly [string, string]> = [
  ['/robots.txt', 'text/plain'],
  ['/sitemap.xml', 'xml'],
  ['/feed.xml', 'xml'],
];
