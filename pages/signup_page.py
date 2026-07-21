"""Page object for the Sign Up screen (/signup)."""
from __future__ import annotations

from playwright.sync_api import Page

from pages.base_page import BasePage


class SignupPage(BasePage):
    path = "/signup"

    def __init__(self, page: Page):
        super().__init__(page)
        self.form = page.locator("#signupForm")
        self.name_input = page.locator("#username")
        self.email_input = page.locator("#email")
        self.password_input = page.locator("#password")
        self.submit_button = page.locator("#signupForm button[type='submit']")
        self.google_button = page.locator("#googleSignUp")
        self.email_error = page.locator("#emailError")
        self.password_error = page.locator("#passwordError")
        self.login_link = page.get_by_role("link", name="Login Here")

    # --- queries -------------------------------------------------------------

    def is_loaded(self) -> bool:
        return (
            self.name_input.is_visible()
            and self.email_input.is_visible()
            and self.password_input.is_visible()
        )

    def gmail_hint_visible(self) -> bool:
        return self.page.get_by_text("Only Gmail addresses").first.is_visible()

    def password_policy_hint_visible(self) -> bool:
        return self.page.get_by_text("8+ chars, 1 uppercase").first.is_visible()

    # --- actions -------------------------------------------------------------

    def fill_form(self, name: str, email: str, password: str) -> None:
        self.name_input.fill(name)
        self.email_input.fill(email)
        self.password_input.fill(password)

    def submit(self) -> None:
        self.submit_button.click()
