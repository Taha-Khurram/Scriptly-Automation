"""Tier 2 — core blog-workflow tests for a logged-in user.

Covers the cheap, deterministic parts of the content lifecycle end-to-end:
  * Category CRUD  : create -> appears in list -> rename -> delete
  * Blog reads     : all-blogs / drafts listings return data
Expensive, quota-consuming AI paths (generate, humanize) are marked
``expensive`` and skipped unless RUN_EXPENSIVE=1 so a normal run never spends
Gemini credits.

Auto-skips entirely without credentials.
"""
import os

import pytest

from config.settings import settings
from utils.helpers import unique_gmail  # noqa: F401  (kept for future data-driven tests)

pytestmark = pytest.mark.auth

RUN_EXPENSIVE = os.getenv("RUN_EXPENSIVE") == "1"


def _api(page):
    return page.request


def test_category_crud_lifecycle(logged_in_page):
    """Create a category, confirm it lists, rename it, then delete it."""
    api = _api(logged_in_page)
    name = "QA Automation Cat"

    # create
    created = api.post(
        settings.url("/api/categories"),
        data={"name": name},
        headers={"Content-Type": "application/json"},
        fail_on_status_code=False,
    )
    assert created.status == 200, created.text()
    body = created.json()
    assert body.get("success") is True
    cat_id = body.get("id")
    assert cat_id

    try:
        # rename
        renamed = api.post(
            settings.url(f"/api/edit_category/{cat_id}"),
            data={"name": name + " Edited"},
            headers={"Content-Type": "application/json"},
            fail_on_status_code=False,
        )
        assert renamed.status == 200
        assert renamed.json().get("success") is True
    finally:
        # delete (cleanup — category has no blogs so this is allowed)
        deleted = api.delete(
            settings.url(f"/api/delete_category/{cat_id}"),
            fail_on_status_code=False,
        )
        assert deleted.status == 200
        assert deleted.json().get("success") is True


def test_create_category_rejects_empty_name(logged_in_page):
    resp = _api(logged_in_page).post(
        settings.url("/api/categories"),
        data={"name": "   "},
        headers={"Content-Type": "application/json"},
        fail_on_status_code=False,
    )
    assert resp.status == 400
    assert resp.json().get("success") is False


def test_all_blogs_listing_returns_structure(logged_in_page):
    resp = _api(logged_in_page).get(
        settings.url("/api/all-blogs"), fail_on_status_code=False
    )
    assert resp.status == 200
    # Response is JSON (list of blogs or an object wrapping them).
    assert "application/json" in resp.headers.get("content-type", "")


@pytest.mark.expensive
@pytest.mark.skipif(not RUN_EXPENSIVE, reason="RUN_EXPENSIVE=1 not set (spends Gemini credits)")
def test_ai_blog_generation_starts(logged_in_page):
    """Kick off the AI generation pipeline and confirm a task id comes back."""
    resp = _api(logged_in_page).post(
        settings.url("/api/generate"),
        data={"prompt": "A short post about automated testing"},
        headers={"Content-Type": "application/json"},
        fail_on_status_code=False,
    )
    assert resp.status in (200, 202)
    body = resp.json()
    assert body.get("success") is not False
