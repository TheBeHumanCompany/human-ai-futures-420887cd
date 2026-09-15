import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * US-003 — one link per client, many reports in sidebar tabs, in a browser.
 *
 * Everything here needs a browser for a reason: a tab click switching the
 * visible report, and the sidebar collapsing without losing navigation, are
 * interactions — no static render can show they work. The fixture token and
 * report copy come from the store file the site reads from, never retyped
 * here, so a fixture edit updates both sides together.
 *
 * Viewport-aware by necessity: below 768px the sidebar renders as a sheet
 * (see `useIsMobile`), so the sidebar entries are driven from inside the
 * opened sheet there, while the tab bar above the report — present in every
 * state — is clicked everywhere.
 */

interface FixtureReport {
  id: string;
  title: string;
  html: string;
}

interface FixtureClient {
  id: string;
  token: string;
  reports?: FixtureReport[];
}

const store = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "clients.json"), "utf8"),
) as FixtureClient[];

const acme = store.find((client) => client.id === "acme-industrial")!;
const [first, second] = acme.reports!;

/** Visible text of an authored report body. */
const textOf = (html: string) => html.replace(/<[^>]+>/g, "");

const FIRST_TEXT = textOf(first.html);
const SECOND_TEXT = textOf(second.html);

const isDesktopSidebar = async (page: Page) =>
  ((await page.viewportSize())?.width ?? 1440) >= 768;

/**
 * The tab state lives in React: a click that lands before hydration has
 * attached the tab listeners is a no-op on a page that is perfectly
 * correct. Settle first (the `networkidle` half of video-facades'
 * `settle()`), then retry the activating click the way `hoverIntoPlayer`
 * retries its hover — clicking the already-active tab keeps it active, so
 * the retry is idempotent.
 */
const settleIntoClientPage = async (page: Page) => {
  const response = await page.goto(`/c/${acme.token}`);
  expect(response?.ok(), "the fixture token must resolve").toBe(true);
  await page.waitForLoadState("networkidle");
};

const switchTabUntilVisible = (page: Page, title: string, text: string) =>
  expect(async () => {
    await page.getByRole("tab", { name: title }).click();
    await expect(page.getByText(text)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });

test("one URL serves both reports; tab clicks switch the visible report", async ({ page }) => {
  await settleIntoClientPage(page);

  // First paint selects the first report; the second waits for its tab.
  await expect(page.getByText(FIRST_TEXT)).toBeVisible();
  await expect(page.getByText(SECOND_TEXT)).toHaveCount(0);

  await switchTabUntilVisible(page, second.title, SECOND_TEXT);
  await expect(page.getByText(FIRST_TEXT)).toHaveCount(0);

  // The sidebar entries drive the same tab state through the one URL.
  const sidebarEntry = page.getByRole("button", { name: first.title });
  if (await isDesktopSidebar(page)) {
    await expect(sidebarEntry).toBeAttached();
    if (await sidebarEntry.isVisible()) {
      await sidebarEntry.click();
      await expect(page.getByText(FIRST_TEXT)).toBeVisible();
      await expect(page.getByText(SECOND_TEXT)).toHaveCount(0);
    }
  } else {
    // Below the mobile breakpoint the entries live in the closed sheet
    // (unmounted until opened), so open it and drive back to the first
    // report from there — the sheet is the mobile navigation.
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await sidebarEntry.click();
    await expect(page.getByText(FIRST_TEXT)).toBeVisible();
    await expect(page.getByText(SECOND_TEXT)).toHaveCount(0);
    await page.keyboard.press("Escape");
  }
});

test("sidebar collapse and expand keep report navigation working", async ({ page }) => {
  await settleIntoClientPage(page);

  const trigger = page.getByRole("button", { name: "Toggle Sidebar" });
  await expect(trigger, "the collapse toggle must be on screen").toBeVisible();

  await trigger.click();
  if (await isDesktopSidebar(page)) {
    await expect(page.locator('[data-state="collapsed"]')).toBeAttached();

    // Collapsed to icon buttons with tooltips: navigation still switches.
    await page.getByRole("button", { name: second.title }).click();
    await expect(page.getByText(SECOND_TEXT)).toBeVisible();

    await trigger.click();
    await expect(page.locator('[data-state="expanded"]')).toBeAttached();
  } else {
    // Below the mobile breakpoint the toggle opens the report sheet;
    // closing it leaves the tab bar working.
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  }

  await switchTabUntilVisible(page, first.title, FIRST_TEXT);
  await expect(page.getByText(SECOND_TEXT)).toHaveCount(0);
});
