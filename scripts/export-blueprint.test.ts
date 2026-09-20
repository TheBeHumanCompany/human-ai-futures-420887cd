import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { checkExportable, renderBlueprint } from "./export-blueprint";
import { RENDERED_BLOCK_TYPES } from "../src/components/client-portal/blueprint/blocks";
import { applyTier, parseSections } from "../src/lib/client-portal/blueprint-schema";
import { LOCATOR_ONLY } from "../src/lib/client-portal/locators";

/**
 * The export's gate, run the way `upload-email-templates.test.ts` runs the
 * email one: render the real artifact from the committed fixture and assert
 * against the bytes that would ship.
 *
 * The fixture is the birch-bark-coffee draft in the step-1 row contract, plus
 * two `final` sections the preliminary does not have — without them there is
 * nothing for the paywall assertions to bite on, and the paywall is the one
 * thing about this artifact that cannot be checked by looking at it.
 */

const FIXTURE = path.join(import.meta.dir, "fixtures", "blueprint-rows.birch-bark-coffee.json");

const rows = JSON.parse(await readFile(FIXTURE, "utf8")) as unknown[];

/** Text the paid sections contain and the preliminary must not. */
const PAID_MARKER = "PAID-SECTION-BODY";

const locked = await renderBlueprint(rows);
const unlocked = await renderBlueprint(rows, { unlocked: true });

describe("the fixture is a blueprint this build can draw", () => {
  test("every row parses, and every block has a renderer", () => {
    const sections = parseSections(rows);
    expect(sections.length).toBe(rows.length);
    const types = sections.flatMap((section) => (section.blocks ?? []).map((b) => b.type));
    expect(types.length).toBeGreaterThan(20);
    expect(types.filter((type) => !RENDERED_BLOCK_TYPES.has(type))).toEqual([]);
    expect(types).not.toContain("legacyHtml");
  });

  test("exactly one hero row, carrying exactly one title block", () => {
    const heroes = parseSections(rows).filter((section) => section.band === "hero");
    expect(heroes.length).toBe(1);
    expect(heroes[0]!.blocks?.length).toBe(1);
    expect(heroes[0]!.blocks?.[0]?.type).toBe("title");
  });

  test("the masthead reaches the document", () => {
    expect(locked.html).toContain("Birch Bark Coffee Company");
    expect(locked.html).toContain("Prepared for");
    expect(locked.html).toContain("Assessment date");
    expect(locked.html).toContain('data-band="hero"');
    // The hero is the masthead, never also a numbered band.
    expect(locked.html).not.toContain('id="section-hero"');
  });
});

describe("the paywall survives the export", () => {
  test("locked: final titles and teasers ship, final bodies do not", () => {
    expect(locked.html).toContain("The institutional qualification playbook");
    expect(locked.html).toContain("the bid calendar");
    expect(locked.html).toContain("Wiisiniwin launch sequence");
    expect(locked.html).not.toContain(PAID_MARKER);
    expect(locked.html).toContain('data-locked="true"');
  });

  test("--unlocked: the paid bodies render", () => {
    expect(unlocked.html).toContain(PAID_MARKER);
    expect(unlocked.html).not.toContain('data-locked="true"');
  });
});

describe("no internal grounding reaches the client", () => {
  test("not one parenthetical in the exported HTML is a bare locator list", () => {
    const parentheticals = [...unlocked.html.matchAll(/\(([^()]*)\)/g)].map((m) => m[1]!);
    // Non-vacuity: the fixture is full of real citations, so the scan must
    // actually be finding parentheticals rather than matching nothing.
    expect(parentheticals.length).toBeGreaterThan(5);
    expect(parentheticals.filter((body) => LOCATOR_ONLY.test(body))).toEqual([]);
  });

  test("the transcript filename and evidence ids are gone", () => {
    expect(unlocked.html).not.toContain("transcript:");
    expect(unlocked.html).not.toMatch(/E\d{3}/);
  });
});

describe("the export's stylesheet is the portal's stylesheet", () => {
  test("it carries the site utilities the bands are built from", () => {
    for (const utility of [".section-cream", ".type-h4-caps", ".eyebrow"]) {
      expect(locked.stylesheet).toContain(utility);
    }
  });

  test("it carries the print rules, so the file prints as the portal prints", () => {
    expect(locked.stylesheet).toContain("@media print");
    expect(locked.stylesheet).toContain('[data-print="hide"]');
  });

  test("the document is self-contained and carries no script", () => {
    expect(locked.html).toStartWith("<!doctype html>");
    expect(locked.html).toContain("fonts.googleapis.com/css2?family=Oswald");
    expect(locked.html).not.toContain("<script");
  });
});

describe("the export refuses rather than dropping content", () => {
  test("a legacyHtml row is named and refused", () => {
    const hostile = applyTier(
      parseSections([
        ...rows,
        {
          id: "bbc00000-0000-4000-8000-0000000000ff",
          section_key: "s99-legacy",
          ordinal: 99,
          tier: "preliminary",
          title: "Pasted report",
          band: "prose",
          body: { blocks: [{ type: "legacyHtml", html: "<p>the old body</p>" }] },
        },
      ]),
      false,
    );
    expect(() => checkExportable(hostile)).toThrow(/s99-legacy: legacyHtml/);
  });

  test("a blueprint with no hero row is refused", () => {
    const headless = applyTier(
      parseSections(rows.filter((row) => (row as { band?: string }).band !== "hero")),
      false,
    );
    expect(() => checkExportable(headless)).toThrow(/hero/);
  });
});
