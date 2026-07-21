"""Page object for the Login screen (/login)."""
from __future__ import annotations

from playwright.sync_api import Page

from pages.base_page import BasePage


class LoginPage(BasePage):
    path = "/login"

    def __init__(self, page: Page):
        super().__init__(page)
        self.email_input = page.locator("input[name='email']")
        self.password_input = page.locator("input[name='password']")
        self.submit_button = page.locator("form button[type='submit']")
        self.google_button = page.locator("#googleSignIn")
        self.forgot_link = page.get_by_role("link", name="Forgot Password?")
        self.signup_link = page.get_by_role("link", name="Create an Account")

    # --- queries -------------------------------------------------------------

    def is_loaded(self) -> bool:
        return (
            self.email_input.is_visible()
            and self.password_input.is_visible()
            and self.submit_button.is_visible()
        )

    # --- actions -------------------------------------------------------------

    def sign_in(self, email: str, password: str) -> None:
        """Fill the credentials and submit (real Firebase JS auth runs client-side)."""
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.submit_button.click()

    def go_to_signup(self) -> None:
        self.signup_link.click()

    def go_to_forgot_password(self) -> None:
        self.forgot_link.click()
