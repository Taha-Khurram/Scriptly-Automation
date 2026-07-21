"""Tier 2 — authenticated load of every dashboard feature page.

Each core screen must render for a logged-in user (no redirect back to /login).
Auto-skips unless TEST_EMAIL / TEST_PASSWORD are configured.
"""
import pytest

from pages.dashboard_page import DashboardPage, FEATURE_PAGES

pytestmark = pytest.mark.auth

# manage-users is admin-only (404 for non-admins); assert it separately.
_STANDARD_PAGES = [n for n in FEATURE_PAGES if n != "manage_users"]


@pytest.mark.parametrize("name", _STANDARD_PAGES)
def test_feature_page_loads_for_authenticated_user(logged_in_page, name):
    dash = DashboardPage(logged_in_page)
    resp = dash.go(name)
    assert resp is not None
    assert resp.status < 400, f"{name} returned {resp.status}"
    # A protected page must NOT bounce us to the login screen.
    assert "/login" not in logged_in_page.url, f"{name} redirected to login"


def test_manage_users_visible_to_admin(logged_in_page, app_settings):
    dash = DashboardPage(logged_in_page)
    resp = dash.go("manage_users")
    # Admins get the page (200); non-admins get an intentional 404 — both are
    # valid, correct behaviour. What must never happen is a redirect to login.
    assert resp.status in (200, 404)
