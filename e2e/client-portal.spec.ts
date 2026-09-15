import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * US-003 — one link per client, every report stacked, in a browser.
 *
 * Everything here needs a browser for a reason: both reports painted on
 * the one URL in store order, with no navigation chrome, is the served
 * page — no static render shows what the shipped document holds. The
 * fixture token and report copy come from the store file the site reads
 * from, never retyped here, so a fixture edit updates both sides together.
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

test("one URL serves every report stacked in store order", async ({ page }) => {
  const response = await page.goto(`/c/${acme.token}`);
  expect(response?.ok(), "the fixture token must resolve").toBe(true);
  await page.waitForLoadState("networkidle");

  // Both reports paint — nothing waits behind a tab.
  await expect(page.getByText(FIRST_TEXT)).toBeVisible();
  await expect(page.getByText(SECOND_TEXT)).toBeVisible();

  // Store order: the preliminary report comes before the follow-up.
  const articles = page.locator("article");
  await expect(articles).toHaveCount(2);
  await expect(articles.nth(0)).toContainText(FIRST_TEXT);
  await expect(articles.nth(1)).toContainText(SECOND_TEXT);
});

test("no sidebar or tab chrome renders", async ({ page }) => {
  const response = await page.goto(`/c/${acme.token}`);
  expect(response?.ok(), "the fixture token must resolve").toBe(true);
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("button", { name: "Toggle Sidebar" })).toHaveCount(0);
  await expect(page.getByRole("tab")).toHaveCount(0);
});
