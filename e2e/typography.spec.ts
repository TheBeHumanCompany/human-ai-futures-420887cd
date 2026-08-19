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

/**
 * Heading-outline debt that predates the check below, pinned exactly.
 *
 * Recorded rather than fixed because the cause is unrelated to the content pass
 * that added the check, and restyling pages to make a new assertion green is how
 * a proof stops meaning anything.
 *
 * The cause is one shared component, not five page bugs: `site-footer.tsx` sets
 * its column headings ("NAVIGATE", "FOLLOW", "CONTACT") as `h3`, so any page
 * whose content outline stops at `h1` jumps straight to them. Four of these five
 * are literally the same `h1 -> h3` into the footer. Fix the footer and four of
 * these entries go at once — which is why they are worth pinning rather than
 * chasing individually.
 *
 * Pinned as exact rank pairs and compared with `toEqual`, so this fails in BOTH
 * directions: a route that gets cleaned up no longer matches, and so does one
 * that grows a new or deeper skip. An earlier draft asserted only "at least one
 * skip", which a fault-injected `h1 -> h4` on /contact walked straight through.
 *
 * Heading TEXT is deliberately not pinned. The /podcast skip lands on an episode
 * card title that comes from the live Podbean feed, so pinning it would fail the
 * day the newest episode changes — a flake dressed up as a regression.
 */
const HEADING_SKIP_DEBT = new Map<string, string[]>([
  ["/the-human-archive", ["h1 -> h3"]],
  ["/podcast", ["h1 -> h3"]],
  ["/contact", ["h1 -> h3"]],
  ["/type-specimen", ["h1 -> h3"]],
  ["/human-archive/adewolf", ["h1 -> h3"]],
]);

/**
 * Viewports come from the Playwright PROJECTS, not from a loop in here.
 * `playwright.config.ts` runs one project per entry in
 * `scripts/verify/viewports.ts`, so looping again would run 3x3 combinations
 * and — worse — report a width the page was never actually rendered at.
 */

test.describe("fixture floors", () => {
  test("the surface list is populated", () => {
    // `for (const s of [])` is a green suite that ran nothing and looks
    // identical to one that ran everything.
    expect(surfaces.length).toBeGreaterThanOrEqual(8);
  });
});

for (const surface of surfaces) {
  test(`${surface.path} does not overflow horizontally`, async ({ page }, testInfo) => {
    const vp = { name: testInfo.project.name, width: page.viewportSize()?.width ?? 0 };
    await page.goto(surface.path);
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      // 1px of slack: sub-pixel layout rounding is not a regression.
      const offenders: { why: string; tag: string; cls: string; detail: string }[] = [];
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
        const style = getComputedStyle(el);
        if (style.position === "fixed" || style.overflowX === "auto") continue;
        if (style.overflowX === "scroll" || style.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        // Two different overflows, and only reporting the first leaves the
        // failure message empty in exactly the case that matters. A box can
        // sit inside the viewport while its CONTENT does not: an oversized
        // heading in a narrow grid column has a 260px box and 542px of
        // text, so its `right` is fine and the page still scrolls.
        if (r.right > docWidth + 1) {
          offenders.push({
            why: "box extends past the viewport",
            tag: el.tagName.toLowerCase(),
            cls: el.className?.toString().slice(0, 70) ?? "",
            detail: `right ${Math.round(r.right)} > ${docWidth}`,
          });
        } else if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          offenders.push({
            why: "content wider than its box",
            tag: el.tagName.toLowerCase(),
            cls: el.className?.toString().slice(0, 70) ?? "",
            detail: `content ${el.scrollWidth} > box ${el.clientWidth}`,
          });
        }
      }
      return { docWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
    });

    expect(
      overflow.scrollWidth,
      `${surface.path} scrolls horizontally at ${vp.width}px. Offenders are collected in ` +
        `document order, so the LAST are the innermost and the most likely cause: ` +
        JSON.stringify(overflow.offenders.slice(-3)),
    ).toBeLessThanOrEqual(overflow.docWidth + 1);
  });

  test(`${surface.path} names no utility that does not exist`, async ({ page }) => {
    await page.goto(surface.path);
    await page.evaluate(() => document.fonts.ready);

    /**
     * The failure this catches: an element keeps a perfectly well-formed class
     * attribute naming a utility that has since been deleted, and silently
     * renders as body text. Four elements did exactly that when `display` was
     * removed while they still referenced it — on 13 surfaces — and nothing in
     * the repo could see it, because the class name was spelled correctly.
     *
     * Detecting it by *appearance* does not work. A heading legitimately set in
     * `eyebrow` is Work Sans at 11px, and one set in `type-label-caps` is 16px;
     * both look exactly like "fell back to the body font at the body size".
     * An earlier draft of this test used a size threshold and failed on 45
     * correctly-styled headings — the fourth assertion in this build that would
     * have gone red on correct work.
     *
     * So it asks the stylesheet instead: every typography utility named in the
     * DOM must actually resolve to a rule. That has no false positives and
     * catches deletions and typos alike.
     */
    const orphans = await page.evaluate(() => {
      const defined = new Set<string>();
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // cross-origin (the webfont sheet) — not ours to inspect
        }
        const collect = (list: CSSRuleList) => {
          for (const rule of Array.from(list)) {
            if (rule instanceof CSSStyleRule) {
              for (const m of rule.selectorText.matchAll(/\.((?:[\w-]|\\.)+)/g)) {
                defined.add(m[1].replace(/\\/g, ""));
              }
            } else if ("cssRules" in rule) {
              collect((rule as CSSGroupingRule).cssRules);
            }
          }
        };
        collect(rules);
      }

      // Only the names this consolidation governs. A bare Tailwind class that
      // happens to be unused is not this test's business.
      const governed = /^(type-|eyebrow$|display$|display-strong$|archive-question$|section-label)/;
      const found: { cls: string; tag: string; text: string }[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
        for (const cls of Array.from(el.classList)) {
          if (!governed.test(cls) || defined.has(cls)) continue;
          found.push({
            cls,
            tag: el.tagName.toLowerCase(),
            text: (el.innerText ?? "").trim().slice(0, 40),
          });
        }
      }
      return { definedCount: defined.size, found };
    });

    // Floor: if the stylesheet could not be read at all, `defined` is empty and
    // every class would look orphaned — or, with the check inverted, nothing
    // ever would. Assert we actually parsed a stylesheet before trusting it.
    expect(
      orphans.definedCount,
      `${surface.path}: no CSS rules were readable, so this check proves nothing`,
    ).toBeGreaterThan(100);

    expect(
      orphans.found,
      `${surface.path}: class(es) name a utility with no CSS rule — deleted or misspelt`,
    ).toEqual([]);
  });

  test(`${surface.path} renders headings in a brand face`, async ({ page }) => {
    await page.goto(surface.path);
    await page.evaluate(() => document.fonts.ready);

    const headings = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"))
        .filter((h) => h.innerText.trim())
        .map((h) => ({
          text: h.innerText.trim().slice(0, 40),
          family: getComputedStyle(h).fontFamily,
        })),
    );

    expect(headings.length, `${surface.path} must render headings`).toBeGreaterThanOrEqual(1);

    // Size is deliberately not asserted here — see above. Family is safe:
    // every heading on this site is Oswald or Work Sans by design.
    const offFace = headings.filter((h) => !/Oswald|Work Sans/.test(h.family));
    expect(offFace, `${surface.path}: heading(s) not in a brand face`).toEqual([]);
  });

  test(`${surface.path} has a heading outline with no skipped level`, async ({ page }) => {
    // The face check above passes on any tag, so it cannot see rank. That blind
    // spot is not theoretical: deleting the Who We Are hero took the page's only
    // H1 and left H1 -> H3, and every committed proof stayed green. Rank is a
    // separate axis from appearance — `type-h3-caps` on an h2 is correct and
    // common here, which is exactly why the tag needs its own assertion.
    await page.goto(surface.path);
    // Same settle as its siblings. This is a client-rendered app, so reading the
    // DOM straight after `goto` can sample it before React has put the headings
    // in — which would fail on the h1 count for a reason that is not the bug.
    await page.evaluate(() => document.fonts.ready);

    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"))
        .filter((h) => h.innerText.trim())
        .map((h) => Number(h.tagName[1])),
    );

    expect(levels.filter((l) => l === 1).length, `${surface.path} must have exactly one h1`).toBe(
      1,
    );

    const skips = levels
      .map((level, i) => ({ level, prev: levels[i - 1] }))
      .filter(({ level, prev }) => prev !== undefined && level > prev + 1)
      .map(({ level, prev }) => `h${prev} -> h${level}`);

    const debt = HEADING_SKIP_DEBT.get(surface.path);
    if (debt) {
      // Exact match, so the exemption cannot widen. Cleaning the route up fails
      // here too — that is deliberate: it tells you to delete the entry instead
      // of leaving a stale one that would later swallow a real regression.
      expect(
        skips,
        `${surface.path}: heading outline changed. If you fixed it, remove the ` +
          `entry from HEADING_SKIP_DEBT. If this is new, it is a regression.`,
      ).toEqual(debt);
    } else {
      expect(skips, `${surface.path}: heading level skipped`).toEqual([]);
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
  test("the footer strapline stays on one line", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 0;
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const strapline = page.getByText("The future belongs to the most human", { exact: false });
    await expect(strapline, `strapline missing at ${width}px`).toBeVisible();

    const rows = await strapline.evaluate((el) => {
      const s = getComputedStyle(el);
      const lineHeight =
        s.lineHeight === "normal" ? parseFloat(s.fontSize) * 1.2 : parseFloat(s.lineHeight);
      const inner =
        el.getBoundingClientRect().height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
      return Math.round(inner / lineHeight);
    });

    expect(rows, `strapline wrapped onto ${rows} rows at ${width}px`).toBeLessThanOrEqual(1);
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
