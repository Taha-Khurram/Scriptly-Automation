"""Access-control coverage for EVERY core functionality.

For each protected endpoint across the whole app (blog lifecycle, categories,
SEO, comments, activity, leads, gallery, newsletter, optimization, schedule,
analytics, settings, user management) a logged-out caller must be denied —
never served real data or allowed to mutate state.

Denial = redirect to login (302) or a JSON 401/403, or an admin-hidden 404.
Runs without any credentials, so it protects the entire API surface in CI.
"""
import pytest

from config.settings import settings
from data.endpoints import (
    ALL_PROTECTED,
    DENIED_CODES,
    PUBLIC_ENDPOINTS,
    Endpoint,
)


def _call(page, ep: Endpoint):
    """Issue the request WITHOUT following redirects so 302 guards are visible."""
    url = settings.url(ep.path)
    return page.request.fetch(
        url,
        method=ep.method,
        max_redirects=0,
        headers={"Content-Type": "application/json"},
        data="{}" if ep.method in ("POST", "PATCH", "PUT", "DELETE") else None,
        fail_on_status_code=False,
    )


@pytest.mark.smoke
@pytest.mark.parametrize("ep", ALL_PROTECTED, ids=str)
def test_protected_endpoint_denies_logged_out_caller(page, ep):
    resp = _call(page, ep)
    assert resp.status in DENIED_CODES, (
        f"{ep} was reachable while logged out (status {resp.status}); "
        f"expected one of {sorted(DENIED_CODES)}"
    )


@pytest.mark.parametrize("ep", ALL_PROTECTED, ids=str)
def test_protected_endpoint_matches_expected_guard(page, ep):
    """Stronger assertion: the guard style is exactly what the app documents."""
    resp = _call(page, ep)
    assert resp.status == ep.logged_out_status, (
        f"{ep}: guard changed — got {resp.status}, expected {ep.logged_out_status}"
    )


@pytest.mark.parametrize("ep", PUBLIC_ENDPOINTS, ids=str)
def test_public_endpoint_is_reachable(page, ep):
    resp = _call(page, ep)
    assert resp.status == 200, f"{ep} should be public but returned {resp.status}"
