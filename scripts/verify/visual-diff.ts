/**
 * Before/after visual diff across every surface and viewport.
 *
 * ── What this is for ───────────────────────────────────────────────────────
 *
 * Phase 4 applies a new type scale to 47 call sites in one pass. Nothing in
 * the test suite can tell you that a heading went from 48px to 96px — the DOM
 * is identical, the text is identical, every assertion still passes, and the
 * page is ruined. The type gate (G1) was the protection against that, and
 * Amendment 4 cleared it in advance, accepting the risk explicitly: "a wrong
 * scale reaching all 47 call sites unseen".
 *
 * This is the mechanical half of the mitigation. It measures the rendered
 * geometry of every heading before the change and after it, and flags any
 * heading box that moved by more than the tolerance. It does not judge whether
 * the new size is *better* — that is a human's job — only whether the change
 * is larger than anyone intended.
 *
 * ── Why heading BOXES and not pixel diffs ──────────────────────────────────
 *
 * A whole-page pixel diff of a site whose copy, images and layout are all
 * changing in the same branch returns "100% different" on every surface and
 * tells you nothing. Measuring the bounding box of each heading isolates the
 * one variable the type scale controls.
 *
 * Usage:
 *   bun run scripts/verify/visual-diff.ts --capture before
 *   # …apply the scale…
 *   bun run scripts/verify/visual-diff.ts --capture after
 *   bun run scripts/verify/visual-diff.ts --compare
 *
 * Environment:
 *   E2E_BASE_URL   what to measure (default http://localhost:3000)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { VIEWPORTS } from "./viewports.ts";
import { visitableSurfaces } from "../../src/lib/surfaces.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT_DIR = path.join(REPO_ROOT, ".baseline", "visual");
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * A heading box may change by up to this fraction before it is flagged.
 *
 * Set at 15% because the scale is *meant* to move type — a tolerance near zero
 * would flag all 47 call sites and be turned off within an hour, which is
 * worse than no check. 15% passes a deliberate step change and catches an
 * order-of-magnitude mistake, which is the failure mode that matters.
 */
const TOLERANCE = 0.15;

type Box = {
  selector: string;
  index: number;
  text: string;
  width: number;
  height: number;
  fontSize: number;
};
type Capture = { surface: string; viewport: string; boxes: Box[] };

const HEADING_SELECTORS = ["h1", "h2", "h3", "h4"];

async function capture(label: string): Promise<void> {
  const { chromium } = await importPlaywright();
  mkdirSync(OUT_DIR, { recursive: true });

  const surfaces = visitableSurfaces();
  if (surfaces.length === 0) throw new Error("visitableSurfaces() is empty — nothing to measure");

  const browser = await chromium.launch();
  const captures: Capture[] = [];

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      for (const surface of surfaces) {
        const url = `${BASE_URL.replace(/\/$/, "")}${surface.path}`;
        const response = await page.goto(url, { waitUntil: "networkidle" });
        // A 404 measured as "no headings changed" would be a silent pass on a
        // page that is not there.
        if (!response || !response.ok()) {
          throw new Error(`${url} returned ${response?.status() ?? "no response"}`);
        }

        const boxes: Box[] = await page.evaluate((selectors: string[]) => {
          const out: Array<Omit<Box, never>> = [];
          for (const selector of selectors) {
            document.querySelectorAll(selector).forEach((el, index) => {
              const rect = el.getBoundingClientRect();
              out.push({
                selector,
                index,
                text: (el.textContent ?? "").trim().slice(0, 60),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                fontSize: Math.round(parseFloat(getComputedStyle(el).fontSize)),
              });
            });
          }
          return out;
        }, HEADING_SELECTORS);

        captures.push({ surface: surface.path, viewport: viewport.name, boxes });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const measured = captures.reduce((n, c) => n + c.boxes.length, 0);
  if (measured === 0) {
    throw new Error(
      `measured 0 headings across ${captures.length} surface/viewport pairs. ` +
        "A capture with nothing in it makes the later comparison vacuously clean.",
    );
  }

  const file = path.join(OUT_DIR, `${label}.json`);
  writeFileSync(file, JSON.stringify({ base_url: BASE_URL, captures }, null, 2) + "\n");
  console.log(
    `captured ${measured} heading boxes across ${surfaces.length} surfaces × ${VIEWPORTS.length} viewports -> ${path.relative(REPO_ROOT, file)}`,
  );
}

function compare(): void {
  const beforeFile = path.join(OUT_DIR, "before.json");
  const afterFile = path.join(OUT_DIR, "after.json");
  for (const f of [beforeFile, afterFile]) {
    if (!existsSync(f)) {
      console.error(
        `FAIL[visual-diff]: ${path.relative(REPO_ROOT, f)} is missing. Capture both sides first.`,
      );
      process.exit(1);
    }
  }

  const before: { captures: Capture[] } = JSON.parse(readFileSync(beforeFile, "utf8"));
  const after: { captures: Capture[] } = JSON.parse(readFileSync(afterFile, "utf8"));

  const key = (c: Capture) => `${c.surface}@${c.viewport}`;
  const boxKey = (b: Box) => `${b.selector}[${b.index}] ${b.text}`;
  const beforeByKey = new Map(before.captures.map((c) => [key(c), c]));

  let compared = 0;
  const flagged: string[] = [];

  for (const afterCapture of after.captures) {
    const beforeCapture = beforeByKey.get(key(afterCapture));
    if (!beforeCapture) {
      flagged.push(
        `${key(afterCapture)}: present after, absent before — new surface, review by eye`,
      );
      continue;
    }
    const beforeBoxes = new Map(beforeCapture.boxes.map((b) => [boxKey(b), b]));
    for (const now of afterCapture.boxes) {
      const was = beforeBoxes.get(boxKey(now));
      if (!was) continue; // copy changed too; nothing comparable
      compared += 1;
      for (const dim of ["height", "fontSize"] as const) {
        const from = was[dim];
        const to = now[dim];
        if (from === 0) continue;
        const delta = Math.abs(to - from) / from;
        if (delta > TOLERANCE) {
          flagged.push(
            `${key(afterCapture)} ${boxKey(now)}: ${dim} ${from} -> ${to} ` +
              `(${(delta * 100).toFixed(0)}%, tolerance ${(TOLERANCE * 100).toFixed(0)}%)`,
          );
        }
      }
    }
  }

  // Non-vacuity floor. If the two captures share no comparable headings, "no
  // heading changed by more than 15%" is true and worthless.
  if (compared === 0) {
    console.error(
      "FAIL[visual-diff]: no heading was comparable between the two captures. " +
        "Either the captures are of different sites, or one of them measured nothing.",
    );
    process.exit(1);
  }

  console.log(`compared ${compared} heading boxes`);
  if (flagged.length > 0) {
    console.error("");
    console.error(
      `FAIL[visual-diff]: ${flagged.length} heading box(es) moved more than the tolerance:`,
    );
    for (const f of flagged) console.error(`  - ${f}`);
    console.error("");
    console.error(
      "This is a report, not a verdict: a deliberate scale change is expected to move type.",
    );
    console.error("Look at each one and either accept it on the specimen or fix the scale.");
    process.exit(1);
  }
  console.log(`PASS[visual-diff]: every heading box within ${(TOLERANCE * 100).toFixed(0)}%`);
}

/**
 * Playwright is reached lazily and described structurally rather than imported
 * for its types. The alternative — a static `import type` — would put the whole
 * browser runner on the type-check path for every `tsc -p scripts` run, so a
 * repo without browsers installed could not typecheck its own scripts. Only the
 * two calls this file makes are declared.
 */
type Chromium = {
  launch(): Promise<{
    newContext(options: { viewport: { width: number; height: number } }): Promise<{
      newPage(): Promise<{
        goto(
          url: string,
          options: { waitUntil: "networkidle" },
        ): Promise<{ ok(): boolean; status(): number } | null>;
        evaluate<A, R>(fn: (arg: A) => R, arg: A): Promise<R>;
      }>;
      close(): Promise<void>;
    }>;
    close(): Promise<void>;
  }>;
};

async function importPlaywright(): Promise<{ chromium: Chromium }> {
  try {
    return (await import("playwright" as string)) as { chromium: Chromium };
  } catch {
    console.error("FAIL[visual-diff]: playwright is not installed.");
    console.error("  bun add -d playwright @playwright/test && bunx playwright install chromium");
    process.exit(1);
  }
}

const mode = process.argv[2];
if (mode === "--capture") {
  const label = process.argv[3];
  if (label !== "before" && label !== "after") {
    console.error("usage: bun run scripts/verify/visual-diff.ts --capture before|after");
    process.exit(2);
  }
  await capture(label);
} else if (mode === "--compare") {
  compare();
} else {
  console.error("usage: bun run scripts/verify/visual-diff.ts --capture before|after | --compare");
  process.exit(2);
}
