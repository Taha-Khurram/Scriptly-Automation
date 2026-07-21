"""Public blog site tests (/site/<slug>).

These self-skip when the configured SITE_SLUG does not resolve to a real site,
so the suite stays green on a fresh database.
"""
import pytest

from pages.public_site_page import PublicSitePage
from data.test_data import PUBLIC_SITE_PAGES, PUBLIC_SITE_FEEDS


@pytest.fixture
def site(page, app_settings):
    sp = PublicSitePage(page, slug=app_settings.site_slug)
    resp = sp.open_page("")
    if resp is not None and resp.status == 404:
        pytest.skip(f"Public site '{app_settings.site_slug}' not found (404) — set SITE_SLUG")
    return sp


@pytest.mark.public
def test_public_home_loads(site):
    assert site.page.locator("body").is_visible()


@pytest.mark.public
@pytest.mark.parametrize("subpath", PUBLIC_SITE_PAGES)
def test_public_pages_respond(site, subpath):
    resp = site.open_page(subpath)
    assert resp is not None
    assert resp.status < 500, f"{subpath} returned {resp.status}"


@pytest.mark.public
def test_contact_page_has_form(site):
    site.open_page("/contact")
    assert site.has_contact_form()


@pytest.mark.public
@pytest.mark.parametrize("path,expected_type", PUBLIC_SITE_FEEDS)
def test_feeds_content_type(page, app_settings, path, expected_type):
    # Feeds only make sense for a real site; skip when the site slug doesn't resolve.
    home = page.request.get(app_settings.url(f"/site/{app_settings.site_slug}"))
    if home.status >= 400:
        pytest.skip(f"Public site '{app_settings.site_slug}' not found — set SITE_SLUG")
    url = app_settings.url(f"/site/{app_settings.site_slug}{path}")
    resp = page.request.get(url)
    if resp.status == 404:
        pytest.skip(f"Feed {path} not available for this site")
    assert resp.status == 200
    content_type = resp.headers.get("content-type", "").lower()
    assert expected_type in content_type, f"{path}: got content-type '{content_type}'"


@pytest.mark.public
def test_unknown_site_is_handled(page, app_settings):
    """An unknown site slug should not 500."""
    resp = page.request.get(app_settings.url("/site/this-site-does-not-exist-xyz"))
    assert resp.status < 500
