import { describe, expect, test } from "bun:test";

import { episode, slugLock, topic } from "../../../studio/schemaTypes";
import { EPISODE_PROJECTION } from "./projection-map";

/**
 * The schema contract.
 *
 * The Studio's schema lives in `studio/schemaTypes/` — where Sanity's own
 * tooling expects it, and where the `sanity` package resolves. This test
 * reaches across that boundary deliberately: it is what makes a field renamed
 * in the CMS break CI, instead of silently blanking a section on every rendered
 * page. Without it, `guestBio → bio` is a green build and 39 broken pages.
 *
 * The assertions run in both directions now. The first half (above) is
 * forward: every field the read path needs exists, with the type it needs.
 * The second half (`episode schema field coverage`, below) is the reverse:
 * every field Studio actually declares is either projected by
 * `EPISODE_PROJECTION` or named on an explicit, reasoned exclusion list. That
 * second half is what catches a field added in Studio and never surfaced —
 * the false-green audit's row 2 ("Validates output aliases, not source
 * paths") — which the forward direction alone cannot see, because a field
 * nobody projects never appears on its side of the comparison.
 */

type Field = { name: string; type: string; readOnly?: unknown; options?: Record<string, unknown> };

const fieldsOf = (doc: { fields?: unknown }) => (doc.fields ?? []) as Field[];
const field = (doc: { fields?: unknown }, name: string) =>
  fieldsOf(doc).find((f) => f.name === name);

describe("episode schema", () => {
  test("is a document type named `episode`", () => {
    expect(episode.name).toBe("episode");
    expect(episode.type).toBe("document");
  });

  test.each([
    ["guid", "string"],
    ["slug", "slug"],
    ["episodeNumber", "number"],
    ["title", "string"],
    ["description", "text"],
    ["excerpt", "text"],
    ["guestName", "string"],
    ["guestBio", "text"],
    ["guestPhoto", "image"],
    ["coverArtwork", "image"],
    ["podbeanUrl", "url"],
    ["audioUrl", "url"],
    ["durationSeconds", "number"],
    ["publishedAt", "datetime"],
    ["searchText", "string"],
    ["topics", "array"],
  ])("declares %s as %s", (name, type) => {
    expect(field(episode, name)?.type).toBe(type);
  });

  test("guestBio is a plain string type, because the enrichment predicate uses length()", () => {
    // GROQ `length()` counts characters on a string and returns null for other
    // types; `count()` is the array equivalent. Choosing the wrong one here
    // would mark every episode un-enriched — a zero-entry sitemap and 39
    // noindex pages — so the type is pinned rather than assumed.
    expect(field(episode, "guestBio")?.type).toBe("text");
  });

  test("guid is readOnly — the document _id is derived from it", () => {
    // `_id` is deterministic: `episodeDocId(guid)` (src/lib/podcast/doc-id.ts),
    // used as a strict-create compare-and-set by publishEpisode() (Decision F).
    // An edited guid would not rename the existing document — it would make
    // this episode unreachable by its own id.
    expect(field(episode, "guid")?.readOnly).toBe(true);
  });

  test("slug freezes after first publish rather than being permanently locked", () => {
    // Editable before publish, immutable after. A function, not `true` — a
    // hard lock would make the pre-publish editing window impossible.
    expect(typeof field(episode, "slug")?.readOnly).toBe("function");
  });

  test("searchText is readOnly — it is recomputed on every publish", () => {
    expect(field(episode, "searchText")?.readOnly).toBe(true);
  });

  test.each(["guestPhoto", "coverArtwork"])("%s enables hotspot and requires alt text", (name) => {
    const image = field(episode, name) as (Field & { fields?: Field[] }) | undefined;
    expect(image?.options?.hotspot).toBe(true);
    expect(image?.fields?.some((f) => f.name === "alt")).toBe(true);
  });

  test("topics are references to the topic type, not free-text strings", () => {
    // Free text would drift (`Leadership` vs `leadership`) and make a canonical
    // server-side facet impossible.
    const topics = field(episode, "topics") as (Field & { of?: { type: string }[] }) | undefined;
    expect(topics?.of?.[0]?.type).toBe("reference");
  });
});

describe("episode schema field coverage", () => {
  // Every field Studio lets Shane fill in must end up somewhere the read path
  // can see it — either as a key in `EPISODE_PROJECTION`, or on this list,
  // named with the reason it is deliberately invisible to every query. A field
  // added to `episode.ts` and forgotten here is exactly the gap the forward
  // assertions above cannot catch: nothing reads it, so nothing in the read
  // path breaks, and the omission ships silently until someone goes looking
  // for data Studio shows and the site never renders.
  const EXCLUDED_FIELDS: Record<string, string> = {
    // Hidden guest-normalisation escape hatch (episode.ts's GUEST FIELDS note)
    // reserved for a future guest-reference migration. No query reads it and
    // no page renders it; it exists so that migration is a script, not a
    // re-authoring exercise.
    guestKey: "guest-normalisation escape hatch, reserved for a future guest reference migration",
    // Bookkeeping written once by the backfill seeder to record provenance.
    // Never read back by the publish path, the queries, or any rendered
    // surface — its only reader is a human inspecting a document in Studio.
    seededBy: "backfill provenance bookkeeping, not read by any query or surface",
    // The fingerprint the share card was generated from. Read by
    // `podcast:report` to list stale cards, never by a rendered surface — and
    // deliberately NOT projected, because shipping it to the browser would pay
    // for a staleness check on every page load that only a script performs.
    // Note `shareCard` itself IS projected: the image is rendered, the key is
    // not.
    shareCardKey: "share-card staleness fingerprint, read only by podcast:report",
  };

  test("every excluded field actually exists on the schema", () => {
    // Guards the guard: an exclusion for a field that was since renamed or
    // removed would silently stop meaning anything, and the coverage test
    // below would keep passing for the wrong reason.
    const schemaFieldNames = new Set(fieldsOf(episode).map((f) => f.name));
    for (const name of Object.keys(EXCLUDED_FIELDS)) {
      expect(schemaFieldNames.has(name)).toBe(true);
    }
  });

  test("every schema field is either projected or on the exclusion list", () => {
    const projectedKeys = new Set(Object.keys(EPISODE_PROJECTION));
    const uncovered = fieldsOf(episode)
      .map((f) => f.name)
      .filter((name) => !projectedKeys.has(name) && !(name in EXCLUDED_FIELDS));

    // A non-empty list here means: `episode.ts` grew a field that is neither
    // wired into `EPISODE_PROJECTION` (so no query returns it) nor named above
    // with a reason (so its absence from the projection is a choice, not an
    // oversight). Surfacing the exact field names in the assertion failure —
    // rather than just a boolean — is what makes the fix a one-line addition
    // to one of the two lists instead of a fresh investigation.
    expect(uncovered).toEqual([]);
  });
});

describe("topic schema", () => {
  test("is a document with a name and a slug", () => {
    expect(topic.type).toBe("document");
    expect(field(topic, "name")?.type).toBe("string");
    expect(field(topic, "slug")?.type).toBe("slug");
  });
});

describe("slugLock schema", () => {
  test("carries the fields the publish transaction writes", () => {
    expect(field(slugLock, "episodeId")?.type).toBe("string");
    expect(field(slugLock, "guid")?.type).toBe("string");
    expect(field(slugLock, "frozenAt")?.type).toBe("datetime");
  });

  test("every field is readOnly — a lock is never authored", () => {
    // Studio access is closed off in sanity.config.ts as well (excluded from
    // structure, no templates, no actions). This asserts the schema half.
    const fields = fieldsOf(slugLock);
    expect(fields.length).toBeGreaterThan(0);
    for (const f of fields) expect(f.readOnly).toBe(true);
  });
});
