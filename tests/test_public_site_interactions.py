"""Public blog-site interaction tests: contact, newsletter subscribe, and
semantic search.

These exercise the public-facing write/search endpoints through their validation
paths (no AI cost, no data writes) so they are safe to run against any site.
All self-skip when the configured SITE_SLUG does not resolve to a real site.
"""
import pytest

from config.settings import settings


@pytest.fixture
def site_base(page, app_settings):
    base = app_settings.url(f"/site/{app_settings.site_slug}")
    resp = page.request.get(base, fail_on_status_code=False)
    if resp.status >= 400:
        pytest.skip(f"Public site '{app_settings.site_slug}' not found — set SITE_SLUG")
    return base


@pytest.mark.public
def test_subscribe_rejects_invalid_email(page, site_base):
    resp = page.request.post(
        f"{site_base}/subscribe",
        form={"email": "not-an-email"},
        fail_on_status_code=False,
    )
    assert resp.status == 400
    assert resp.json().get("success") is False


@pytest.mark.public
def test_semantic_search_requires_query(page, site_base):
    resp = page.request.post(
        f"{site_base}/semantic-search",
        data={"query": ""},
        headers={"Content-Type": "application/json"},
        fail_on_status_code=False,
    )
    assert resp.status == 400
    body = resp.json()
    assert body.get("success") is False
    assert body.get("results") == []


@pytest.mark.public
def test_semantic_search_rejects_too_short_query(page, site_base):
    resp = page.request.post(
        f"{site_base}/semantic-search",
        data={"query": "a"},
        headers={"Content-Type": "application/json"},
        fail_on_status_code=False,
    )
    assert resp.status == 400


@pytest.mark.public
def test_contact_form_renders_fields(page, app_settings, site_base):
    page.goto(f"{site_base}/contact", wait_until="domcontentloaded")
    # Contact form posts name/email/subject/message.
    assert page.locator("form").first.is_visible()
    assert page.locator("input[name='email'], #email").first.is_visible()
