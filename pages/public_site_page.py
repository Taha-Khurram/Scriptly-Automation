"""Page object for the public blog site (/site/<slug> and sub-pages)."""
from __future__ import annotations

from playwright.sync_api import Page, Response

from pages.base_page import BasePage
from config.settings import settings


class PublicSitePage(BasePage):
    def __init__(self, page: Page, slug: str | None = None):
        super().__init__(page)
        self.slug = slug or settings.site_slug
        self.path = f"/site/{self.slug}"

    def open_page(self, subpath: str = "") -> Response | None:
        """Open a sub-page such as '/blog', '/about', '/contact' (or '' for home)."""
        return self.open(f"/site/{self.slug}{subpath}")

    def contact_name_input(self):
        return self.page.locator("input[name='name'], #name").first

    def contact_email_input(self):
        return self.page.locator("input[name='email'], #email").first

    def has_contact_form(self) -> bool:
        return self.page.locator("form").first.is_visible()
