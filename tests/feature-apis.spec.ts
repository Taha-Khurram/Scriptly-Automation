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

    // Validate the actual response *shape* against the verified contract, so a
    // backend that starts returning an error body (or drops/renames a field)
    // fails here instead of silently passing a bare 200 + content-type check.
    const body = await resp.json();
    expect(body === null || typeof body !== 'object', `${endpointId(ep)} did not return a JSON object`).toBe(false);

    const spec = ep.json;
    if (spec?.success !== undefined) {
      expect(body.success, `${endpointId(ep)}: expected success=${spec.success}`).toBe(spec.success);
    }
    if (spec?.arrayKey) {
      expect(Array.isArray(body[spec.arrayKey]), `${endpointId(ep)}: '${spec.arrayKey}' should be an array`).toBe(true);
    }
    if (spec?.objectKey) {
      const val = body[spec.objectKey];
      expect(
        val !== null && typeof val === 'object',
        `${endpointId(ep)}: '${spec.objectKey}' should be an object`,
      ).toBe(true);
    }
  });
}
