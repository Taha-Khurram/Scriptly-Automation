"""Page object for the Forgot Password screen (/forgot-password)."""
from __future__ import annotations

from playwright.sync_api import Page

from pages.base_page import BasePage


class ForgotPasswordPage(BasePage):
    path = "/forgot-password"

    def __init__(self, page: Page):
        super().__init__(page)
        self.email_input = page.locator("input[type='email']").first
        self.submit_button = page.locator("form button[type='submit']").first
        self.login_link = page.get_by_role("link", name="Back to Sign In").first

    def is_loaded(self) -> bool:
        return self.email_input.is_visible()

    def request_reset(self, email: str) -> None:
        self.email_input.fill(email)
        self.submit_button.click()
