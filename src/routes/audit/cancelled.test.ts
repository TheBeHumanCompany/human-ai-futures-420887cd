import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Route } from "./cancelled";

/**
 * The cancelled-checkout receipt (funnel todo 8).
 *
 * A static page by construction: no loader, no data fetch, no Stripe — the
 * buyer landed here by choosing to abandon checkout, so the page owes them
 * a no-charge confirmation and the way back. Pinned offline because there is
 * nothing to inject.
 */

const ROUTE_SOURCE = readFileSync(new URL("./cancelled.tsx", import.meta.url).pathname, "utf8");

const callHead = () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const head = Route.options.head as any;
  return head({}) as { meta?: Array<Record<string, string>> };
};

const callHeaders = () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const headers = Route.options.headers as any;
  return headers() as Record<string, string>;
};

describe("the route is static by construction", () => {
  test("no loader and no search validation — nothing is read from the URL", () => {
    expect(Route.options.loader).toBeUndefined();
    expect(Route.options.validateSearch).toBeUndefined();
  });

  test("the source never references the session, Stripe, or a fetch", () => {
    expect(ROUTE_SOURCE).not.toMatch(/session_id/i);
    expect(ROUTE_SOURCE).not.toMatch(/stripe/i);
    expect(ROUTE_SOURCE).not.toMatch(/fetch/i);
  });
});

describe("the cancelled receipt renders the retry contract", () => {
  const html = renderToStaticMarkup(createElement(Route.options.component as ComponentType));

  test("it renders the receipt marker", () => {
    expect(html).toContain("audit-cancelled-receipt");
  });

  test("it confirms no charge was made", () => {
    expect(html).toContain("No charge was made");
  });

  test("it offers the way back through the pinned retry link", () => {
    expect(html).toContain("audit-retry-link");
    expect(html).toContain("Back to the homepage");
  });

  test("the retry link goes home — never a token-carrying prospect URL", () => {
    expect(ROUTE_SOURCE).not.toMatch(/\/c\//);
  });

  test("no raw HTML injection anywhere", () => {
    expect(ROUTE_SOURCE).not.toContain("dangerouslySetInnerHTML");
  });
});

describe("the cancelled receipt stays private", () => {
  test("head carries noindex", () => {
    expect(callHead().meta?.find((m) => m.name === "robots")?.content).toBe("noindex");
  });

  test("headers emit X-Robots-Tag: noindex", () => {
    expect(callHeaders()["X-Robots-Tag"]).toBe("noindex");
  });
});
