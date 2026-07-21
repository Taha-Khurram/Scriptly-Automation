"""Access-control / navigation tests.

Every protected dashboard route must bounce a logged-out visitor to /login.
"""
import pytest

from data.test_data import PROTECTED_ROUTES
from config.settings import settings


@pytest.mark.parametrize("route", PROTECTED_ROUTES)
def test_protected_route_redirects_to_login_when_logged_out(page, route):
    page.goto(settings.url(route), wait_until="domcontentloaded")
    # The app should redirect an unauthenticated user to the login screen.
    assert "/login" in page.url, f"{route} did not redirect to /login (got {page.url})"
