"""BasePage — shared behaviour for every page object.

Wraps a Playwright ``Page`` and provides intent-level navigation and query
helpers so individual page objects stay small and tests never touch raw
selectors directly.
"""
from __future__ import annotations

from playwright.sync_api import Page, Response

from config.settings import settings


class BasePage:
    #: Path this page lives at, relative to base_url. Overridden by subclasses.
    path: str = "/"

    def __init__(self, page: Page):
        self.page = page

    # --- navigation ----------------------------------------------------------

    def open(self, path: str | None = None, **query) -> Response | None:
        """Navigate to this page (or an explicit path) and wait for the DOM."""
        target = path if path is not None else self.path
        url = settings.url(target)
        if query:
            from urllib.parse import urlencode
            url = f"{url}?{urlencode(query)}"
        response = self.page.goto(url, wait_until="domcontentloaded")
        return response

    # --- helpers -------------------------------------------------------------

    @property
    def current_url(self) -> str:
        return self.page.url

    def title(self) -> str:
        return self.page.title()

    def is_visible(self, selector: str) -> bool:
        return self.page.locator(selector).first.is_visible()

    def text_of(self, selector: str) -> str:
        return (self.page.locator(selector).first.text_content() or "").strip()
