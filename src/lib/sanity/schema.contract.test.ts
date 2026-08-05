import { describe, expect, test } from "bun:test";

import { episode, slugLock, topic } from "../../../studio/schemaTypes";

/**
 * The schema contract.
 *
 * The Studio's schema lives in `studio/schemaTypes/` — where Sanity's own
 * tooling expects it, and where the `sanity` package resolves. This test
 * reaches across that boundary deliberately: it is what makes a field renamed
 * in the CMS break CI, instead of silently blanking a section on every rendered
 * page. Without it, `guestBio → bio` is a green build and 39 broken pages.
 *
 * These assertions are one-directional today (every field the read path needs
 * exists, with the type it needs). The reverse direction — every schema field
 * is either projected or on an explicit exclusion list — arrives with the
 * projection map, and is the half that catches a field added in Studio and
 * never surfaced.
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
