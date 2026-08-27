import { devices, expect, test, type Locator, type Page } from "@playwright/test";

import { ARCHIVE_PLAYLIST_URL } from "../src/lib/brand.ts";

/**
 * Video facades — the archive grid's hover/tap players and the homepage's
 * click-to-load Why We Exist embed (Amendment 8, 2026-08-26).
 *
 * Every count below counts ALL iframes on the page, not just
 * youtube-nocookie ones. The criteria are written as "zero at load" and
 * "never more than one player" — a count that tolerated a second,
 * differently-branded embed would prove neither.
 *
 * ── Why the video ids are literals, not imports ────────────────────────────
 *
 * `src/lib/content.ts` cannot be imported into a spec: it re-exports bundled
 * image imports (`@/assets/…jpg`) the browser-runner has no loader rule for.
 * More to the point, these literals ARE the 2026-08-26 title-verified table —
 * a second, independent pin of what the page renders. The unit suite pins
 * `HUMAN_ARCHIVE_VIDEOS`; this file pins the DOM.
 *
 * ── Hydration and timing ───────────────────────────────────────────────────
 *
 * The app is client-rendered: the cards exist in server markup before React
 * has attached anything, so a hover landing in that window silently does
 * nothing (the failure diagnosed at length in chrome-and-nav's AC-3.2a).
 * `settle()` waits out network idle and fonts first, and every activating
 * interaction is retried inside `toPass` until the iframe it owes actually
 * mounts — making no claim about WHEN React attaches, only that a hover
 * eventually behaves like one. Mount/unmount take ~100-300ms in dev, so
 * counts are polled, never sampled.
 *
 * ── Real input, always ─────────────────────────────────────────────────────
 *
 * Hovers are `locator.hover()` / `page.mouse.move` and taps are `tap()`:
 * React synthesizes enter/leave from delegated mouseover/out, so a dispatched
 * raw `mouseenter` does not trip the card at all.
 */

const CARDS = "figure[role='button']";

/** The 2026-08-26 verified table, in the user-given grid order. */
const PEOPLE = [
  { name: "LUCY", no: "056", id: "lDGsG0nu1Ck" },
  { name: "FARID", no: "038", id: "ESAw6gJRGhQ" },
  { name: "ABDI", no: "041", id: "xtbZARUHt7s" },
  { name: "MARISSA", no: "060", id: "2sAGALC7Pig" },
] as const;

const HOME_VIDEO = {
  id: "-r011ECKr7M",
  title: "Welcome To My Channel — Building The Be Human Company",
};

/** Navigate and let a client-rendered page finish loading its fonts. */
async function settle(page: Page, path: string) {
  const res = await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  return res;
}

/** Hover a card until its player ACTUALLY mounts — retries through hydration. */
async function hoverIntoPlayer(page: Page, card: Locator) {
  await expect(async () => {
    await card.hover();
    await expect(page.locator("iframe")).toHaveCount(1, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/** The document-level overflow invariant, with typography.spec's 1px slack. */
async function expectNoHorizontalOverflow(page: Page, where: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `${where} scrolls horizontally at ${page.viewportSize()?.width ?? 0}px`,
  ).toBeLessThanOrEqual(clientWidth + 1);
}

test.describe("the archive grid", () => {
  test("renders four stills and zero players at load", async ({ page }) => {
    const res = await settle(page, "/the-human-archive");
    expect(res?.status(), "/the-human-archive must be live").toBe(200);

    const cards = page.locator(CARDS);
    await expect(cards, "four video people").toHaveCount(4);
    await expect(page.locator("iframe"), "nothing may preload").toHaveCount(0);

    // The labels pin the grid order, so "card 0 is LUCY" below is anchored,
    // not assumed.
    const labels = await cards.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("aria-label")),
    );
    expect(labels, "grid order is the user-given one").toEqual(
      PEOPLE.map((p) => `Play ${p.name}'s Human Archive video`),
    );

    for (const card of await cards.all()) {
      await expect(card.locator("img"), "each card shows its still").toBeVisible();
    }
  });

  test("hover mounts exactly one muted player and leaving unmounts it", async ({ page }) => {
    await settle(page, "/the-human-archive");

    const lucy = page.locator(CARDS).first();
    await hoverIntoPlayer(page, lucy);

    const player = page.locator("iframe");
    await expect(player).toHaveCount(1);
    expect(await player.getAttribute("src")).toContain(
      `youtube-nocookie.com/embed/${PEOPLE[0].id}`,
    );
    expect(await player.getAttribute("allow"), "autoplay must be permitted").toContain("autoplay");
    expect(await player.getAttribute("title"), "a screen-reader-worthy title").toBe(
      `${PEOPLE[0].name} — Human Archive ${PEOPLE[0].no}`,
    );

    // Leave-to-neutral is a real mouse move off the card — see the header.
    await page.mouse.move(5, 5);
    await expect.poll(() => page.locator("iframe").count(), { timeout: 5_000 }).toBe(0);
    await expect(lucy.locator("img"), "the still returns").toBeVisible();
  });

  test("activating a second card swaps the one player, never two", async ({ page }) => {
    await settle(page, "/the-human-archive");
    const cards = page.locator(CARDS);

    await hoverIntoPlayer(page, cards.nth(0));
    await expect(page.locator("iframe"), "after card A: exactly one").toHaveCount(1);

    await hoverIntoPlayer(page, cards.nth(1));
    await expect(page.locator("iframe"), "after card B: still exactly one").toHaveCount(1);
    expect(await page.locator("iframe").getAttribute("src"), "and it is card B's").toContain(
      `embed/${PEOPLE[1].id}`,
    );
  });

  test("keyboard: focus and Enter operate the cards", async ({ page }) => {
    await settle(page, "/the-human-archive");
    const abdi = page.locator(CARDS).nth(2);

    // Focus is the keyboard user's activation path; `.focus()` is Tab's
    // destination, deterministically.
    await expect(async () => {
      await abdi.focus();
      await expect(page.locator("iframe")).toHaveCount(1, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    expect(await page.locator("iframe").getAttribute("src")).toContain(`embed/${PEOPLE[2].id}`);

    // Enter on the playing card is handled, not ignored — idempotently: the
    // same id re-activates into the same player, not a restart or a second
    // iframe.
    await page.keyboard.press("Enter");
    await expect(page.locator("iframe")).toHaveCount(1);
  });

  test("unmute flips the data-muted seam and the control's own label", async ({ page }) => {
    await settle(page, "/the-human-archive");
    const lucy = page.locator(CARDS).first();
    await hoverIntoPlayer(page, lucy);
    await expect(lucy, "muted autoplay is the resting state").toHaveAttribute("data-muted", "true");

    await lucy.locator("button[aria-label='Unmute video']").click();

    // The seam, not the audio hardware: the card reports unmuted as data.
    // The 2s ceiling is the plan's — the postMessage is synchronous with the
    // click, so a slow poll result means the wiring is wrong, not busy.
    await expect.poll(() => lucy.getAttribute("data-muted"), { timeout: 2_000 }).toBe("false");
    await expect(
      lucy.locator("button[aria-label='Mute']"),
      "the control now offers Mute",
    ).toHaveCount(1);
    await expect(page.locator("iframe"), "unmuting must not unmount").toHaveCount(1);
  });

  test("touch: a tap mounts the player and a second tap swaps it", async ({
    browser,
  }, testInfo) => {
    // A genuine touch context, not a narrow mouse: `devices['iPhone 13']`
    // brings hasTouch, isMobile and the Safari UA, so the card's click path
    // runs as it does on a phone. Manual contexts do not inherit the config,
    // so the project's baseURL travels explicitly.
    const baseURL = testInfo.project.use.baseURL;
    expect(baseURL, "the project must define a baseURL").toBeTruthy();
    const context = await browser.newContext({ ...devices["iPhone 13"], baseURL });
    const phone = await context.newPage();
    try {
      await settle(phone, "/the-human-archive");
      const cards = phone.locator(CARDS);
      await expect(cards).toHaveCount(4);

      await cards.nth(0).tap();
      await expect.poll(() => phone.locator("iframe").count(), { timeout: 5_000 }).toBe(1);
      expect(await phone.locator("iframe").getAttribute("src")).toContain(`embed/${PEOPLE[0].id}`);

      await cards.nth(1).tap();
      await expect.poll(() => phone.locator("iframe").count(), { timeout: 5_000 }).toBe(1);
      expect(await phone.locator("iframe").getAttribute("src")).toContain(`embed/${PEOPLE[1].id}`);

      await expectNoHorizontalOverflow(phone, "the archive with a mounted player, at iPhone width");
    } finally {
      await context.close();
    }
  });

  test("the playlist link's exact name and the verified playlist href", async ({ page }) => {
    await settle(page, "/the-human-archive");

    const link = page.getByRole("link", { name: "Watch the Human Archives", exact: true });
    await expect(link).toHaveCount(1);
    // Imported constant — this cannot pass against a href the site does not
    // render (the house rule from chrome-and-nav's INDIGENOUS_LINE).
    await expect(link).toHaveAttribute("href", ARCHIVE_PLAYLIST_URL);
    // Floor on the constant itself, so it cannot pass vacuously.
    expect(ARCHIVE_PLAYLIST_URL).toContain("list=PLdA-mx7SlQ_A");
  });

  test("live metadata — no deferral teaser survives", async ({ page }) => {
    await settle(page, "/the-human-archive");

    await expect(page).toHaveTitle(/Real Stories/);
    expect(await page.locator("body").innerText()).not.toMatch(/coming soon|to be released soon/i);
  });
});

test.describe("the homepage facade", () => {
  test("loads zero iframes; Play mounts exactly one", async ({ page }) => {
    await settle(page, "/");

    await expect(
      page.locator("iframe"),
      "no third-party embed ships in the initial page",
    ).toHaveCount(0);
    await expect(
      page.locator("img[alt*='Shane speaking directly to camera']"),
      "the poster stands in until the click",
    ).toBeVisible();

    // Retried through hydration, like every activating interaction here.
    await expect(async () => {
      await page.locator("button[aria-label='Play video']").click();
      await expect(page.locator("iframe")).toHaveCount(1, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    const player = page.locator("iframe");
    expect(await player.getAttribute("src")).toContain(
      `youtube-nocookie.com/embed/${HOME_VIDEO.id}`,
    );
    expect(await player.getAttribute("title")).toBe(HOME_VIDEO.title);
  });
});

test.describe("activated-player overflow", () => {
  // Runs under every viewport project, which is how the three widths
  // (390/834/1440) get covered — the same reasoning as typography.spec's
  // overflow loop: looping viewports in here would report a width the page
  // was never rendered at.
  test("mounted players add no horizontal overflow on either page", async ({ page }) => {
    await settle(page, "/the-human-archive");
    await hoverIntoPlayer(page, page.locator(CARDS).first());
    await expectNoHorizontalOverflow(page, "the archive with a player mounted");

    await settle(page, "/");
    await expect(async () => {
      await page.locator("button[aria-label='Play video']").click();
      await expect(page.locator("iframe")).toHaveCount(1, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expectNoHorizontalOverflow(page, "the homepage with a player mounted");
  });
});
