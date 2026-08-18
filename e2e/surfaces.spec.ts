import { expect, test } from "@playwright/test";

import { BLUEPRINT_PATH, visitableSurfaces } from "../src/lib/surfaces.ts";

/**
 * Every surface renders, at every viewport, with the nav structure AC-3.3 and
 * AC-3.4 require.
 *
 * The surface list is imported, never written out here. A route added to
 * `src/routes/` and forgotten in `SURFACES` would otherwise be a page no
 * browser check ever visits — and `route-shape.test.ts` is what stops the list
 * itself from going stale against the generated router. The two together are
 * what make "checked on every page" a true statement rather than a hopeful one.
 */

const surfaces = visitableSurfaces();

test.describe("every surface renders", () => {
  // A floor on the fixture itself. `for (const s of [])` is a green suite that
  // ran nothing, and it looks identical to a green suite that ran everything.
  test("the surface list is populated", () => {
    expect(surfaces.length).toBeGreaterThanOrEqual(8);
  });

  for (const surface of surfaces) {
    test(`${surface.path} renders and carries the right nav`, async ({ page }) => {
      const response = await page.goto(surface.path);
      expect(response?.ok(), `${surface.path} must return a 2xx`).toBe(true);

      // A 200 that renders nothing is not a page. This catches a route that
      // resolves, throws during render, and still answers 200 from the shell.
      const main = page.locator("main, body");
      const text = (await main.first().innerText()).trim();
      expect(text.length, `${surface.path} must render visible content`).toBeGreaterThan(200);

      const navs = await page.locator("nav").count();
      if (surface.path === BLUEPRINT_PATH) {
        // AC-3.4 — the Blueprint page is the one surface with a second,
        // in-page section sub-nav.
        expect(
          navs,
          "the Blueprint page carries the top nav plus its sub-nav",
        ).toBeGreaterThanOrEqual(2);
      } else {
        // AC-3.3 — everywhere else, exactly one.
        expect(navs, `${surface.path} renders only the single top nav`).toBe(1);
      }

      // No image may 404. `naturalWidth === 0` on a loaded <img> is the only
      // reliable in-browser signal for this; a network listener misses images
      // served from cache on a second visit.
      const broken = await page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src),
      );
      expect(broken, `${surface.path} must render every image`).toEqual([]);

      // AC-1.6 — no Lovable pointer path survives into the deploy. Those
      // `/__l5e/...` URLs are served only by Lovable's own hosting, so one
      // baked into the bundle is a guaranteed production 404.
      const lovable = await page.evaluate(() =>
        Array.from(document.images)
          .map((img) => img.getAttribute("src") ?? "")
          .filter((src) => src.includes("__l5e")),
      );
      expect(lovable, `${surface.path} must reference no Lovable asset path`).toEqual([]);
    });
  }
});
