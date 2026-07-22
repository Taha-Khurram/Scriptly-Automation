/**
 * Tier 2 — authenticated feature-API smoke tests.
 *
 * Non-destructive GET endpoints across every feature (blogs listing, comments,
 * activity, leads, gallery, schedule, newsletter, optimization, SEO drafts) must
 * return 200 JSON for a logged-in user. Auto-skips without credentials.
 */
import { test, expect } from '../src/fixtures';
import { hasCredentials } from '../src/config/env';
import { AUTHED_READ_APIS, endpointId } from '../src/data/endpoints';

test.beforeEach(() => {
  test.skip(!hasCredentials, 'TEST_EMAIL / TEST_PASSWORD not set — Tier 2 auth tests skipped');
});

for (const ep of AUTHED_READ_APIS) {
  test(`authenticated read API returns ok — ${endpointId(ep)}`, { tag: '@auth' }, async ({ request }) => {
    const resp = await request.get(ep.path);
    expect(resp.status(), `${endpointId(ep)} returned ${resp.status()} for an authed user`).toBe(200);
    // These endpoints all emit JSON.
    const ctype = resp.headers()['content-type'] ?? '';
    expect(ctype, `${endpointId(ep)} content-type was '${ctype}'`).toContain('application/json');
  });
}
