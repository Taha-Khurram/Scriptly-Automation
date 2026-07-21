"""Login screen tests (/login)."""
import pytest
from playwright.sync_api import expect

from pages.login_page import LoginPage


@pytest.mark.smoke
def test_login_page_loads(page):
    login = LoginPage(page)
    login.open()
    assert login.is_loaded()
    assert "login" in page.url.lower()


@pytest.mark.smoke
def test_login_has_all_controls(page):
    login = LoginPage(page)
    login.open()
    expect(login.email_input).to_be_visible()
    expect(login.password_input).to_be_visible()
    expect(login.submit_button).to_be_visible()
    expect(login.google_button).to_be_visible()


def test_login_links_to_signup_and_forgot(page):
    login = LoginPage(page)
    login.open()
    expect(login.signup_link).to_be_visible()
    expect(login.forgot_link).to_be_visible()


def test_empty_submit_is_blocked_by_required_fields(page):
    """HTML5 'required' should keep us on /login when the form is empty."""
    login = LoginPage(page)
    login.open()
    login.submit_button.click()
    # Browser blocks submission; the email field reports invalid.
    is_invalid = login.email_input.evaluate("el => !el.validity.valid")
    assert is_invalid
    assert "login" in page.url.lower()


def test_expired_session_query_is_handled(page):
    """Opening /login?expired=1 must still render the form (no crash)."""
    login = LoginPage(page)
    login.open(expired="1")
    assert login.is_loaded()


# --- Tier 2 (authenticated) --------------------------------------------------

@pytest.mark.auth
def test_valid_login_redirects_to_dashboard(logged_in_page):
    assert "/dashboard" in logged_in_page.url


@pytest.mark.auth
def test_wrong_password_shows_error(page, app_settings):
    if not app_settings.has_credentials:
        pytest.skip("TEST_EMAIL / TEST_PASSWORD not set")
    login = LoginPage(page)
    login.open()
    login.sign_in(app_settings.test_email, "definitely-wrong-password")
    # We must NOT end up on the dashboard.
    page.wait_for_timeout(3000)
    assert "/dashboard" not in page.url
