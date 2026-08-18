import { expect, test } from "@playwright/test";

import { visitableSurfaces } from "../src/lib/surfaces.ts";

/**
 * The typography checks that only a browser can make.
 *
 * `scripts/verify/type-diff.ts` compares computed size, weight, tracking and
 * line-height for every migrated element across both trees, and it is stronger
 * than a screenshot for those four properties. But it resolves values from
 * stylesheets — it never lays a page out, so it is blind to everything that
 * depends on layout:
 *
 *   · horizontal overflow
 *   · a heading wrapping onto a row its band was not sized for
 *   · a class list that is valid but resolves to no styling at all
 *
 * All three are real failure modes here, not hypotheticals. Phase 4 moved 39
 * call sites with sizes changing by up to +33%; deleting `display` while four
 * elements still referenced it left them rendering as body text on 13 surfaces;
 * and raising one step's floor by 21% wrapped a 36-character strapline in a
 * band sized for one row. The static sweep caught none of the three.
 */

const surfaces = visitableSurfaces();

/** Where the site's breakpoints actually sit, plus the design reference. */
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 780 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

test.describe("fixture floors", () => {
  test("the surface list is populated", () => {
    // `for (const s of [])` is a green suite that ran nothing and looks
    // identical to one that ran everything.
    expect(surfaces.length).toBeGreaterThanOrEqual(8);
  });
});

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}px)`, () => {
    for (const surface of surfaces) {
      test(`${surface.path} does not overflow horizontally`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(surface.path);
        await page.evaluate(() => document.fonts.ready);

        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.clientWidth;
          // 1px of slack: sub-pixel layout rounding is not a regression.
          const offenders: { tag: string; cls: string; right: number }[] = [];
          for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
            const style = getComputedStyle(el);
            if (style.position === "fixed" || style.overflowX === "auto") continue;
            if (style.overflowX === "scroll" || style.visibility === "hidden") continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right > docWidth + 1) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                cls: el.className?.toString().slice(0, 90) ?? "",
                right: Math.round(r.right),
              });
            }
          }
          return { docWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
        });

        expect(
          overflow.scrollWidth,
          `${surface.path} scrolls horizontally at ${vp.width}px; first offenders: ` +
            JSON.stringify(overflow.offenders.slice(0, 3)),
        ).toBeLessThanOrEqual(overflow.docWidth + 1);
      });

      test(`${surface.path} has no unstyled heading`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(surface.path);
        await page.evaluate(() => document.fonts.ready);

        const headings = await page.evaluate(() => {
          const out: { text: string; family: string; size: number }[] = [];
          for (const h of Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"))) {
            if (!h.innerText.trim()) continue;
            const s = getComputedStyle(h);
            out.push({
              text: h.innerText.trim().slice(0, 40),
              family: s.fontFamily,
              size: parseFloat(s.fontSize),
            });
          }
          return out;
        });

        expect(headings.length, `${surface.path} must render headings`).toBeGreaterThanOrEqual(1);

        // A heading left on a deleted utility keeps a valid class attribute and
        // renders at the body's 16px in the body face. That is what four
        // elements did after `display` was removed, and no assertion in the
        // repo could see it — the class name was still spelled correctly.
        const unstyled = headings.filter(
          (h) => !/Oswald|Work Sans/.test(h.family) || h.size <= 16.5,
        );
        expect(
          unstyled,
          `${surface.path}: heading(s) resolved to body text — a deleted or misspelt utility`,
        ).toEqual([]);
      });
    }
  });
}

test.describe("lines that must not wrap", () => {
  /**
   * The footer strapline sits in a band sized for a single row. It is 36
   * characters, and raising the light-caps floor by 21% wrapped it at 375px —
   * a mobile-only regression that the desktop-resolved static sweep is blind to
   * by construction, since that sweep deliberately skips `max-*` variants.
   */
  test("the footer strapline stays on one line at every viewport", async ({ page }) => {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      const strapline = page.getByText("The future belongs to the most human", { exact: false });
      await expect(strapline, `strapline missing at ${vp.width}px`).toBeVisible();

      const rows = await strapline.evaluate((el) => {
        const s = getComputedStyle(el);
        const lineHeight =
          s.lineHeight === "normal" ? parseFloat(s.fontSize) * 1.2 : parseFloat(s.lineHeight);
        const inner =
          el.getBoundingClientRect().height -
          parseFloat(s.paddingTop) -
          parseFloat(s.paddingBottom);
        return Math.round(inner / lineHeight);
      });

      expect(rows, `strapline wrapped onto ${rows} rows at ${vp.width}px`).toBeLessThanOrEqual(1);
    }
  });
});

/**
 * AC-4.3's browser proof. The specimen reads its own computed values from the
 * DOM, but until now nothing verified that those readings are real — a specimen
 * that renders "measuring…" forever would look fine to a human skimming it and
 * satisfy the gate in form.
 */
test.describe("AC-4.3 — the specimen measures what it claims", () => {
  test("every row reports five real computed values", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const res = await page.goto("/type-specimen");
    expect(res?.ok()).toBe(true);
    await page.evaluate(() => document.fonts.ready);

    // The computed columns are written by an effect after hydration, and
    // `fonts.ready` says nothing about React having run. Server-rendered, every
    // row's value is the empty string — so without this wait the assertions
    // below would race hydration and fail on a page that is perfectly correct.
    await page.waitForFunction(() => {
      const first = document.querySelector<HTMLElement>("[data-specimen-row]");
      return Boolean(first?.dataset.computedFontWeight);
    });

    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-specimen-row]")).map((el) => ({
        cls: el.dataset.specimenRow ?? "",
        family: el.dataset.computedFontFamily ?? "",
        weight: el.dataset.computedFontWeight ?? "",
        size: el.dataset.computedFontSize ?? "",
        leading: el.dataset.computedLineHeight ?? "",
        tracking: el.dataset.computedLetterSpacing ?? "",
        transform: el.dataset.computedTextTransform ?? "",
      })),
    );

    expect(rows.length, "the specimen must show at least ten steps").toBeGreaterThanOrEqual(10);

    const incomplete = rows.filter(
      (r) => !r.family || !r.weight || !r.size || !r.leading || !r.tracking,
    );
    expect(incomplete, "rows with a missing computed value").toEqual([]);

    // R19's floor: a specimen showing only the bold uppercase voice would be
    // approved and then fail to build half of Maya's mockups.
    const light = rows.filter((r) => Number(r.weight) <= 300 && r.transform === "none");
    expect(
      light.length,
      "no light, non-uppercase row — the reflective voice is missing",
    ).toBeGreaterThanOrEqual(1);

    // And the light UPPERCASE register, which is what `display`'s 24 sites were.
    const lightCaps = rows.filter((r) => Number(r.weight) <= 300 && r.transform === "uppercase");
    expect(
      lightCaps.length,
      "no light uppercase row — `display`'s own voice is missing",
    ).toBeGreaterThanOrEqual(1);
  });
});
