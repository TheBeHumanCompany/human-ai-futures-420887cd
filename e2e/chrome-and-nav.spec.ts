import { expect, test, type Page } from "@playwright/test";

import { BOOKING_URL_30MIN } from "../src/lib/booking.ts";
import { INDIGENOUS_LINE } from "../src/lib/brand.ts";
import { NAV } from "../src/lib/nav.ts";

/**
 * Site chrome and navigation, asserted in a real browser (AC-2.x, AC-3.x).
 *
 * Everything here needs a browser for a reason. Computed `font-family` and
 * `background-color` cannot be read off source text — a class name is not
 * evidence that a rule applied, and "the Caveat class is present" stays true
 * after the font fails to load or the utility is deleted. DOM distance between
 * two nodes needs a real tree. And a dropdown's contents only exist once it is
 * opened.
 *
 * ── Constants are imported, never retyped ──────────────────────────────────
 *
 * `INDIGENOUS_LINE` and the booking URLs come from the modules the site
 * renders from. That is not convenience: AC-2.8b and AC-2.4 require
 * implementation and proof to consume ONE constant, so a spec holding its own
 * copy of the copy would be a third hardcoding and would defeat the criterion
 * it claims to prove. It would also keep passing while the site rendered
 * something else.
 *
 * ── Viewport is forced, not inherited ──────────────────────────────────────
 *
 * The desktop nav bar is `hidden lg:flex`, so it does not exist below 1024px.
 * This spec runs under all three viewport projects, so any test that touches
 * the desktop bar sets 1440×900 itself rather than depending on which project
 * happens to be running it.
 */

const DESKTOP = { width: 1440, height: 900 };

/** The computed value of a CSS custom property, resolved by the browser. */
async function resolvedVar(page: Page, prop: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, prop);
}

test.describe("AC-2.1 / AC-2.1b / AC-2.8b — the footer", () => {
  test("renders all four required elements as distinct nodes", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer, "the footer must render").toBeVisible();

    // Four discrete assertions, not one "the footer contains some text".
    await expect(
      footer.getByText("The future belongs to the most human"),
      "strapline bar",
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: /THE BE HUMAN COMPANY/i }),
      "wordmark",
    ).toBeVisible();
    await expect(
      footer.getByText(/An AI strategy and transformation company/),
      "positioning paragraph",
    ).toBeVisible();
    await expect(
      footer.getByText(INDIGENOUS_LINE, { exact: true }),
      "Indigenous line",
    ).toBeVisible();
    await expect(footer.getByText("Stay Human.", { exact: true }), "sign-off").toBeVisible();
  });

  test('"Stay Human." is actually in Caveat, actually in lime', async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const signoff = page.locator("footer").getByText("Stay Human.", { exact: true });
    const styles = await signoff.evaluate((el) => {
      const s = getComputedStyle(el);
      return { family: s.fontFamily, color: s.color };
    });

    // Computed style, not a class name. `font-hand` in the class list is not
    // evidence the font applied.
    expect(styles.family, "the hand font must resolve").toContain("Caveat");
    expect(styles.color, "and it must be lime").toBe(await resolvedVar(page, "--lime"));
  });

  test("AC-2.1b — the Indigenous line is exactly the canonical string", async ({ page }) => {
    await page.goto("/");

    // Imported, so this cannot pass against copy the site does not render.
    expect(INDIGENOUS_LINE.length, "the constant must be non-empty").toBeGreaterThan(10);
    await expect(page.locator("footer").getByText(INDIGENOUS_LINE, { exact: true })).toBeVisible();

    // The superseded wordings must appear nowhere on the rendered page.
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Indigenous-founded");
    expect(body).not.toContain("Indigenous and Canadian-owned");
  });

  test("AC-2.8b — the maple leaf sits within two DOM levels of that line", async ({ page }) => {
    await page.goto("/");

    const distance = await page.evaluate((line) => {
      const leaf = document.querySelector('[data-glyph="maple-leaf"]');
      if (!leaf) return { error: "no maple leaf node" };

      // The text node carrying the line, found by content rather than by a
      // class — a class hook would let the two drift apart while the selector
      // kept matching.
      const holder = Array.from(document.querySelectorAll("span, p")).find(
        (el) => el.textContent?.trim() === line,
      );
      if (!holder) return { error: "no node carries the Indigenous line" };

      const ancestry = (el: Element) => {
        const chain: Element[] = [];
        for (let n: Element | null = el; n; n = n.parentElement) chain.push(n);
        return chain;
      };
      const a = ancestry(leaf);
      const b = ancestry(holder);
      const common = a.find((n) => b.includes(n));
      if (!common) return { error: "no common ancestor" };

      return { leafDepth: a.indexOf(common), lineDepth: b.indexOf(common) };
    }, INDIGENOUS_LINE);

    expect(distance.error, `AC-2.8b: ${distance.error ?? ""}`).toBeUndefined();
    expect(
      Math.max(distance.leafDepth ?? 99, distance.lineDepth ?? 99),
      "the leaf must be adjacent to the line, not loose on the page",
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("AC-2.6 / AC-2.7a — calls to action", () => {
  test("the header ends on the Blueprint CTA", async ({ page }) => {
    // 2026-08-26: the header booking CTA was removed; Blueprint is the only
    // conversion control in the bar, and it is an outlined lime pill.
    await page.setViewportSize(DESKTOP);
    await page.goto("/");

    const cta = page.locator("header").locator('[data-nav-cta="true"]');
    await expect(cta, "the header CTA must be the Blueprint pill").toHaveCount(1);
    await expect(cta).toHaveAttribute("href", "/be-human-ai");
  });

  test("the Blueprint books the 30-minute call exactly three times, in three sections", async ({
    page,
  }) => {
    await page.goto("/be-human-ai");

    const ctas = page.locator(`a[href="${BOOKING_URL_30MIN}"]`);
    await expect(ctas, "PDF v4 specifies three booking points").toHaveCount(3);

    // Three CTAs stacked in one section is not three booking points. The
    // nearest section ancestor of each must be distinct.
    const sections = await ctas.evaluateAll((nodes) =>
      nodes.map((n) => n.closest("[id][data-tier]")?.id ?? "none"),
    );
    expect(new Set(sections).size, `CTAs must sit in distinct sections, got ${sections}`).toBe(3);
    expect(sections).not.toContain("none");
  });

  test("AC-2.7a — the two CTA labels read as Maya specified", async ({ page }) => {
    await page.goto("/the-new-human-era");
    await expect(
      page.getByRole("link", { name: /^Explore the archive/i }),
      "archive CTA",
    ).toHaveCount(1);

    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /^Read the New Human Era/i }),
      "New Human Era CTA",
    ).toHaveCount(1);

    // Both superseded labels, asserted absent. Without this the positive
    // assertions pass while the old wording survives elsewhere.
    for (const path of ["/", "/the-new-human-era", "/the-human-archive"]) {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      expect(text, `${path} must not carry the superseded archive label`).not.toMatch(
        /Explore the human archive/i,
      );
      expect(text, `${path} must not carry a bare "Learn more"`).not.toMatch(/\bLearn more\b/);
    }
  });
});

test.describe("AC-3.x — the navigation tree", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  test("AC-3.1a — seven top-level items and no dropdown parents", async ({ page }) => {
    // Amendment 8, 2026-08-26: the About dropdown was split into two flat
    // items and Blueprint lost its panel, so the bar is seven leaves.
    await page.goto("/");

    const items = page.locator("header [data-nav-item]");
    await expect(items, "the binding tree has seven top-level items").toHaveCount(NAV.length);
    expect(NAV.length, "floor: the nav model is populated").toBe(7);

    const labels = await items.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-nav-item")),
    );
    expect(labels).toEqual(NAV.map((i) => i.label));

    // A dropdown parent is the one that owns a panel trigger. The flat bar
    // has none: the two former parents are now ordinary links.
    const triggers = page.locator(
      "header [aria-label^='Open '][aria-haspopup], header [aria-haspopup='menu']",
    );
    await expect(triggers, "no dropdown parent may remain").toHaveCount(0);
  });

  test("AC-3.2a — Why We Exist and Who We Are are direct links and live", async ({ page }) => {
    // Amendment 8, 2026-08-26: the About dropdown is gone, so its two
    // children prove themselves as top-level links in the bar — not as items
    // inside any menu panel.
    await page.goto("/");

    for (const href of ["/why-we-exist", "/who-we-are"]) {
      // Scoped to the header, because a dropdown panel portals to <body>;
      // a link that only exists inside a panel would not match here.
      const link = page.locator("header").locator(`a[href='${href}']`);
      await expect(link, `${href} must be a direct header link`).toHaveCount(1);

      const res = await page.request.get(href);
      expect(res.status(), `${href} must be live`).toBe(200);
    }
  });

  test("AC-3.2b — about permanently redirects to who-we-are", async ({ page }) => {
    // Amendment 8, 2026-08-26: the earlier decision to keep /about live was
    // reversed — it is now a permanent 301 to /who-we-are.
    const why = await page.request.get("/why-we-exist");
    expect(why.status()).toBe(200);
    const who = await page.request.get("/who-we-are");
    expect(who.status()).toBe(200);

    const about = await page.request.get("/about", { maxRedirects: 0 });
    expect(about.status(), "/about must answer with the permanent redirect").toBe(301);
    const location = about.headers()["location"] ?? "";
    expect(location, "and it must land on /who-we-are").toMatch(/\/who-we-are$/);
  });

  test("AC-3.7a — Blueprint is the one outline lime pill", async ({ page }) => {
    // Amendment 8, 2026-08-26: the pill is an outline at rest — transparent
    // ground, lime border — that fills lime on hover, per the meeting's
    // "green outline once we hover".
    await page.goto("/");

    const lime = await resolvedVar(page, "--lime");
    const pill = page.locator("header [data-nav-cta='true']");
    await expect(pill, "the bar carries exactly one CTA control").toHaveCount(1);
    await expect(pill).toHaveAttribute("data-nav-item", "Blueprint");

    const rest = await pill.evaluate((n) => {
      const s = getComputedStyle(n);
      return {
        bg: s.backgroundColor,
        border: s.borderTopColor,
        radius: parseFloat(s.borderTopLeftRadius),
      };
    });
    expect(rest.bg, "transparent ground at rest, not lime").toBe("rgba(0, 0, 0, 0)");
    expect(rest.border, "the outline is the lime border").toBe(lime);
    expect(rest.radius, "and it is actually pill-shaped").toBeGreaterThanOrEqual(9999);

    // The hover fill is a 200ms CSS transition, so the computed ground must
    // be polled until the fade settles — a one-shot read catches it mid-way
    // and reads as a broken pill. Same retry-not-sleep discipline as the
    // hydration note that used to live on the About dropdown test.
    await pill.hover();
    await expect
      .poll(async () => pill.evaluate((n) => getComputedStyle(n).backgroundColor), {
        timeout: 5_000,
      })
      .toBe(lime);
  });

  test("AC-3.6a — the three pillar destinations exist with distinct headings", async ({ page }) => {
    const pillars = [
      { path: "/be-human-ai/human-readiness", h1: "Human Readiness" },
      { path: "/be-human-ai/governance", h1: "Governance & Sovereignty" },
      { path: "/be-human-ai/ai-strategy", h1: "AI Strategy" },
    ];

    const seen: string[] = [];
    for (const pillar of pillars) {
      const res = await page.goto(pillar.path);
      expect(res?.status(), `${pillar.path} must be live`).toBe(200);

      // `textContent`, not `innerText`. These headings carry
      // `text-transform: uppercase`, and `innerText` returns the CSS-rendered
      // form — so an assertion written against the source string fails while
      // the page is correct. The criterion is about the heading being there,
      // not about its casing.
      const h1 = (await page.locator("h1").first().textContent())?.trim() ?? "";
      expect(h1).toBe(pillar.h1);
      seen.push(h1);
    }
    // Three routes sharing one heading would satisfy every check above.
    expect(new Set(seen).size, "each pillar has its own heading").toBe(3);
  });

  test("AC-3.5a / AC-3.5b — /who-we-are renders three team cards and only three", async ({
    page,
  }) => {
    const res = await page.goto("/who-we-are");
    expect(res?.status()).toBe(200);

    const cards = page.locator("[data-team-member]");
    await expect(cards, "three cards, per the scope decision").toHaveCount(3);

    // Read from the cards themselves via `textContent`. Two reasons: the names
    // and roles render uppercase, so `innerText` returns a form no source
    // string matches; and scoping to the rendered cards stops the router's
    // serialized data payload — which also contains these names — from
    // satisfying the assertion when nothing rendered.
    const cardText = (
      await cards.evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ""))
    ).join(" ");
    for (const [name, role] of [
      ["Shane James", "Founder & CEO"],
      ["Sid", "AI, Cybersecurity & Governance"],
      ["Maya", "Human Readiness & Organizational Change"],
    ]) {
      expect(cardText, `${name} must appear`).toContain(name);
      expect(cardText, `${name}'s role must appear`).toContain(role);
    }

    // The source PDF's placeholders must never ship — a plausible surname is a
    // fabricated fact about a real person. Checked against visible text too,
    // so a placeholder rendered anywhere on the page is caught.
    expect(cardText).not.toMatch(/\[Last Name\]/);
    expect(await page.locator("body").innerText()).not.toMatch(/\[Last Name\]/);

    // Maya's 2026-08-18 review deleted the hero band that carried the old H1
    // ("Built for human-first AI transformation"). The team label is the page's
    // top-level heading now.
    const heading = (await page.locator("h1").first().textContent())?.trim() ?? "";
    expect(heading).toBe("The team behind your transformation");
  });
});
