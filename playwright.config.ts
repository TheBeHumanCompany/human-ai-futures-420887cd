import { defineConfig, devices } from "@playwright/test";

import { VIEWPORTS } from "./scripts/verify/viewports.ts";

/**
 * Browser-runner configuration.
 *
 * Two things here are load-bearing rather than boilerplate:
 *
 * ── The `no-js` project (AC-6.9b) ──────────────────────────────────────────
 *
 * Amendment 3 decision 2 replaced the Radix accordion on the Blueprint page
 * with native `<details>/<summary>`. The reason was demonstrated, not
 * theorised: Codex server-rendered the vendored accordion and got **8**
 * `[data-state="closed"]` matches from **2** items with **0** bodies — so the
 * planned "≥6 closed" gate passed on two empty sections — and with JavaScript
 * disabled the server-rendered regions could not be opened at all. `forceMount`
 * fixes DOM presence and does nothing for the no-JS toggle.
 *
 * A `<details>` element opens without JavaScript. That claim is only worth
 * anything if something checks it with JavaScript off, which is what this
 * project is for. Without it AC-6.9b is a comment.
 *
 * ── Three viewports ────────────────────────────────────────────────────────
 *
 * The type scale is the largest change in this pass and it is expressed almost
 * entirely in `clamp()`. A clamp that is correct at one width can be wrong at
 * both ends, so a single-viewport check is close to no check at all.
 */

// 8080, not 3000. `bun run dev` is Lovable's vite-tanstack config, which serves
// on 8080 and falls back to 8081+ when that is taken. Pointed at 3000 the
// browser suite spent 120s waiting for a server that was already running on
// another port and then failed as a timeout — a failure that looks like a
// broken app rather than a wrong URL. Override with E2E_BASE_URL for staging
// or production.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["json", { outputFile: "e2e-results.json" }]] : "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  // Only started for a localhost base URL. Pointed at staging or production,
  // spawning a local dev server would be, at best, wasted work — and at worst
  // the thing that actually answered the requests the gate then reported on.
  webServer: BASE_URL.includes("localhost")
    ? {
        command: "bun run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,

  projects: [
    ...VIEWPORTS.map((viewport) => ({
      name: viewport.name,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: viewport.width, height: viewport.height },
      },
    })),
    {
      name: "no-js",
      testMatch: /.*no-js\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        javaScriptEnabled: false,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
