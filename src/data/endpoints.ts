/**
 * Complete endpoint catalog for Scriptly, grouped by core functionality.
 *
 * Captured from the app's route definitions and verified against the running
 * app with an unauthenticated probe (redirects disabled). Each `Endpoint`
 * records the HTTP method, path, the feature it belongs to, and the status a
 * *logged-out* caller receives.
 *
 * Denial contract observed:
 *   - Dashboard pages & most feature APIs  -> 302 (redirect to /login)
 *   - gallery / newsletter / schedule APIs -> 401 (JSON "Unauthorized")
 *   - admin create-user                    -> 403
 *   - user-management (admin-only)         -> 404 (existence hidden on purpose)
 *   - /settings/general/public             -> 200 (intentionally public)
 */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface Endpoint {
  method: HttpMethod;
  path: string;
  feature: string;
  /** Observed status for an unauthenticated caller. */
  loggedOutStatus: number;
}

/** A stable, readable id for a test title. */
export const endpointId = (e: Endpoint): string => `${e.feature}:${e.method} ${e.path}`;

/** Any of these means "access was denied" for a logged-out caller. */
export const DENIED_CODES = new Set([301, 302, 303, 401, 403, 404]);

const ep = (method: HttpMethod, path: string, feature: string, loggedOutStatus: number): Endpoint => ({
  method,
  path,
  feature,
  loggedOutStatus,
});

// --- Authenticated dashboard PAGES (GET, render templates) -> 302 when logged out
export const DASHBOARD_PAGES: Endpoint[] = [
  ep('GET', '/dashboard', 'dashboard', 302),
  ep('GET', '/create', 'blog', 302),
  ep('GET', '/drafts', 'blog', 302),
  ep('GET', '/approval', 'blog', 302),
  ep('GET', '/categories', 'categories', 302),
  ep('GET', '/comments', 'comments', 302),
  ep('GET', '/seo-tools', 'seo', 302),
  ep('GET', '/formatting-tools', 'formatting', 302),
  ep('GET', '/site-settings', 'site-settings', 302),
  ep('GET', '/newsletter', 'newsletter', 302),
  ep('GET', '/all-blogs', 'blogs-listing', 302),
  ep('GET', '/activity-log', 'activity', 302),
  ep('GET', '/gallery', 'gallery', 302),
  ep('GET', '/leads', 'leads', 302),
  ep('GET', '/schedule', 'schedule', 302),
  ep('GET', '/optimization', 'optimization', 302),
  ep('GET', '/analytics', 'analytics', 302),
  ep('GET', '/app-settings', 'settings', 302),
  ep('GET', '/profile', 'auth', 302),
  ep('GET', '/manage-users', 'user-mgmt', 404), // admin-hidden
];

// --- Feature APIs (JSON / state-changing) grouped by functionality ------------
export const BLOG_APIS: Endpoint[] = [
  ep('GET', '/api/get_blog/x', 'blog', 302),
  ep('POST', '/api/update_blog/x', 'blog', 302),
  ep('POST', '/api/generate', 'blog-ai', 302),
  ep('GET', '/api/generate/status/x', 'blog-ai', 302),
  ep('POST', '/api/humanize/x', 'humanize', 302),
  ep('POST', '/api/update_status/x', 'blog', 302),
  ep('DELETE', '/api/delete_blog/x', 'blog', 302),
  ep('POST', '/api/unpublish/x', 'blog', 302),
  ep('GET', '/api/all-blogs', 'blogs-listing', 302),
];

export const CATEGORY_APIS: Endpoint[] = [
  ep('GET', '/api/category/x/blogs', 'categories', 302),
  ep('POST', '/api/categories', 'categories', 302),
  ep('POST', '/api/edit_category/x', 'categories', 302),
  ep('DELETE', '/api/delete_category/x', 'categories', 302),
];

export const SEO_APIS: Endpoint[] = [
  ep('POST', '/api/seo/analyze', 'seo', 302),
  ep('POST', '/api/seo/keywords', 'seo', 302),
  ep('POST', '/api/seo/analyze-url', 'seo', 302),
  ep('POST', '/api/seo/optimize-blog/x', 'seo', 302),
  ep('POST', '/api/format', 'formatting', 302),
  ep('GET', '/api/seo/drafts', 'seo', 302),
  ep('POST', '/api/seo/analyze-draft/x', 'seo', 302),
];

export const COMMENT_APIS: Endpoint[] = [
  ep('GET', '/api/comments', 'comments', 302),
  ep('GET', '/api/comments/stats', 'comments', 302),
  ep('GET', '/api/comments/x', 'comments', 302),
  ep('POST', '/api/comments/x/edit', 'comments', 302),
  ep('POST', '/api/comments/x/remove', 'comments', 302),
  ep('POST', '/api/comments/x/restore', 'comments', 302),
  ep('DELETE', '/api/comments/x/delete', 'comments', 302),
];

export const ACTIVITY_APIS: Endpoint[] = [
  ep('GET', '/api/activity', 'activity', 302),
  ep('GET', '/api/activity/stats', 'activity', 302),
  ep('GET', '/api/activity/users', 'activity', 302),
  ep('POST', '/api/track-activity', 'activity', 302),
  ep('GET', '/api/sheets-recent-activity', 'activity', 302),
];

export const LEADS_APIS: Endpoint[] = [
  ep('GET', '/api/leads', 'leads', 302),
  ep('GET', '/api/leads/stats', 'leads', 302),
  ep('POST', '/api/leads/x/read', 'leads', 302),
  ep('POST', '/api/leads/x/delete', 'leads', 302),
];

export const GALLERY_APIS: Endpoint[] = [
  ep('POST', '/api/gallery/upload', 'gallery', 401),
  ep('GET', '/api/gallery/images', 'gallery', 401),
  ep('DELETE', '/api/gallery/images/x', 'gallery', 401),
];

export const NEWSLETTER_APIS: Endpoint[] = [
  ep('POST', '/api/newsletter/generate', 'newsletter', 401),
  ep('POST', '/api/newsletter/subject-variations', 'newsletter', 401),
  ep('POST', '/api/newsletter/send', 'newsletter', 401),
  ep('GET', '/api/newsletter/subscribers', 'newsletter', 401),
  ep('GET', '/api/newsletter/subscribers/count', 'newsletter', 401),
  ep('GET', '/api/newsletter/history', 'newsletter', 401),
  ep('GET', '/api/newsletter/history/x', 'newsletter', 401),
  ep('DELETE', '/api/newsletter/history/x', 'newsletter', 401),
  ep('GET', '/api/newsletter/drafts', 'newsletter', 401),
  ep('POST', '/api/newsletter/drafts', 'newsletter', 401),
  ep('DELETE', '/api/newsletter/drafts/x', 'newsletter', 401),
  ep('POST', '/api/newsletter/render', 'newsletter', 401),
  ep('GET', '/api/newsletter/status', 'newsletter', 401),
];

export const OPTIMIZATION_APIS: Endpoint[] = [
  ep('GET', '/api/optimization/url-metrics', 'optimization', 302),
  ep('GET', '/api/optimization/keyword-metrics', 'optimization', 302),
  ep('POST', '/api/optimization/draft-keywords', 'optimization', 302),
  ep('GET', '/api/optimization/site-audit', 'optimization', 302),
  ep('GET', '/api/optimization/reports', 'optimization', 302),
  ep('DELETE', '/api/optimization/reports/x', 'optimization', 302),
];

export const SCHEDULE_APIS: Endpoint[] = [
  ep('GET', '/api/schedule/list', 'schedule', 401),
  ep('GET', '/api/schedule/best-time', 'schedule', 401),
  ep('GET', '/api/schedule/available-blogs', 'schedule', 401),
  ep('POST', '/api/schedule/x', 'schedule', 401),
  ep('POST', '/api/schedule/x/reschedule', 'schedule', 401),
  ep('POST', '/api/schedule/x/cancel', 'schedule', 401),
  ep('POST', '/api/schedule/x/publish-now', 'schedule', 401),
];

export const ANALYTICS_APIS: Endpoint[] = [
  ep('GET', '/analytics/connect', 'analytics', 302),
  ep('POST', '/analytics/disconnect', 'analytics', 302),
  ep('GET', '/analytics/properties', 'analytics', 302),
  ep('POST', '/analytics/select-property', 'analytics', 302),
  ep('GET', '/api/analytics/realtime', 'analytics', 302),
  ep('GET', '/api/analytics/overview', 'analytics', 302),
  ep('GET', '/api/analytics/top-pages', 'analytics', 302),
  ep('GET', '/api/analytics/traffic-sources', 'analytics', 302),
];

export const SETTINGS_APIS: Endpoint[] = [
  ep('GET', '/settings/general', 'settings', 302),
  ep('PATCH', '/settings/general', 'settings', 302),
  ep('POST', '/api/site-settings', 'site-settings', 302),
  ep('POST', '/api/time-preview', 'site-settings', 302),
];

export const USER_MGMT_APIS: Endpoint[] = [
  ep('GET', '/list', 'user-mgmt', 404),
  ep('POST', '/invite', 'user-mgmt', 404),
  ep('POST', '/resend-invite', 'user-mgmt', 404),
  ep('POST', '/update-role', 'user-mgmt', 404),
  ep('POST', '/delete-user', 'user-mgmt', 404),
  ep('POST', '/api/admin/create-user', 'user-mgmt', 403),
];

/** Every protected endpoint across the whole application. */
export const ALL_PROTECTED: Endpoint[] = [
  ...DASHBOARD_PAGES,
  ...BLOG_APIS,
  ...CATEGORY_APIS,
  ...SEO_APIS,
  ...COMMENT_APIS,
  ...ACTIVITY_APIS,
  ...LEADS_APIS,
  ...GALLERY_APIS,
  ...NEWSLETTER_APIS,
  ...OPTIMIZATION_APIS,
  ...SCHEDULE_APIS,
  ...ANALYTICS_APIS,
  ...SETTINGS_APIS,
  ...USER_MGMT_APIS,
];

/**
 * Authenticated GET endpoints that should return JSON 200 for a logged-in user.
 * Used by Tier-2 feature-API smoke tests (non-destructive reads only).
 */
export const AUTHED_READ_APIS: Endpoint[] = [
  ep('GET', '/api/all-blogs', 'blogs-listing', 200),
  ep('GET', '/api/comments', 'comments', 200),
  ep('GET', '/api/comments/stats', 'comments', 200),
  ep('GET', '/api/activity', 'activity', 200),
  ep('GET', '/api/activity/stats', 'activity', 200),
  ep('GET', '/api/leads', 'leads', 200),
  ep('GET', '/api/leads/stats', 'leads', 200),
  ep('GET', '/api/gallery/images', 'gallery', 200),
  ep('GET', '/api/schedule/list', 'schedule', 200),
  ep('GET', '/api/newsletter/subscribers', 'newsletter', 200),
  ep('GET', '/api/newsletter/history', 'newsletter', 200),
  ep('GET', '/api/newsletter/drafts', 'newsletter', 200),
  ep('GET', '/api/newsletter/status', 'newsletter', 200),
  ep('GET', '/api/optimization/reports', 'optimization', 200),
  ep('GET', '/api/seo/drafts', 'seo', 200),
];

/** Intentionally public (no auth required). */
export const PUBLIC_ENDPOINTS: Endpoint[] = [ep('GET', '/settings/general/public', 'settings', 200)];
