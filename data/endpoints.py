"""Complete endpoint catalog for Scriptly, grouped by core functionality.

Captured from the app's route definitions and verified against the running app
with an unauthenticated probe (redirects disabled). Each ``Endpoint`` records the
HTTP method, path, the feature it belongs to, and the status a *logged-out*
caller receives.

Denial contract observed:
  * Dashboard pages & most feature APIs  -> 302 (redirect to /login)
  * gallery / newsletter / schedule APIs -> 401 (JSON "Unauthorized")
  * admin create-user                    -> 403
  * user-management (admin-only)         -> 404 (existence hidden on purpose)
  * /settings/general/public             -> 200 (intentionally public)
"""
from __future__ import annotations

from dataclasses import dataclass

# Any of these means "access was denied" for a logged-out caller.
DENIED_CODES = {301, 302, 303, 401, 403, 404}


@dataclass(frozen=True)
class Endpoint:
    method: str
    path: str
    feature: str
    logged_out_status: int  # observed status for an unauthenticated caller

    def __str__(self) -> str:  # nice pytest id
        return f"{self.feature}:{self.method} {self.path}"


# --- Authenticated dashboard PAGES (GET, render templates) -> 302 when logged out
DASHBOARD_PAGES = [
    Endpoint("GET", "/dashboard", "dashboard", 302),
    Endpoint("GET", "/create", "blog", 302),
    Endpoint("GET", "/drafts", "blog", 302),
    Endpoint("GET", "/approval", "blog", 302),
    Endpoint("GET", "/categories", "categories", 302),
    Endpoint("GET", "/comments", "comments", 302),
    Endpoint("GET", "/seo-tools", "seo", 302),
    Endpoint("GET", "/formatting-tools", "formatting", 302),
    Endpoint("GET", "/site-settings", "site-settings", 302),
    Endpoint("GET", "/newsletter", "newsletter", 302),
    Endpoint("GET", "/all-blogs", "blogs-listing", 302),
    Endpoint("GET", "/activity-log", "activity", 302),
    Endpoint("GET", "/gallery", "gallery", 302),
    Endpoint("GET", "/leads", "leads", 302),
    Endpoint("GET", "/schedule", "schedule", 302),
    Endpoint("GET", "/optimization", "optimization", 302),
    Endpoint("GET", "/analytics", "analytics", 302),
    Endpoint("GET", "/app-settings", "settings", 302),
    Endpoint("GET", "/profile", "auth", 302),
    Endpoint("GET", "/manage-users", "user-mgmt", 404),  # admin-hidden
]

# --- Feature APIs (JSON / state-changing) grouped by functionality --------------
BLOG_APIS = [
    Endpoint("GET", "/api/get_blog/x", "blog", 302),
    Endpoint("POST", "/api/update_blog/x", "blog", 302),
    Endpoint("POST", "/api/generate", "blog-ai", 302),
    Endpoint("GET", "/api/generate/status/x", "blog-ai", 302),
    Endpoint("POST", "/api/humanize/x", "humanize", 302),
    Endpoint("POST", "/api/update_status/x", "blog", 302),
    Endpoint("DELETE", "/api/delete_blog/x", "blog", 302),
    Endpoint("POST", "/api/unpublish/x", "blog", 302),
    Endpoint("GET", "/api/all-blogs", "blogs-listing", 302),
]

CATEGORY_APIS = [
    Endpoint("GET", "/api/category/x/blogs", "categories", 302),
    Endpoint("POST", "/api/categories", "categories", 302),
    Endpoint("POST", "/api/edit_category/x", "categories", 302),
    Endpoint("DELETE", "/api/delete_category/x", "categories", 302),
]

SEO_APIS = [
    Endpoint("POST", "/api/seo/analyze", "seo", 302),
    Endpoint("POST", "/api/seo/keywords", "seo", 302),
    Endpoint("POST", "/api/seo/analyze-url", "seo", 302),
    Endpoint("POST", "/api/seo/optimize-blog/x", "seo", 302),
    Endpoint("POST", "/api/format", "formatting", 302),
    Endpoint("GET", "/api/seo/drafts", "seo", 302),
    Endpoint("POST", "/api/seo/analyze-draft/x", "seo", 302),
]

COMMENT_APIS = [
    Endpoint("GET", "/api/comments", "comments", 302),
    Endpoint("GET", "/api/comments/stats", "comments", 302),
    Endpoint("GET", "/api/comments/x", "comments", 302),
    Endpoint("POST", "/api/comments/x/edit", "comments", 302),
    Endpoint("POST", "/api/comments/x/remove", "comments", 302),
    Endpoint("POST", "/api/comments/x/restore", "comments", 302),
    Endpoint("DELETE", "/api/comments/x/delete", "comments", 302),
]

ACTIVITY_APIS = [
    Endpoint("GET", "/api/activity", "activity", 302),
    Endpoint("GET", "/api/activity/stats", "activity", 302),
    Endpoint("GET", "/api/activity/users", "activity", 302),
    Endpoint("POST", "/api/track-activity", "activity", 302),
    Endpoint("GET", "/api/sheets-recent-activity", "activity", 302),
]

LEADS_APIS = [
    Endpoint("GET", "/api/leads", "leads", 302),
    Endpoint("GET", "/api/leads/stats", "leads", 302),
    Endpoint("POST", "/api/leads/x/read", "leads", 302),
    Endpoint("POST", "/api/leads/x/delete", "leads", 302),
]

GALLERY_APIS = [
    Endpoint("POST", "/api/gallery/upload", "gallery", 401),
    Endpoint("GET", "/api/gallery/images", "gallery", 401),
    Endpoint("DELETE", "/api/gallery/images/x", "gallery", 401),
]

NEWSLETTER_APIS = [
    Endpoint("POST", "/api/newsletter/generate", "newsletter", 401),
    Endpoint("POST", "/api/newsletter/subject-variations", "newsletter", 401),
    Endpoint("POST", "/api/newsletter/send", "newsletter", 401),
    Endpoint("GET", "/api/newsletter/subscribers", "newsletter", 401),
    Endpoint("GET", "/api/newsletter/subscribers/count", "newsletter", 401),
    Endpoint("GET", "/api/newsletter/history", "newsletter", 401),
    Endpoint("GET", "/api/newsletter/history/x", "newsletter", 401),
    Endpoint("DELETE", "/api/newsletter/history/x", "newsletter", 401),
    Endpoint("GET", "/api/newsletter/drafts", "newsletter", 401),
    Endpoint("POST", "/api/newsletter/drafts", "newsletter", 401),
    Endpoint("DELETE", "/api/newsletter/drafts/x", "newsletter", 401),
    Endpoint("POST", "/api/newsletter/render", "newsletter", 401),
    Endpoint("GET", "/api/newsletter/status", "newsletter", 401),
]

OPTIMIZATION_APIS = [
    Endpoint("GET", "/api/optimization/url-metrics", "optimization", 302),
    Endpoint("GET", "/api/optimization/keyword-metrics", "optimization", 302),
    Endpoint("POST", "/api/optimization/draft-keywords", "optimization", 302),
    Endpoint("GET", "/api/optimization/site-audit", "optimization", 302),
    Endpoint("GET", "/api/optimization/reports", "optimization", 302),
    Endpoint("DELETE", "/api/optimization/reports/x", "optimization", 302),
]

SCHEDULE_APIS = [
    Endpoint("GET", "/api/schedule/list", "schedule", 401),
    Endpoint("GET", "/api/schedule/best-time", "schedule", 401),
    Endpoint("GET", "/api/schedule/available-blogs", "schedule", 401),
    Endpoint("POST", "/api/schedule/x", "schedule", 401),
    Endpoint("POST", "/api/schedule/x/reschedule", "schedule", 401),
    Endpoint("POST", "/api/schedule/x/cancel", "schedule", 401),
    Endpoint("POST", "/api/schedule/x/publish-now", "schedule", 401),
]

ANALYTICS_APIS = [
    Endpoint("GET", "/analytics/connect", "analytics", 302),
    Endpoint("POST", "/analytics/disconnect", "analytics", 302),
    Endpoint("GET", "/analytics/properties", "analytics", 302),
    Endpoint("POST", "/analytics/select-property", "analytics", 302),
    Endpoint("GET", "/api/analytics/realtime", "analytics", 302),
    Endpoint("GET", "/api/analytics/overview", "analytics", 302),
    Endpoint("GET", "/api/analytics/top-pages", "analytics", 302),
    Endpoint("GET", "/api/analytics/traffic-sources", "analytics", 302),
]

SETTINGS_APIS = [
    Endpoint("GET", "/settings/general", "settings", 302),
    Endpoint("PATCH", "/settings/general", "settings", 302),
    Endpoint("POST", "/api/site-settings", "site-settings", 302),
    Endpoint("POST", "/api/time-preview", "site-settings", 302),
]

USER_MGMT_APIS = [
    Endpoint("GET", "/list", "user-mgmt", 404),
    Endpoint("POST", "/invite", "user-mgmt", 404),
    Endpoint("POST", "/resend-invite", "user-mgmt", 404),
    Endpoint("POST", "/update-role", "user-mgmt", 404),
    Endpoint("POST", "/delete-user", "user-mgmt", 404),
    Endpoint("POST", "/api/admin/create-user", "user-mgmt", 403),
]

# Every protected endpoint across the whole application.
ALL_PROTECTED = (
    DASHBOARD_PAGES
    + BLOG_APIS
    + CATEGORY_APIS
    + SEO_APIS
    + COMMENT_APIS
    + ACTIVITY_APIS
    + LEADS_APIS
    + GALLERY_APIS
    + NEWSLETTER_APIS
    + OPTIMIZATION_APIS
    + SCHEDULE_APIS
    + ANALYTICS_APIS
    + SETTINGS_APIS
    + USER_MGMT_APIS
)

# Authenticated GET endpoints that should return JSON 200 for a logged-in user.
# Used by Tier-2 feature-API smoke tests (non-destructive reads only).
AUTHED_READ_APIS = [
    Endpoint("GET", "/api/all-blogs", "blogs-listing", 200),
    Endpoint("GET", "/api/comments", "comments", 200),
    Endpoint("GET", "/api/comments/stats", "comments", 200),
    Endpoint("GET", "/api/activity", "activity", 200),
    Endpoint("GET", "/api/activity/stats", "activity", 200),
    Endpoint("GET", "/api/leads", "leads", 200),
    Endpoint("GET", "/api/leads/stats", "leads", 200),
    Endpoint("GET", "/api/gallery/images", "gallery", 200),
    Endpoint("GET", "/api/schedule/list", "schedule", 200),
    Endpoint("GET", "/api/newsletter/subscribers", "newsletter", 200),
    Endpoint("GET", "/api/newsletter/history", "newsletter", 200),
    Endpoint("GET", "/api/newsletter/drafts", "newsletter", 200),
    Endpoint("GET", "/api/newsletter/status", "newsletter", 200),
    Endpoint("GET", "/api/optimization/reports", "optimization", 200),
    Endpoint("GET", "/api/seo/drafts", "seo", 200),
]

# Intentionally public (no auth required).
PUBLIC_ENDPOINTS = [
    Endpoint("GET", "/settings/general/public", "settings", 200),
]
