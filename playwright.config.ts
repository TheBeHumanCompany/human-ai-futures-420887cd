import { defineConfig, devices } from "@playwright/test";

import { VIEWPORTS } from "./scripts/verify/viewports.ts";
import e2eConfig from "./scripts/verify/e2e-config.json" with { type: "json" };

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

// The default lives in scripts/verify/e2e-config.json, read by this file and by
// scripts/verify/e2e.sh. They each used to carry their own literal and drifted:
// the config said 8080 while the shell status line said 3000, so a run
// announced one server and tested another.
//
// `bun run dev` is Lovable's vite-tanstack config, which binds 8080 and falls
// back to 8081+ when taken. Pointed at 3000 the suite spent 120s waiting for a
// server that was already up elsewhere, then failed as a timeout — which reads
// like a broken app rather than a wrong URL.
const BASE_URL = process.env.E2E_BASE_URL ?? e2eConfig.defaultBaseUrl;

// The funnel smoke suite (plan todo 12) runs ONLY through --project=funnel —
// serially, one worker, against the seeded fixture tier. Two guards make that
// exclusion real rather than aspirational: (1) the catch-all viewport
// projects ignore the funnel directory, or a default run would pick each
// stage spec up three more times in parallel; (2) the funnel project itself
// is only REGISTERED when the CLI asked for it — `playwright test` (and
// therefore --list) runs every registered project, so a merely-defined
// funnel project would still show its specs in a default run. Registration
// is keyed on FUNNEL_PW_PROJECT (exported by scripts/verify/funnel.sh, the
// sanctioned entry) rather than argv: worker processes re-import this config
// with their OWN argv, so an argv-keyed guard left the project unregistered
// in every worker ("Project funnel not found in the worker process" on the
// first real run). Both guards are proven in test-results/funnel-helpers.log
// and the todo-13 run log.
const FUNNEL_SPEC = /e2e\/funnel\/.*\.spec\.ts/;
const FUNNEL_DIR = /e2e\/funnel\//;
const FUNNEL_REQUESTED = process.env.FUNNEL_PW_PROJECT === "1";

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
  // The port is taken FROM the same config the URL comes from, and bound with
  // --strictPort. `bun run dev` binds 8080 and silently falls back to 8081+ when
  // that is taken, which is how a run ends up waiting two minutes on a URL
  // nothing serves and calling it a timeout. Strict binding turns a port clash
  // into an immediate, legible failure.
  webServer: BASE_URL.includes("localhost")
    ? {
        command: `bunx vite dev --port ${new URL(BASE_URL).port || "5180"} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,

  projects: [
    ...VIEWPORTS.map((viewport) => ({
      name: viewport.name,
      testIgnore: [FUNNEL_DIR],
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
    ...(FUNNEL_REQUESTED
      ? [
          {
            name: "funnel",
            testMatch: FUNNEL_SPEC,
            fullyParallel: false,
            workers: 1,
            // Stage 3 alone can spend 60s on the cold init POST and 45s on each
            // webhook/unlock poll ceiling; the 30s default cannot hold a stage.
            timeout: 240_000,
          },
        ]
      : []),
  ],
});
