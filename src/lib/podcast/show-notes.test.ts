import { describe, expect, test } from "bun:test";

import catalogue from "./catalogue.snapshot.json";
import { cleanShowNotes, proseParagraphs, showNoteParagraphs } from "./show-notes";

/**
 * The cleaner is judged against the real catalogue rather than invented copy —
 * the promotional tail is a property of the feed, so the feed is the fixture.
 */

const EPISODES = (catalogue as { episodes: Array<{ description: string | null }> }).episodes;

describe("the promotional tail is removed", () => {
  test("no cleaned description keeps promo copy", () => {
    for (const episode of EPISODES) {
      const cleaned = cleanShowNotes(episode.description).toLowerCase();
      expect(cleaned).not.toContain("mobile viewers");
      expect(cleaned).not.toContain("listen on");
      expect(cleaned).not.toContain("hosted by");
      expect(cleaned).not.toContain("http");
      expect(cleaned).not.toContain("#thepeopledrivenpodcast");
      expect(cleaned).not.toContain("🎧");
    }
  });

  test("the real summary survives — the floor under the row above", () => {
    // An empty string would satisfy every negative assertion, so pin the
    // positive half: the editorial body is still there, and substantially so.
    const withNotes = EPISODES.filter((episode) => (episode.description ?? "").length > 200);
    expect(withNotes.length).toBeGreaterThan(10);

    for (const episode of withNotes) {
      const cleaned = cleanShowNotes(episode.description);
      expect(cleaned.length).toBeGreaterThan(150);
      expect(cleaned).toBe(cleaned.trim());
    }
  });

  test("a cleaned block ends on a complete sentence", () => {
    for (const episode of EPISODES) {
      const cleaned = cleanShowNotes(episode.description);
      if (cleaned) expect(/[.!?"'’”)]$/.test(cleaned)).toBe(true);
    }
  });
});

describe("paragraphing", () => {
  test("a long single block becomes several paragraphs", () => {
    const long = EPISODES.find((episode) => (episode.description ?? "").length > 800);
    expect(long).toBeDefined();
    expect(showNoteParagraphs(long!.description).length).toBeGreaterThan(1);
  });

  test("empty and missing descriptions yield nothing", () => {
    expect(showNoteParagraphs(null)).toEqual([]);
    expect(showNoteParagraphs("")).toEqual([]);
    expect(cleanShowNotes(undefined)).toBe("");
  });

  test("an already-clean description passes through untouched", () => {
    const clean = "A conversation about leadership. It runs deep. It ends well.";
    expect(cleanShowNotes(clean)).toBe(clean);
  });
});

describe("paragraph structure from the CMS survives", () => {
  test("a blank line becomes a separate paragraph", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    expect(showNoteParagraphs(text)).toEqual([
      "First paragraph.",
      "Second paragraph.",
      "Third paragraph.",
    ]);
  });

  test("single line breaks stay inside their paragraph", () => {
    const text = "Line one.\nLine two.\n\nNext block.";
    expect(showNoteParagraphs(text)).toEqual(["Line one.\nLine two.", "Next block."]);
  });

  test("portable text blocks each render as a paragraph", () => {
    const blocks = [
      { _type: "block", children: [{ text: "Alpha." }] },
      { _type: "block", children: [{ text: "Beta " }, { text: "gamma." }] },
    ];
    expect(proseParagraphs(blocks)).toEqual(["Alpha.", "Beta gamma."]);
  });

  test("a guest bio keeps its breaks and needs no promo cleaning", () => {
    expect(proseParagraphs("Bio one.\n\nBio two.")).toEqual(["Bio one.", "Bio two."]);
    expect(proseParagraphs(null)).toEqual([]);
  });
});
