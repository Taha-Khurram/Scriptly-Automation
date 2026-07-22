/**
 * End-to-end blog lifecycle test (Tier 2, expensive).
 *
 * Drives one blog through the ENTIRE content pipeline as a logged-in admin and
 * verifies it actually lands on the public site:
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
import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../src/fixtures';
import { config, hasCredentials } from '../src/config/env';
import { pollTask } from '../src/utils/helpers';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Topic for the generated post. The app derives the title from the prompt, and
// verification later uses the blog's *current* (post-SEO) title.
const PROMPT = 'The benefits of automated end-to-end testing for web applications';

// AI endpoints are slow: generation/humanize kick off async tasks and SEO
// optimize runs synchronously. Give these calls generous per-request timeouts.
const AI_TIMEOUT_MS = 120_000;

const statusUrl = (taskId: string) => `/api/generate/status/${taskId}`;

async function listBlogs(request: APIRequestContext): Promise<any[]> {
  const resp = await request.get('/api/all-blogs?status=all&page=1');
  if (resp.status() !== 200) return [];
  return (await resp.json()).blogs ?? [];
}

async function findNewBlog(request: APIRequestContext, knownIds: Set<string>): Promise<any | null> {
  for (const blog of await listBlogs(request)) {
    if (!knownIds.has(blog.id)) return blog;
  }
  return null;
}

async function getBlog(request: APIRequestContext, blogId: string): Promise<any | null> {
  for (const blog of await listBlogs(request)) {
    if (blog.id === blogId) return blog;
  }
  return null;
}

async function blogStatus(request: APIRequestContext, blogId: string): Promise<string | null> {
  const blog = await getBlog(request, blogId);
  return blog ? String(blog.status ?? '').toUpperCase() : null;
}

test('full blog lifecycle: create → humanize → optimize → approve → publish', {
  tag: ['@auth', '@expensive'],
}, async ({ request }) => {
  test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set');
  test.skip(!config.runExpensive, 'RUN_EXPENSIVE=1 not set (spends AI credits)');
  test.setTimeout(15 * 60_000);

  const siteSlug = config.siteSlug;
  test.skip(!siteSlug, 'SITE_SLUG not set — needed to verify the published post publicly');

  let blogId: string | null = null;
  try {
    // ---- 0. snapshot existing blog ids (newest are on page 1) --------------
    const before = await request.get('/api/all-blogs?status=all&page=1');
    expect(before.status()).toBe(200);
    const knownIds = new Set<string>(((await before.json()).blogs ?? []).map((b: any) => b.id));

    // ---- 1. CREATE via the AI generation pipeline --------------------------
    const gen = await request.post('/api/generate', {
      data: { prompt: PROMPT, auto_submit: false },
      headers: JSON_HEADERS,
      timeout: AI_TIMEOUT_MS,
    });
    expect(gen.status(), await gen.text()).toBe(202);
    await pollTask(request, statusUrl((await gen.json()).task_id), { timeoutMs: 300_000 });

    // identify the freshly created draft
    const blog = await findNewBlog(request, knownIds);
    expect(blog, 'generated blog did not appear in /api/all-blogs').not.toBeNull();
    blogId = blog.id;
    expect(String(blog.status ?? '').toUpperCase()).toBe('DRAFT');

    // Public post URL, addressed via the site slug + the blog id.
    const postUrl = `/site/${siteSlug}/post/${blogId}`;

    // ---- 2. HUMANIZE -------------------------------------------------------
    const hum = await request.post(`/api/humanize/${blogId}`, {
      data: '{}',
      headers: JSON_HEADERS,
      timeout: AI_TIMEOUT_MS,
    });
    expect(hum.status(), await hum.text()).toBe(202);
    await pollTask(request, statusUrl((await hum.json()).task_id), { timeoutMs: 300_000 });

    // ---- 3. OPTIMIZE (SEO) -------------------------------------------------
    const opt = await request.post(`/api/seo/optimize-blog/${blogId}`, {
      data: { region: 'US' },
      headers: JSON_HEADERS,
      timeout: AI_TIMEOUT_MS,
    });
    expect(opt.status(), await opt.text()).toBe(200);
    expect((await opt.json()).success).toBe(true);

    // ---- 4. PUSH FOR APPROVAL ---------------------------------------------
    const rev = await request.post(`/api/update_status/${blogId}`, {
      data: { status: 'UNDER_REVIEW' },
      headers: JSON_HEADERS,
    });
    expect(rev.status()).toBe(200);
    expect((await rev.json()).success).toBe(true);
    expect(await blogStatus(request, blogId!)).toBe('UNDER_REVIEW');

    // ---- 5. GUARD: not yet visible on the public site ----------------------
    const pre = await request.get(postUrl);
    expect(pre.status(), 'unpublished post should 404').toBe(404);

    // ---- 6. PUBLISH (admin-only) ------------------------------------------
    const pub = await request.post(`/api/update_status/${blogId}`, {
      data: { status: 'PUBLISHED' },
      headers: JSON_HEADERS,
      timeout: AI_TIMEOUT_MS,
    });
    expect(pub.status(), await pub.text()).toBe(200);
    expect((await pub.json()).success).toBe(true);
    expect(await blogStatus(request, blogId!)).toBe('PUBLISHED');

    // ---- 7. VERIFY it is live on the public site ---------------------------
    // Re-fetch the CURRENT title — SEO optimization rewrites it.
    const current = (await getBlog(request, blogId!)) ?? {};
    const currentTitle = current.title || blog.title || '';
    const post = await request.get(postUrl);
    expect(post.status(), `published post not reachable (status ${post.status()})`).toBe(200);
    const bodyText = await post.text();
    expect(Boolean(currentTitle) && bodyText.includes(currentTitle), 'published post page does not show the blog title').toBe(true);

    // and it should surface in the public blog listing
    const listing = await request.get(`/site/${siteSlug}/blog`);
    expect(listing.status()).toBe(200);
  } finally {
    // ---- 8. CLEANUP --------------------------------------------------------
    if (blogId) await request.delete(`/api/delete_blog/${blogId}`);
  }
});
