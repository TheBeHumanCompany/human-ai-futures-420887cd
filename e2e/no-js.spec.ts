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
 * Runs under: playwright.config.ts → project "no-js" (javaScriptEnabled: false)
 */

const BLUEPRINT = "/be-human-ai";

test.describe("AC-6.9b — progressive disclosure without JavaScript", () => {
  test("collapsed sections are native <details> and open with JS disabled", async ({ page }) => {
    const response = await page.goto(BLUEPRINT);
    expect(response?.ok(), "the Blueprint page must load").toBe(true);

    const details = page.locator("details");
    const count = await details.count();

    // Non-vacuity floor FIRST. Every assertion below is over this set, and all
    // of them are trivially true when it is empty — which is precisely the
    // state a page would be in if the sections silently stopped rendering.
    expect(count, "at least six collapsed sections must exist").toBeGreaterThanOrEqual(6);

    // AC-6.9c: count uniquely identified containers, not nested state
    // attributes. The superseded selector counted eight regions for two
    // sections; one <summary> per <details> is the identity that cannot
    // multiply that way.
    expect(await page.locator("details > summary").count()).toBe(count);

    for (let i = 0; i < count; i += 1) {
      const item = details.nth(i);
      const summary = item.locator("summary").first();
      const label = (await summary.textContent())?.trim() ?? `section ${i}`;

      // Content must be IN the DOM while closed — that is what makes it
      // findable by search and by a reader with assistive technology.
      const body = item.locator(":scope > *:not(summary)");
      const bodyText = ((await body.allTextContents()) ?? []).join(" ").trim();
      expect(bodyText.length, `"${label}" must carry real content while closed`).toBeGreaterThan(
        40,
      );

      // And it must be openable with no JavaScript at all. `click()` on a
      // <summary> is handled by the browser itself; if this section were a
      // scripted accordion, `open` would never flip here.
      await expect(item, `"${label}" starts closed`).not.toHaveAttribute("open", "");
      await summary.click();
      await expect(item, `"${label}" opens with JavaScript disabled`).toHaveAttribute("open", "");
    }
  });

  test("no scripted accordion survives on the Blueprint page", async ({ page }) => {
    await page.goto(BLUEPRINT);
    // The mechanism AC-6.9b supersedes. Its state attribute is the tell, and
    // it is the attribute the old gate miscounted.
    expect(await page.locator("[data-state='closed'], [data-state='open']").count()).toBe(0);
  });
});
