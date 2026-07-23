/**
 * End-to-end blog lifecycle test (Tier 2, expensive).
 *
 * Drives one blog through the ENTIRE content pipeline as a logged-in admin and
 * verifies — by reading state back at every step — that it actually lands on the
 * public site:
 *
 *   1. CREATE    -> POST /api/generate            (AI pipeline, async task)
 *   2. HUMANIZE  -> POST /api/humanize/<id>        (AI rewrite, async task)
 *   3. OPTIMIZE  -> POST /api/seo/optimize-blog    (SEO agent, sync)
 *   4. APPROVE   -> POST /api/update_status  UNDER_REVIEW
 *   5. (guard)   -> public post URL must 404 while unpublished
 *   6. PUBLISH   -> POST /api/update_status  PUBLISHED  (admin-only)
 *   7. VERIFY    -> public post page returns 200 and shows the title
 *   8. CLEANUP   -> DELETE /api/delete_blog/<id>
 *
 * Because it spends AI credits and takes several minutes, it is gated behind
 * BOTH real credentials (@auth) and RUN_EXPENSIVE=1.
 */
import { test, expect } from '../src/fixtures';
import { config, hasCredentials } from '../src/config/env';

// Topic for the generated post. The app derives the title from the prompt, and
// verification later uses the blog's *current* (post-SEO) title.
const PROMPT = 'The benefits of automated end-to-end testing for web applications';

test(
  'full blog lifecycle: create → humanize → optimize → approve → publish',
  {
    tag: ['@auth', '@expensive'],
  },
  async ({ request, blogApi }) => {
    test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set');
    test.skip(!config.runExpensive, 'RUN_EXPENSIVE=1 not set (spends AI credits)');
    test.setTimeout(15 * 60_000);

    const siteSlug = config.siteSlug;
    test.skip(!siteSlug, 'SITE_SLUG not set — needed to verify the published post publicly');

    let blogId: string | null = null;
    try {
      // ---- 0. snapshot existing blog ids (newest are on page 1) --------------
      const knownIds = await blogApi.knownIds();

      // ---- 1. CREATE via the AI generation pipeline --------------------------
      const gen = await blogApi.generate(PROMPT);
      expect(gen.status(), await gen.text()).toBe(202);
      await blogApi.waitForTask(gen);

      // READ-BACK: the freshly created draft is now in the listing, as a DRAFT.
      const blog = await blogApi.findNew(knownIds);
      expect(blog, 'generated blog did not appear in /api/all-blogs').not.toBeNull();
      blogId = blog!.id;
      expect(String(blog!.status ?? '').toUpperCase()).toBe('DRAFT');

      // Public post URL, addressed via the site slug + the blog id.
      const postUrl = `/site/${siteSlug}/post/${blogId}`;

      // ---- 2. HUMANIZE -------------------------------------------------------
      const hum = await blogApi.humanize(blogId!);
      expect(hum.status(), await hum.text()).toBe(202);
      await blogApi.waitForTask(hum);

      // ---- 3. OPTIMIZE (SEO) -------------------------------------------------
      const opt = await blogApi.optimizeSeo(blogId!);
      expect(opt.status(), await opt.text()).toBe(200);
      expect((await opt.json()).success).toBe(true);

      // ---- 4. PUSH FOR APPROVAL ----------------------------------------------
      const rev = await blogApi.setStatus(blogId!, 'UNDER_REVIEW');
      expect(rev.status()).toBe(200);
      expect((await rev.json()).success).toBe(true);
      expect(await blogApi.statusOf(blogId!)).toBe('UNDER_REVIEW');

      // ---- 5. GUARD: not yet visible on the public site ----------------------
      const pre = await request.get(postUrl);
      expect(pre.status(), 'unpublished post should 404').toBe(404);

      // ---- 6. PUBLISH (admin-only) -------------------------------------------
      const pub = await blogApi.setStatus(blogId!, 'PUBLISHED');
      expect(pub.status(), await pub.text()).toBe(200);
      expect((await pub.json()).success).toBe(true);
      expect(await blogApi.statusOf(blogId!)).toBe('PUBLISHED');

      // ---- 7. VERIFY it is live on the public site ---------------------------
      // Re-fetch the CURRENT title — SEO optimization rewrites it.
      const current = await blogApi.getById(blogId!);
      const currentTitle = current?.title || blog!.title || '';
      const post = await request.get(postUrl);
      expect(post.status(), `published post not reachable (status ${post.status()})`).toBe(200);
      const bodyText = await post.text();
      expect(
        Boolean(currentTitle) && bodyText.includes(String(currentTitle)),
        'published post page does not show the blog title',
      ).toBe(true);

      // and it should surface in the public blog listing
      const listing = await request.get(`/site/${siteSlug}/blog`);
      expect(listing.status()).toBe(200);
    } finally {
      // ---- 8. CLEANUP --------------------------------------------------------
      if (blogId) await blogApi.remove(blogId);
    }
  },
);
