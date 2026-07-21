"""End-to-end blog lifecycle test (Tier 2, expensive).

Drives one blog through the ENTIRE content pipeline as a logged-in admin and
verifies it actually lands on the public site:

    1. CREATE    -> POST /api/generate            (AI pipeline, async task)
    2. HUMANIZE  -> POST /api/humanize/<id>        (AI rewrite, async task)
    3. OPTIMIZE  -> POST /api/seo/optimize-blog    (SEO agent, sync)
    4. APPROVE   -> POST /api/update_status  UNDER_REVIEW
    5. (guard)   -> public post URL must 404 while unpublished
    6. PUBLISH   -> POST /api/update_status  PUBLISHED  (admin-only)
    7. VERIFY    -> public post page returns 200 and shows the title,
                    and the post appears in the public blog listing
    8. CLEANUP   -> DELETE /api/delete_blog/<id>

Because it spends Gemini/AI credits and takes several minutes, it is gated
behind BOTH real credentials (`-m auth`) and RUN_EXPENSIVE=1.
"""
import os

import pytest

from config.settings import settings
from utils.helpers import poll_task

pytestmark = pytest.mark.auth

RUN_EXPENSIVE = os.getenv("RUN_EXPENSIVE") == "1"

# Topic for the generated post. The app derives the title from the prompt, and
# verification later uses the blog's *current* (post-SEO) title, so no special
# marker is needed.
PROMPT = "The benefits of automated end-to-end testing for web applications"

# AI endpoints are slow: generation/humanize kick off async tasks (usually fast
# to return a 202, but slower under load) and SEO optimize runs synchronously.
# Give these calls generous per-request timeouts, well above the 30s default.
AI_TIMEOUT_MS = 120_000


def _status_url(task_id: str) -> str:
    return settings.url(f"/api/generate/status/{task_id}")


def _find_new_blog(request, known_ids: set[str]):
    """Return the newest blog (by list order) whose id is not in known_ids."""
    resp = request.get(settings.url("/api/all-blogs?status=all&page=1"), fail_on_status_code=False)
    assert resp.status == 200, resp.text()
    for blog in resp.json().get("blogs", []):
        if blog.get("id") not in known_ids:
            return blog
    return None


def _get_blog(request, blog_id: str) -> dict | None:
    """Return the current blog record (fresh title/status) from the listing."""
    resp = request.get(settings.url("/api/all-blogs?status=all&page=1"), fail_on_status_code=False)
    if resp.status != 200:
        return None
    for blog in resp.json().get("blogs", []):
        if blog.get("id") == blog_id:
            return blog
    return None


def _blog_status(request, blog_id: str) -> str | None:
    blog = _get_blog(request, blog_id)
    return (blog.get("status") or "").upper() if blog else None


@pytest.mark.expensive
@pytest.mark.skipif(not RUN_EXPENSIVE, reason="RUN_EXPENSIVE=1 not set (spends AI credits)")
def test_full_blog_lifecycle_create_humanize_optimize_approve_publish(logged_in_page, app_settings):
    api = logged_in_page.request
    # Public verification uses the account's site SLUG. Accessing a post by
    # raw user_id 404s (the site_post route swallows the canonical-redirect
    # exception), so the slug is the reliable public identifier.
    site_slug = app_settings.site_slug
    if not site_slug:
        pytest.skip("SITE_SLUG not set — needed to verify the published post publicly")
    blog_id = None
    try:
        # ---- 0. snapshot existing blog ids (newest are on page 1) ----------
        before = api.get(settings.url("/api/all-blogs?status=all&page=1"), fail_on_status_code=False)
        assert before.status == 200
        known_ids = {b.get("id") for b in before.json().get("blogs", [])}

        # ---- 1. CREATE via the AI generation pipeline ----------------------
        gen = api.post(
            settings.url("/api/generate"),
            data={"prompt": PROMPT, "auto_submit": False},
            headers={"Content-Type": "application/json"},
            timeout=AI_TIMEOUT_MS,
            fail_on_status_code=False,
        )
        assert gen.status == 202, gen.text()
        task_id = gen.json()["task_id"]
        poll_task(api, _status_url(task_id), timeout_s=300)

        # identify the freshly created draft + capture its author_id (= our uid)
        blog = _find_new_blog(api, known_ids)
        assert blog is not None, "generated blog did not appear in /api/all-blogs"
        blog_id = blog["id"]
        assert (blog.get("status") or "").upper() == "DRAFT"
        print(f"[E2E] created blog id={blog_id} title={blog.get('title')!r}")

        # Public post URL, addressed via the site slug + the blog id.
        post_url = settings.url(f"/site/{site_slug}/post/{blog_id}")

        # ---- 2. HUMANIZE ---------------------------------------------------
        hum = api.post(
            settings.url(f"/api/humanize/{blog_id}"),
            data="{}",
            headers={"Content-Type": "application/json"},
            timeout=AI_TIMEOUT_MS,
            fail_on_status_code=False,
        )
        assert hum.status == 202, hum.text()
        poll_task(api, _status_url(hum.json()["task_id"]), timeout_s=300)

        # ---- 3. OPTIMIZE (SEO) --------------------------------------------
        opt = api.post(
            settings.url(f"/api/seo/optimize-blog/{blog_id}"),
            data={"region": "US"},
            headers={"Content-Type": "application/json"},
            timeout=AI_TIMEOUT_MS,  # synchronous SEO agent — can take a while
            fail_on_status_code=False,
        )
        assert opt.status == 200, opt.text()
        assert opt.json().get("success") is True

        # ---- 4. PUSH FOR APPROVAL -----------------------------------------
        rev = api.post(
            settings.url(f"/api/update_status/{blog_id}"),
            data={"status": "UNDER_REVIEW"},
            headers={"Content-Type": "application/json"},
            fail_on_status_code=False,
        )
        assert rev.status == 200 and rev.json().get("success") is True
        assert _blog_status(api, blog_id) == "UNDER_REVIEW"

        # ---- 5. GUARD: not yet visible on the public site ------------------
        pre = api.get(post_url, fail_on_status_code=False)
        assert pre.status == 404, f"unpublished post should 404, got {pre.status}"

        # ---- 6. PUBLISH (admin-only) --------------------------------------
        pub = api.post(
            settings.url(f"/api/update_status/{blog_id}"),
            data={"status": "PUBLISHED"},
            headers={"Content-Type": "application/json"},
            timeout=AI_TIMEOUT_MS,  # publish applies formatting + embedding
            fail_on_status_code=False,
        )
        assert pub.status == 200, pub.text()
        assert pub.json().get("success") is True
        assert _blog_status(api, blog_id) == "PUBLISHED"

        # ---- 7. VERIFY it is live on the public site -----------------------
        # Re-fetch the CURRENT title — SEO optimization rewrites it, so the
        # public page shows the optimized title, not the original.
        current = _get_blog(api, blog_id) or {}
        current_title = current.get("title") or blog.get("title") or ""
        post = api.get(post_url, fail_on_status_code=False)
        assert post.status == 200, f"published post not reachable (status {post.status})"
        body = post.text()
        # The published post page must render the blog's (optimized) title.
        assert current_title and current_title in body, (
            "published post page does not show the blog title"
        )

        # and it should surface in the public blog listing
        listing = api.get(settings.url(f"/site/{site_slug}/blog"), fail_on_status_code=False)
        assert listing.status == 200
        print(f"[E2E] verified published post is live at {post_url}")

    finally:
        # ---- 8. CLEANUP ----------------------------------------------------
        if blog_id:
            api.delete(settings.url(f"/api/delete_blog/{blog_id}"), fail_on_status_code=False)
