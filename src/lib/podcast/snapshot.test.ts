import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import catalogue from "./catalogue.snapshot.json";
import slugs from "./slugs.snapshot.json";

/**
 * The two committed snapshots, held to each other and to their budget.
 *
 * `catalogue.snapshot.json` is the durable floor under every read surface — it
 * is bundled into the server function and is what renders when Sanity is
 * unreachable. `slugs.snapshot.json` is the reviewed slug assignment that the
 * backfill replays. They describe the same 39 episodes from two directions, so
 * a disagreement between them is a real defect: it means either the fallback
 * would serve a URL the backfill never created, or the backfill created a URL
 * the fallback cannot serve.
 *
 * Set equality is asserted in BOTH directions on purpose. A subset check is
 * vacuously true over an empty file, and "the fallback is missing an episode"
 * and "the fallback invented an episode" are different failures with different
 * causes — a one-directional check silently tolerates one of them.
 */

const CATALOGUE_PATH = path.join(import.meta.dir, "catalogue.snapshot.json");

/** Decision E's documented trip-wire, duplicated in scripts/snapshot-catalogue.ts. */
const MAX_SERIALIZED_BYTES = 1_000_000;

function identity(entry: { guid: string; _id: string; slug: string }): string {
  return `${entry.guid}|${entry._id}|${entry.slug}`;
}

describe("catalogue snapshot", () => {
  test("carries a snapshotAt that is present and actually parseable", () => {
    // The whole point of storing this rather than reading a git mtime is that
    // the age counter reports when the data was harvested. A string that does
    // not parse makes the counter silently wrong rather than absent, which is
    // worse.
    expect(typeof catalogue.snapshotAt).toBe("string");
    expect(catalogue.snapshotAt.length).toBeGreaterThan(0);
    expect(Number.isNaN(new Date(catalogue.snapshotAt).getTime())).toBe(false);
  });

  test("records which source produced it", () => {
    // Feed today, Sanity after the Step 6 handover. Recorded rather than
    // inferred, so a snapshot harvested from the wrong side of the handover is
    // visible in the file instead of being a guess.
    expect(["feed", "sanity"]).toContain(catalogue.source);
  });

  test("holds the whole catalogue, not a truncated page of it", () => {
    expect(catalogue.episodes.length).toBeGreaterThanOrEqual(39);
  });

  test("every entry carries the identity triple the fallback looks up by", () => {
    for (const entry of catalogue.episodes) {
      expect(typeof entry.guid).toBe("string");
      expect(entry.guid.length).toBeGreaterThan(0);
      expect(typeof entry._id).toBe("string");
      expect(entry._id.length).toBeGreaterThan(0);
      expect(typeof entry.slug).toBe("string");
      expect(entry.slug.length).toBeGreaterThan(0);
    }
  });

  test("every entry carries the fields a degraded render needs", () => {
    // Without these the fallback "works" and renders a blank page, which is
    // indistinguishable from an outage to the person who followed the link.
    for (const entry of catalogue.episodes) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.podbeanUrl.length).toBeGreaterThan(0);
      expect(entry.audioUrl.length).toBeGreaterThan(0);
      expect(entry.durationSeconds).toBeGreaterThan(0);
      expect(Number.isNaN(new Date(entry.publishedAt).getTime())).toBe(false);
    }
  });

  test("slugs are unique across the snapshot", () => {
    const seen = catalogue.episodes.map((entry) => entry.slug);
    expect(new Set(seen).size).toBe(seen.length);
  });

  test("stays inside the serialized size budget that keeps it bundleable", () => {
    // Asserted against the file on disk, not against a re-serialization of the
    // parsed object: the bundled artifact is the file, and formatting is part
    // of its size.
    const bytes = readFileSync(CATALOGUE_PATH).byteLength;
    expect(bytes).toBeLessThan(MAX_SERIALIZED_BYTES);

    // Non-vacuity floor. A zero-byte or stub file passes the budget check
    // perfectly, and that is exactly the state a failed regeneration leaves.
    expect(bytes).toBeGreaterThan(10_000);
  });
});

describe("the two snapshots agree", () => {
  test("the slug snapshot is itself non-empty", () => {
    // Floor first: every set-equality assertion below is trivially true when
    // both sides are empty.
    expect(slugs.length).toBeGreaterThanOrEqual(39);
  });

  test("carry identical {guid,_id,slug} sets, in both directions", () => {
    const fromCatalogue = new Set(catalogue.episodes.map(identity));
    const fromSlugs = new Set(slugs.map(identity));

    const missingFromCatalogue = [...fromSlugs].filter((key) => !fromCatalogue.has(key));
    const missingFromSlugs = [...fromCatalogue].filter((key) => !fromSlugs.has(key));

    // Reported as the offending entries rather than as a bare count, because
    // the remedy differs per direction and "expected 39 to be 38" tells the
    // next person nothing about which episode drifted.
    expect(missingFromCatalogue).toEqual([]);
    expect(missingFromSlugs).toEqual([]);
    expect(fromCatalogue.size).toBe(fromSlugs.size);
  });
});
