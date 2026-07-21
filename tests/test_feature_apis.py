"""Tier 2 — authenticated feature-API smoke tests.

Non-destructive GET endpoints across every feature (blogs listing, comments,
activity, leads, gallery, schedule, newsletter, optimization, SEO drafts) must
return 200 JSON for a logged-in user. Auto-skips without credentials.
"""
import pytest

from config.settings import settings
from data.endpoints import AUTHED_READ_APIS

pytestmark = pytest.mark.auth


@pytest.mark.parametrize("ep", AUTHED_READ_APIS, ids=str)
def test_authenticated_read_api_returns_ok(logged_in_page, ep):
    resp = logged_in_page.request.get(
        settings.url(ep.path), fail_on_status_code=False
    )
    assert resp.status == 200, f"{ep} returned {resp.status} for an authed user"
    # These endpoints all emit JSON.
    ctype = resp.headers.get("content-type", "")
    assert "application/json" in ctype, f"{ep} content-type was '{ctype}'"
