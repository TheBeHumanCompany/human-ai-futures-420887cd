import { describe, expect, test } from "bun:test";

import { SITE_ORIGIN, absoluteUrl, episodeUrl } from "./config";
import { imageRef, imageUrl, ogImageUrl } from "./image";
import { methodFor, queryUrlFor } from "./http";

describe("config", () => {
  test("the canonical origin is the confirmed .ca host", () => {
    // Confirmed 2026-08-05. Every shared link is absolute against this and it
    // cannot change afterwards, so it is asserted rather than assumed.
    expect(SITE_ORIGIN).toBe("https://thebehumancompany.ca");
  });

  test("episode URLs are absolute and correctly shaped", () => {
    expect(episodeUrl("john-smith-building-trust")).toBe(
      "https://thebehumancompany.ca/podcast/john-smith-building-trust",
    );
  });

  test("absoluteUrl handles paths with and without a leading slash consistently", () => {
    expect(absoluteUrl("/podcast")).toBe("https://thebehumancompany.ca/podcast");
    expect(absoluteUrl("/sitemap.xml")).toBe("https://thebehumancompany.ca/sitemap.xml");
  });
});

describe("query transport", () => {
  test("builds a CDN query URL against the published perspective", () => {
    const url = queryUrlFor('*[_type == "episode"]');
    expect(url).toStartWith("https://5apyl3sk.apicdn.sanity.io/v2026-08-01/data/query/production?");
    expect(url).toContain("perspective=published");
  });

  test("encodes params as $-prefixed JSON, which is what makes injection impossible", () => {
    const params = new URL(
      queryUrlFor('*[_type == "episode" && slug.current == $slug][0]', { slug: "john-smith" }),
    ).searchParams;
    expect(params.get("$slug")).toBe('"john-smith"');
  });

  test("a hostile param value stays in the params, never in the query", () => {
    // The classic GROQ injection shape. It must survive as inert data.
    const hostile = '"] || _type == "user" || ["';
    const source = '*[_type == "episode" && slug.current == $slug]';
    const params = new URL(queryUrlFor(source, { slug: hostile })).searchParams;

    // The query is byte-for-byte what we wrote — the payload never becomes syntax.
    expect(params.get("query")).toBe(source);
    // And the payload is carried as a JSON string value, not concatenated in.
    expect(params.get("$slug")).toBe(JSON.stringify(hostile));
  });

  test("short queries use GET", () => {
    expect(methodFor('*[_type == "episode"][0...12]')).toBe("GET");
  });

  test("switches to POST before Sanity's 11 kB GET ceiling", () => {
    // Not hypothetical: a long multi-term search plus filters against a real
    // projection crosses this. It would fail in production, not in a test with
    // 39 episodes, which is why the threshold is pinned here.
    const huge = "x".repeat(11_000);
    expect(methodFor('*[_type == "episode" && searchText match $q]', { q: huge })).toBe("POST");
  });
});

describe("image URLs", () => {
  const REF = "image-abc123def456-1200x630-jpg";

  test("builds a CDN URL from an asset ref", () => {
    const url = imageUrl(REF);
    expect(url).toStartWith(
      "https://cdn.sanity.io/images/5apyl3sk/production/abc123def456-1200x630.jpg",
    );
    expect(url).toContain("auto=format");
  });

  test("applies transforms", () => {
    const url = imageUrl(REF, { width: 800, height: 450, fit: "crop", quality: 80 });
    expect(url).toContain("w=800");
    expect(url).toContain("h=450");
    expect(url).toContain("fit=crop");
    expect(url).toContain("q=80");
  });

  test("the OG variant is a 1200x630 hotspot-aware crop", () => {
    const url = ogImageUrl(REF)!;
    expect(url).toContain("w=1200");
    expect(url).toContain("h=630");
    expect(url).toContain("fit=crop");
  });

  test("reads the ref out of an image field", () => {
    expect(imageRef({ asset: { _ref: REF } })).toBe(REF);
  });

  test("an image wrapper with no asset yields null, not a broken URL", () => {
    // Studio can leave the object present with the asset unset. This is the
    // same shape the enrichment predicate has to see through.
    expect(imageRef({})).toBeNull();
    expect(imageRef({ asset: null })).toBeNull();
    expect(imageUrl({ asset: {} })).toBeNull();
  });

  test("malformed refs yield null rather than a 404ing URL", () => {
    for (const bad of ["", "not-an-image", "image-abc-nope-jpg", "file-abc123-1200x630-jpg"]) {
      expect(imageUrl(bad)).toBeNull();
    }
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
  });
});
