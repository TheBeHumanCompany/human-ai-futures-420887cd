import { expect, test } from "@playwright/test";

import { buildProspectUrl, extractMagicLink } from "./helpers.ts";

/**
 * Placeholder proving the funnel project wiring (plan todo 12): the project
 * resolves, and the helper library imports and executes under the Playwright
 * runtime. Todo 13 replaces this file with the five real stage specs.
 */
test("funnel helpers import cleanly under the Playwright runtime", () => {
  const url = buildProspectUrl("http://localhost:3000/", "iwk6Gn111auDWiidHvz9OwOkOI9_Yqnum7");
  expect(url).toBe("http://localhost:3000/c/iwk6Gn111auDWiidHvz9OwOkOI9_Yqnum7");
  expect(extractMagicLink(`<a href="${url}">Open your private blueprint</a>`)).toBe(url);
});
