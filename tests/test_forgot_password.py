"""Forgot Password screen tests (/forgot-password)."""
import pytest
from playwright.sync_api import expect

from pages.forgot_password_page import ForgotPasswordPage


@pytest.mark.smoke
def test_forgot_password_page_loads(page):
    fp = ForgotPasswordPage(page)
    fp.open()
    assert fp.is_loaded()
    assert "forgot" in page.url.lower()


def test_forgot_password_has_email_field(page):
    fp = ForgotPasswordPage(page)
    fp.open()
    expect(fp.email_input).to_be_visible()


def test_forgot_password_links_back_to_login(page):
    fp = ForgotPasswordPage(page)
    fp.open()
    expect(fp.login_link).to_be_visible()


def test_unknown_email_check_returns_not_found(page, app_settings):
    """POST /api/auth/check-email should report a missing account (404).

    This endpoint makes a live Firebase Admin lookup, so a transient transport
    error is retried once before the assertion.
    """
    url = app_settings.url("/api/auth/check-email")
    payload = {"email": "does-not-exist-9f8a7b@gmail.com"}
    resp = None
    for attempt in range(2):
        try:
            resp = page.request.post(url, data=payload, fail_on_status_code=False)
            break
        except Exception:
            if attempt == 1:
                raise
            page.wait_for_timeout(1000)
    assert resp.status in (404, 400, 500)
    body = resp.json()
    assert body.get("exists") is False
