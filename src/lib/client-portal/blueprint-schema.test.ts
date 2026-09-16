import { describe, expect, test } from "bun:test";

import {
  applyTier,
  parseBlocks,
  parseSection,
  parseSections,
  tabsOf,
  type BlueprintSection,
} from "./blueprint-schema";

const SECRET = "PAID-BODY-MARKER-9f1c22";

const row = (over: Record<string, unknown> = {}) => ({
  id: "11111111-1111-1111-1111-111111111111",
  section_key: "operating-reality",
  ordinal: 1,
  tier: "preliminary",
  status: "published",
  title: "The operating reality",
  band: "prose",
  body: { blocks: [{ type: "prose", paragraphs: ["Hello."] }] },
  ...over,
});

describe("parseSection", () => {
  test("a well-formed row becomes a section", () => {
    const section = parseSection(row())!;
    expect(section.sectionKey).toBe("operating-reality");
    expect(section.tier).toBe("preliminary");
    expect(section.blocks).toHaveLength(1);
    expect(section.locked).toBe(false);
  });

  test("a half-written row renders as nothing, not as an empty titled section", () => {
    expect(parseSection(row({ title: "  " }))).toBeNull();
    expect(parseSection(row({ id: "" }))).toBeNull();
    expect(parseSection(row({ band: undefined }))).toBeNull();
    expect(parseSection(row({ section_key: null }))).toBeNull();
  });

  test("an unknown tier is refused rather than guessed", () => {
    expect(parseSection(row({ tier: "draft" }))).toBeNull();
    expect(parseSection(row({ tier: null }))).toBeNull();
  });

  test("a non-numeric ordinal is refused", () => {
    expect(parseSection(row({ ordinal: "1" }))).toBeNull();
    expect(parseSection(row({ ordinal: Number.NaN }))).toBeNull();
  });

  test("a missing body is an empty section, not a failure", () => {
    expect(parseSection(row({ body: null }))!.blocks).toEqual([]);
  });

  test("non-records are refused", () => {
    expect(parseSection(null)).toBeNull();
    expect(parseSection("x")).toBeNull();
    expect(parseSection([])).toBeNull();
  });
});

describe("parseBlocks — open by construction", () => {
  test("a block type this version does not know is KEPT, not dropped", () => {
    const blocks = parseBlocks([
      { type: "prose", paragraphs: ["a"] },
      { type: "someFutureBand", payload: { anything: true } },
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[1]!.type).toBe("someFutureBand");
  });

  test("malformed entries are dropped", () => {
    expect(parseBlocks([null, 3, "x", {}, { type: "" }])).toEqual([]);
  });

  test("a non-array body yields no blocks", () => {
    expect(parseBlocks(undefined)).toEqual([]);
  });
});

describe("parseSections", () => {
  test("sorts by ordinal regardless of row order", () => {
    const sections = parseSections([
      row({ id: "b", section_key: "second", ordinal: 2 }),
      row({ id: "a", section_key: "first", ordinal: 1 }),
    ]);
    expect(sections.map((s) => s.sectionKey)).toEqual(["first", "second"]);
  });

  test("one bad row does not take the report down", () => {
    const sections = parseSections([row(), { nonsense: true }]);
    expect(sections).toHaveLength(1);
  });
});

describe("applyTier — the gate", () => {
  const sections: BlueprintSection[] = [
    parseSection(row())!,
    parseSection(
      row({
        id: "22222222-2222-2222-2222-222222222222",
        section_key: "implementation",
        ordinal: 2,
        tier: "final",
        title: "How to build it",
        teaser: "Eight more topics, in the order they bind.",
        body: { blocks: [{ type: "prose", paragraphs: [SECRET] }] },
      }),
    )!,
  ];

  test("locked: the final body is GONE, not merely hidden", () => {
    const gated = applyTier(sections, false);
    const final = gated.find((s) => s.tier === "final")!;

    expect(final.locked).toBe(true);
    expect(final.blocks).toBeUndefined();
    // The property that actually protects the paid content: the marker must not
    // survive serialisation into the SSR payload.
    expect(JSON.stringify(gated)).not.toContain(SECRET);
  });

  test("locked: the title and teaser DO survive — that is the upsell", () => {
    const final = applyTier(sections, false).find((s) => s.tier === "final")!;
    expect(final.title).toBe("How to build it");
    expect(final.teaser).toBe("Eight more topics, in the order they bind.");
  });

  test("locked: preliminary sections are untouched", () => {
    const preliminary = applyTier(sections, false).find((s) => s.tier === "preliminary")!;
    expect(preliminary.locked).toBe(false);
    expect(preliminary.blocks).toHaveLength(1);
  });

  test("unlocked: everything reads, and the marker is present", () => {
    const gated = applyTier(sections, true);
    expect(gated.every((s) => !s.locked)).toBe(true);
    expect(JSON.stringify(gated)).toContain(SECRET);
  });

  test("the gate does not mutate its input", () => {
    applyTier(sections, false);
    expect(sections[1]!.blocks).toHaveLength(1);
  });
});

describe("tabsOf", () => {
  test("two tabs derived from one list", () => {
    const sections = parseSections([
      row({ id: "a", section_key: "one", ordinal: 1, tier: "preliminary" }),
      row({ id: "b", section_key: "two", ordinal: 2, tier: "final" }),
    ]);
    const tabs = tabsOf(sections);
    expect(tabs.preliminary.map((s) => s.sectionKey)).toEqual(["one"]);
    expect(tabs.final.map((s) => s.sectionKey)).toEqual(["two"]);
  });
});
