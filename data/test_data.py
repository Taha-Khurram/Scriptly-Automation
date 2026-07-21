"""Static test data: inputs, expected messages, and route lists."""

# Protected dashboard routes that must redirect to /login when logged out.
PROTECTED_ROUTES = [
    "/dashboard",
    "/create",
    "/drafts",
    "/approval",
    "/categories",
    "/comments",
    "/seo-tools",
    "/optimization",
    "/analytics",
    "/schedule",
    "/leads",
    "/gallery",
    "/newsletter",
    "/app-settings",
]

# Invalid signup inputs -> the app enforces Gmail-only + a strong-password policy.
NON_GMAIL_EMAIL = "tester@outlook.com"
VALID_GMAIL = "tester@gmail.com"
WEAK_PASSWORD = "abc"            # too short, no uppercase/special
STRONG_PASSWORD = "Str0ng!Pass"  # 8+, uppercase, special, no spaces

GMAIL_ONLY_MESSAGE = "Only Gmail addresses (@gmail.com) are allowed"

# Public-site sub-pages (relative to /site/<slug>).
PUBLIC_SITE_PAGES = [
    "",                 # home
    "/blog",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms-of-service",
]

PUBLIC_SITE_FEEDS = [
    ("/robots.txt", "text/plain"),
    ("/sitemap.xml", "xml"),
    ("/feed.xml", "xml"),
]
