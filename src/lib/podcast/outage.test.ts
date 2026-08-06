import { describe, expect, test } from "bun:test";
import { notFound } from "@tanstack/react-router";

import { SanityHttpError } from "../sanity/http";
import { isNotFound, isSanityUnreachable } from "./outage";

/**
 * The missing-vs-unreachable classifier.
 *
 * The failure this guards against is specific and expensive: a `notFound()`
 * misread as an outage, or an outage misread as a 404. The second emits a
 * permanent "this is gone" instruction to crawlers because a third party was
 * briefly down, on URLs whose whole purpose is to never move.
 *
 * The reason it is easy to get wrong is that `notFound()` is NOT an `Error` —
 * it is a plain object — so the instinctive detector (`instanceof Error`, or a
 * message match) answers `false` for every genuine 404. These tests use the
 * router's real `notFound()` rather than a hand-written `{isNotFound: true}`,
 * so if the router ever changes that shape, this goes red here rather than in
 * production.
 */

describe("isSanityUnreachable", () => {
  test("is true for a SanityHttpError, which is what the transport throws", () => {
    expect(isSanityUnreachable(new SanityHttpError("[sanity] query timed out"))).toBe(true);
    expect(isSanityUnreachable(new SanityHttpError("[sanity] query failed (503)", 503))).toBe(true);
  });

  test("is true for a transport failure that lost its prototype crossing an RPC boundary", () => {
    // A server function serializes what it throws. `instanceof` answers false
    // on the far side, and on `/` that would turn a Sanity outage into an
    // unhandled 500 on the front door. The `reason` discriminant survives the
    // trip because it is a literal on every instance, not a constructor arg.
    expect(isSanityUnreachable({ message: "[sanity] query timed out", reason: "upstream" })).toBe(
      true,
    );
  });

  test("is FALSE for the router's real notFound(), which is a plain object", () => {
    // The whole trap in one assertion.
    expect(isSanityUnreachable(notFound())).toBe(false);
  });

  test("is false for an ordinary bug, so a real defect is never disguised as an outage", () => {
    expect(isSanityUnreachable(new TypeError("cannot read property 'x' of undefined"))).toBe(false);
    expect(isSanityUnreachable(new Error("something else went wrong"))).toBe(false);
  });

  test("is false for values that are not errors at all", () => {
    for (const value of [null, undefined, "a string", 42, [], {}]) {
      expect(isSanityUnreachable(value)).toBe(false);
    }
  });

  test("is false for an object whose reason is not the upstream discriminant", () => {
    // `"load"` is the other member of the union — raised by a cache under local
    // congestion, never by the transport. It must not read as an outage.
    expect(isSanityUnreachable({ reason: "load" })).toBe(false);
  });
});

describe("isNotFound", () => {
  test("is the router's own implementation, recognising its own notFound()", () => {
    expect(isNotFound(notFound())).toBe(true);
  });

  test("is false for a transport failure", () => {
    expect(isNotFound(new SanityHttpError("[sanity] query timed out"))).toBe(false);
  });
});

describe("the two classifications are mutually exclusive", () => {
  test("no value is ever both not-found and unreachable", () => {
    // The invariant the whole module exists to hold. Asserted directly rather
    // than inferred from the rows above, because "each is correct in isolation"
    // and "they can never both fire" are different claims and only the second
    // one keeps a 404 from becoming a 503.
    const values: unknown[] = [
      notFound(),
      notFound({ data: "episode" }),
      new SanityHttpError("[sanity] query timed out"),
      new SanityHttpError("[sanity] query failed (500)", 500),
      { message: "serialized", reason: "upstream" },
      new Error("an ordinary bug"),
      null,
      undefined,
      {},
    ];

    for (const value of values) {
      expect(isNotFound(value) && isSanityUnreachable(value)).toBe(false);
    }
  });

  test("the fixture set actually exercises both classifications", () => {
    // Non-vacuity floor: the loop above passes trivially if every value is
    // neither, which is exactly what a broken import would produce.
    expect(isNotFound(notFound())).toBe(true);
    expect(isSanityUnreachable(new SanityHttpError("x"))).toBe(true);
  });
});
