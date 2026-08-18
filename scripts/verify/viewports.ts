/**
 * The three viewports every browser-facing check measures at.
 *
 * Kept in its own module so that `playwright.config.ts` and
 * `scripts/verify/visual-diff.ts` share one definition without the diff runner
 * having to import the Playwright config — and therefore `@playwright/test` —
 * just to learn three numbers. That import would put a browser-runner
 * dependency on the type-check path for a script that reaches Playwright
 * lazily and reports a clear install message when it is absent.
 *
 * Three, not one: the type scale is expressed almost entirely in `clamp()`,
 * and a clamp that is correct at one width can be wrong at both ends. A
 * single-viewport check of a fluid scale is close to no check at all.
 */

export type Viewport = { name: string; width: number; height: number };

export const VIEWPORTS: readonly Viewport[] = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 900 },
] as const;
