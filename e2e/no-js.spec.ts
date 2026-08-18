import { expect, test } from "@playwright/test";

/**
 * AC-6.9b — collapsed Blueprint sections work with JavaScript disabled.
 *
 * ── Why this test exists in this exact form ────────────────────────────────
 *
 * Amendment 3 decision 2 replaced the vendored Radix accordion with native
 * `<details>/<summary>`, and the reason was demonstrated rather than argued.
 * Codex server-rendered the accordion and measured it:
 *
 *   · two closed items produced EIGHT `[data-state="closed"]` matches and ZERO
 *     bodies — so the planned "at least six closed sections" gate passed with
 *     two empty items and no content anywhere on the page, and
 *   · with JavaScript disabled the server-rendered regions could not be opened
 *     at all. `forceMount` fixes DOM presence and does nothing for the toggle.
 *
 * Both halves matter, and they fail in opposite directions: the first is a
 * count that overstates, the second is content the reader cannot reach. A
 * `<details>` element fixes both — but only if something checks it with
 * JavaScript actually off, which is what the `no-js` Playwright project is
 * for. Without this file AC-6.9b is a comment in a plan.
 *
 * ── The counting trap, which bites twice ───────────────────────────────────
 *
 * The page renders 24 `<details>` elements and only SEVEN of them are
 * sections. The rest are nested disclosures: nine FAQ entries, and the
 * "read the detail" runs that hold expository depth inside otherwise-visible
 * sections. Counting bare `details` and asserting "at least six" is therefore
 * the SAME defect as the old `[data-state="closed"]` selector wearing
 * different clothes — it would pass on a single section with a rich FAQ, and
 * keep passing while six sections quietly disappeared.
 *
 * So the section count comes from `details[data-section-id]`, deduplicated by
 * that id, and the nested disclosures are checked separately as what they are.
 *
 * Runs under: playwright.config.ts → project "no-js" (javaScriptEnabled: false)
 */

const BLUEPRINT = "/be-human-ai";

/** Body text of a `<details>`, excluding its own `<summary>` label. */
async function bodyTextOf(item: import("@playwright/test").Locator) {
  const body = item.locator(":scope > *:not(summary)");
  return ((await body.allTextContents()) ?? []).join(" ").trim();
}

test.describe("AC-6.9b — progressive disclosure without JavaScript", () => {
  test("the seven collapsed SECTIONS are native <details>, populated, and openable", async ({
    page,
  }) => {
    const response = await page.goto(BLUEPRINT);
    expect(response?.ok(), "the Blueprint page must load").toBe(true);

    const sections = page.locator("details[data-section-id]");
    const count = await sections.count();

    // Non-vacuity floor FIRST. Every assertion below is over this set, and all
    // of them are trivially true when it is empty — which is precisely the
    // state a page would be in if the sections silently stopped rendering.
    expect(count, "at least six collapsed sections must exist").toBeGreaterThanOrEqual(6);

    // AC-6.9c: count uniquely identified containers. Deduplicating by
    // `data-section-id` is what stops one section with several nested
    // disclosures from reading as several sections.
    const ids = await sections.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-section-id") ?? ""),
    );
    expect(new Set(ids).size, "section ids must be unique").toBe(count);
    expect(ids.every((id) => id.length > 0)).toBe(true);

    // One <summary> per <details>, as a direct child. A <details> whose
    // summary is nested deeper is not keyboard-operable the same way.
    expect(await page.locator("details[data-section-id] > summary").count()).toBe(count);

    for (let i = 0; i < count; i += 1) {
      const item = sections.nth(i);
      const label = ids[i];

      // Content must be IN the DOM while closed — that is what makes it
      // findable by search and by a reader with assistive technology. This is
      // the assertion the Radix accordion could not have passed.
      const bodyText = await bodyTextOf(item);
      expect(bodyText.length, `"${label}" must carry real content while closed`).toBeGreaterThan(
        40,
      );

      // And it must be openable with no JavaScript at all. `click()` on a
      // <summary> is handled by the browser itself; if this section were a
      // scripted accordion, `open` would never flip here.
      await expect(item, `"${label}" starts closed`).not.toHaveAttribute("open", "");
      await item.locator("summary").first().click();
      await expect(item, `"${label}" opens with JavaScript disabled`).toHaveAttribute("open", "");
    }
  });

  test("the nested disclosures inside them behave the same way", async ({ page }) => {
    await page.goto(BLUEPRINT);

    // Open every section first. A nested <details> inside a closed parent is
    // not rendered, so it cannot be clicked — and a test that tried would fail
    // on actionability rather than on the property it meant to check.
    const sections = page.locator("details[data-section-id]");
    for (let i = 0; i < (await sections.count()); i += 1) {
      await sections.nth(i).locator("summary").first().click();
    }

    const nested = page.locator("details:not([data-section-id])");
    const count = await nested.count();

    // Floor: the FAQ alone contributes nine, and the expository runs more.
    // Zero here would mean the page had quietly flattened.
    expect(count, "nested disclosures must exist").toBeGreaterThanOrEqual(9);

    for (let i = 0; i < count; i += 1) {
      const item = nested.nth(i);
      expect(
        (await bodyTextOf(item)).length,
        `nested disclosure ${i} must carry content while closed`,
      ).toBeGreaterThan(20);

      await item.locator("summary").first().click();
      await expect(item, `nested disclosure ${i} opens without JavaScript`).toHaveAttribute(
        "open",
        "",
      );
    }
  });

  test("every section is in the DOM and in source order while still collapsed", async ({
    page,
  }) => {
    await page.goto(BLUEPRINT);

    // AC-6.2 has to hold in the DEFAULT state, not after a reader expands
    // things. Asserted here rather than only in the unit suite because this is
    // the one context that proves it for a crawler: real HTML, no JS.
    const ids = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[id][data-tier], details[data-section-id]")).map(
        (n) => n.id,
      ),
    );

    expect(ids.length, "all sixteen sections must be present").toBe(16);
    expect(ids[0]).toBe("hero");
    expect(ids[ids.length - 1]).toBe("closing-cta");
  });

  test("no scripted accordion survives in the Blueprint CONTENT", async ({ page }) => {
    await page.goto(BLUEPRINT);

    /**
     * Scoped past the header, deliberately.
     *
     * The site nav uses Radix dropdowns for its two parent items, so `About`
     * and `Blueprint` legitimately render `data-state="closed"` on every page.
     * A page-wide `toBe(0)` here would fail against correct markup — and the
     * obvious "fix" of deleting the assertion would remove the only check that
     * the superseded accordion has not come back.
     *
     * The arithmetic states the real rule: a `data-state` node anywhere OTHER
     * than the header is a scripted disclosure in the content.
     */
    const total = await page.locator("[data-state]").count();
    const inHeader = await page.locator("header [data-state]").count();

    // Floor: if the header stopped rendering its dropdowns entirely, the
    // subtraction below would still be 0 and this test would pass while
    // asserting nothing about a real page.
    expect(inHeader, "the header's dropdown triggers must be present").toBeGreaterThanOrEqual(1);
    expect(total - inHeader, "no data-state node may appear in the page content").toBe(0);
  });
});
