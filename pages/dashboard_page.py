"""Page objects for the authenticated dashboard and its feature pages.

``DashboardPage`` models the shell plus a route map covering every core screen,
so authenticated tests can visit any feature page by name without hardcoding
paths in the test body.
"""
from __future__ import annotations

from playwright.sync_api import Page

from pages.base_page import BasePage

# name -> path for every authenticated feature screen.
FEATURE_PAGES = {
    "dashboard": "/dashboard",
    "create": "/create",
    "drafts": "/drafts",
    "approval": "/approval",
    "all_blogs": "/all-blogs",
    "categories": "/categories",
    "comments": "/comments",
    "seo_tools": "/seo-tools",
    "formatting_tools": "/formatting-tools",
    "optimization": "/optimization",
    "analytics": "/analytics",
    "schedule": "/schedule",
    "leads": "/leads",
    "gallery": "/gallery",
    "newsletter": "/newsletter",
    "activity_log": "/activity-log",
    "site_settings": "/site-settings",
    "app_settings": "/app-settings",
    "profile": "/profile",
    "manage_users": "/manage-users",  # admin only
}


class DashboardPage(BasePage):
    path = "/dashboard"

    def __init__(self, page: Page):
        super().__init__(page)
        self.logout_link = page.get_by_role("link", name="Logout")

    def is_loaded(self) -> bool:
        return "/dashboard" in self.page.url

    def go(self, name: str):
        """Navigate to a named feature page and return the response."""
        return self.open(FEATURE_PAGES[name])

    def logout(self) -> None:
        self.open("/logout")
