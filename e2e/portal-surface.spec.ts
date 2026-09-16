import { expect, test } from "@playwright/test";

import e2eConfig from "../scripts/verify/e2e-config.json" with { type: "json" };

/**
 * The host split, against a dev server that answers both hosts.
 *
 * Document requests are asserted with `maxRedirects: 0` (the
 * chrome-and-nav pattern): the guard's 302/308 must be the raw answer, and
 * the Location header the whole contract. The SPA rows are the other half
 * of the same contract: a TanStack `<Link>`/`router.navigate` never
 * re-enters `src/server.ts`, so `__root.tsx` runs the SAME decision
 * function client-side on every pathname change — both directions are
 * proven here with a synthetic popstate, and the cross-host destinations
 * are intercepted with `page.route` so the test never contacts the live
 * deployment.
 */

const PORTAL_BASE = process.env.E2E_PORTAL_BASE_URL ?? e2eConfig.portalBaseUrl;
const APEX_BASE = process.env.E2E_BASE_URL ?? e2eConfig.defaultBaseUrl;
const PORTAL_PRODUCTION_ORIGIN = "https://portal.thebehumancompany.ca";
const APEX_PRODUCTION_ORIGIN = "https://thebehumancompany.ca";

/** Installs interception for both production origins; each answers a marker document. */
async function interceptProduction(page: import("@playwright/test").Page): Promise<void> {
  const marker =
    "<!doctype html><html><head><title>INTERCEPTED</title></head><body>marker</body></html>";
  for (const origin of [PORTAL_PRODUCTION_ORIGIN, APEX_PRODUCTION_ORIGIN]) {
    await page.route(`${origin}/**`, (route) =>
      route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: marker }),
    );
  }
}

test.describe("document requests — the host guard", () => {
  test("the portal root hops to /portal with a same-host 302", async ({ request }) => {
    const response = await request.get(`${PORTAL_BASE}/`, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe("/portal");
  });

  test("the portal host leaves a marketing path for the apex origin", async ({ request }) => {
    const response = await request.get(`${PORTAL_BASE}/why-we-exist`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(`${APEX_PRODUCTION_ORIGIN}/why-we-exist`);
  });

  test("the apex moves /portal to the portal origin", async ({ request }) => {
    const response = await request.get(`${APEX_BASE}/portal`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(`${PORTAL_PRODUCTION_ORIGIN}/portal`);
  });

  test("the apex moves /c/<token> preserving the path, under private-route headers", async ({
    request,
  }) => {
    const response = await request.get(`${APEX_BASE}/c/e2e-guard-probe-token-000000`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe(
      `${PORTAL_PRODUCTION_ORIGIN}/c/e2e-guard-probe-token-000000`,
    );
    // A redirect carrying a token in its path must carry the private
    // headers: the credential must not leak via a referrer or a shared cache.
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(response.headers()["cache-control"]).toBe("private, no-store");
  });

  test("marketing on the apex is untouched", async ({ request }) => {
    const response = await request.get(`${APEX_BASE}/why-we-exist`, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("the portal serves its own paths and refuses the marketing sitemap", async ({ request }) => {
    const portal = await request.get(`${PORTAL_BASE}/portal`, { maxRedirects: 0 });
    // Signed-out, /portal answers with the loader's redirect to sign-in —
    // same host, never bounced to the apex.
    expect(portal.headers()["location"] ?? "").not.toContain("thebehumancompany.ca");
    expect([200, 307]).toContain(portal.status());

    const sitemap = await request.get(`${PORTAL_BASE}/sitemap.xml`, { maxRedirects: 0 });
    expect(sitemap.status()).toBe(404);
  });
});

test.describe("client-side navigation — the symmetric guard", () => {
  test("an apex SPA navigation to /portal leaves for the portal origin", async ({ page }) => {
    await interceptProduction(page);
    await page.goto(`${APEX_BASE}/why-we-exist`);
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      history.pushState({}, "", "/portal");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await page.waitForURL(`${PORTAL_PRODUCTION_ORIGIN}/portal`, { timeout: 15_000 });
    expect(await page.title()).toBe("INTERCEPTED");
  });

  test("a portal SPA navigation to a marketing path leaves for the apex", async ({ page }) => {
    await interceptProduction(page);
    await page.goto(`${PORTAL_BASE}/portal`);
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      history.pushState({}, "", "/why-we-exist");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await page.waitForURL(`${APEX_PRODUCTION_ORIGIN}/why-we-exist`, { timeout: 15_000 });
    expect(await page.title()).toBe("INTERCEPTED");
  });
});
