/**
 * Access-control coverage for EVERY core functionality.
 *
 * For each protected endpoint across the whole app (blog lifecycle, categories,
 * SEO, comments, activity, leads, gallery, newsletter, optimization, schedule,
 * analytics, settings, user management) a logged-out caller must be denied —
 * never served real data or allowed to mutate state.
 *
 * Denial = redirect to login (302) or a JSON 401/403, or an admin-hidden 404.
 * Runs without any credentials, so it protects the entire API surface in CI.
 */
import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../src/fixtures';
import { ALL_PROTECTED, DENIED_CODES, Endpoint, endpointId, PUBLIC_ENDPOINTS } from '../src/data/endpoints';

/** Issue the request WITHOUT following redirects so 302 guards are visible. */
function call(request: APIRequestContext, ep: Endpoint) {
  const hasBody = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(ep.method);
  return request.fetch(ep.path, {
    method: ep.method,
    maxRedirects: 0,
    headers: { 'Content-Type': 'application/json' },
    data: hasBody ? '{}' : undefined,
    failOnStatusCode: false,
  });
}

for (const ep of ALL_PROTECTED) {
  test(`denies logged-out caller — ${endpointId(ep)}`, { tag: '@smoke' }, async ({ request }) => {
    const resp = await call(request, ep);
    expect(
      DENIED_CODES.has(resp.status()),
      `${endpointId(ep)} was reachable while logged out (status ${resp.status()}); ` +
        `expected one of ${[...DENIED_CODES].sort((a, b) => a - b)}`,
    ).toBe(true);
  });
}

for (const ep of ALL_PROTECTED) {
  test(`guard style matches contract — ${endpointId(ep)}`, async ({ request }) => {
    const resp = await call(request, ep);
    expect(resp.status(), `${endpointId(ep)}: guard changed`).toBe(ep.loggedOutStatus);
  });
}

for (const ep of PUBLIC_ENDPOINTS) {
  test(`public endpoint is reachable — ${endpointId(ep)}`, async ({ request }) => {
    const resp = await call(request, ep);
    expect(resp.status(), `${endpointId(ep)} should be public`).toBe(200);
  });
}
