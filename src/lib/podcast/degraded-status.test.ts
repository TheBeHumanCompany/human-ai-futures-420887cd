import { describe, expect, test } from "bun:test";

import {
  DEGRADED_RETRY_AFTER_SECONDS,
  DEGRADED_SOURCE_HEADER,
  DEGRADED_SOURCE_VALUE,
  upgradeDegraded,
} from "./degraded-status";

/**
 * The 500 → 503 upgrade, and its three refusals.
 *
 * The refusals carry more weight than the upgrade. Promoting a 404 would
 * resurrect the missing-vs-unreachable conflation this whole design defeats one
 * layer up, and promoting an unmarked 500 would dress a genuine bug in our own
 * code as somebody else's outage.
 */

const degradedHeaders = () => ({ [DEGRADED_SOURCE_HEADER]: DEGRADED_SOURCE_VALUE });

describe("the upgrade", () => {
  test("a marked 500 becomes a 503 carrying Retry-After", async () => {
    const response = new Response("<html>branded degraded body</html>", {
      status: 500,
      headers: { ...degradedHeaders(), "content-type": "text/html" },
    });

    const upgraded = upgradeDegraded(response);

    expect(upgraded.status).toBe(503);
    expect(upgraded.headers.get("retry-after")).toBe(String(DEGRADED_RETRY_AFTER_SECONDS));
  });

  test("the body survives the upgrade — it is the page a visitor reads", async () => {
    const response = new Response("<html>branded degraded body</html>", {
      status: 500,
      headers: degradedHeaders(),
    });

    expect(await upgradeDegraded(response).text()).toBe("<html>branded degraded body</html>");
  });

  test("other headers are preserved, not replaced", () => {
    const response = new Response("body", {
      status: 500,
      headers: { ...degradedHeaders(), "content-type": "text/html", "x-custom": "kept" },
    });

    const upgraded = upgradeDegraded(response);
    expect(upgraded.headers.get("content-type")).toBe("text/html");
    expect(upgraded.headers.get("x-custom")).toBe("kept");
    expect(upgraded.headers.get(DEGRADED_SOURCE_HEADER)).toBe(DEGRADED_SOURCE_VALUE);
  });
});

describe("the refusals", () => {
  test("a 500 WITHOUT the marker is untouched — a real bug is not disguised", () => {
    const response = new Response("stack trace", { status: 500 });
    const result = upgradeDegraded(response);

    expect(result.status).toBe(500);
    expect(result).toBe(response);
  });

  test("a 404 WITH the marker stays a 404 — the trap at the status layer", () => {
    // If a route ever mis-emits the degraded marker on a genuine not-found, the
    // 404 must still be a 404. This is the last place that conflation could be
    // introduced, and it is refused here as well as prevented upstream.
    const response = new Response("not found", {
      status: 404,
      headers: degradedHeaders(),
    });

    expect(upgradeDegraded(response).status).toBe(404);
  });

  test("a 200 is untouched even if something marked it", () => {
    const response = new Response("fine", { status: 200, headers: degradedHeaders() });
    expect(upgradeDegraded(response).status).toBe(200);
  });

  test("the sitemap's own 503 passes through unchanged", () => {
    // The sitemap handler returns its own Response with its own status; this
    // function must not touch it, or two mechanisms would be fighting over one
    // status line.
    const response = new Response("", {
      status: 503,
      headers: { "content-type": "text/xml", "retry-after": "300" },
    });

    const result = upgradeDegraded(response);
    expect(result.status).toBe(503);
    expect(result).toBe(response);
  });

  test("a marker with the wrong value does not trigger the upgrade", () => {
    // Only the deliberate value counts. `live` is the other thing this header
    // is used to say.
    const response = new Response("body", {
      status: 500,
      headers: { [DEGRADED_SOURCE_HEADER]: "live" },
    });

    expect(upgradeDegraded(response).status).toBe(500);
  });
});
