import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  ARCHIVE_FIGURE_CONFIRMED,
  ARCHIVE_PERSPECTIVES_MIN,
  CLOSING,
  INITIATIVES,
  initiativeById,
  MISSION,
  WHATS_NEXT,
} from "./positioning";

/**
 * The positioning module, asserted for substance rather than wording.
 *
 * Same idiom as `sales/pillars.test.ts`: pinning exact sentences would turn
 * every copy edit red and teach the next person to delete the assertion. What
 * is pinned here is the set of claims the pages are built on — the four
 * initiatives, the three phrases the mission is recognisable by, and the sign
 * off — plus the two things that can go wrong silently: the perspectives figure
 * shipping unconfirmed, and `short` drifting away from the paragraph it
 * summarises.
 */

const ALL_STRINGS: readonly string[] = [
  MISSION.eyebrow,
  MISSION.headline,
  ...MISSION.lede,
  MISSION.missionLine,
  MISSION.transitionLine,
  ...INITIATIVES.flatMap((initiative) => [
    initiative.name,
    ...initiative.full,
    initiative.short,
    initiative.cta,
  ]),
];

const KNOWN_ROUTES = [
  "/be-human-ai",
  "/the-new-human-era",
  "/the-human-archive",
  "/podcast",
] as const;

describe("the four initiatives", () => {
  test("there are exactly four, which is what every surface renders", () => {
    expect(INITIATIVES).toHaveLength(4);
  });

  test("ids are unique", () => {
    const ids = INITIATIVES.map((initiative) => initiative.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("destinations are unique, and each is a route this site actually has", () => {
    const tos = INITIATIVES.map((initiative) => initiative.to);
    expect(new Set(tos).size).toBe(tos.length);
    for (const to of tos) expect(KNOWN_ROUTES).toContain(to);
  });

  test("lookup by id returns the right one, and throws on an unknown one", () => {
    for (const initiative of INITIATIVES) {
      expect(initiativeById(initiative.id)).toBe(initiative);
    }
    // @ts-expect-error — deliberately outside the union, to pin the runtime guard
    expect(() => initiativeById("does-not-exist")).toThrow();
  });

  test("every initiative carries a non-empty paragraph, a summary and a link label", () => {
    // The non-vacuity floor for everything below: an initiative with an empty
    // `full` would satisfy most of this suite by having nothing to be wrong.
    for (const initiative of INITIATIVES) {
      expect(initiative.full.length).toBeGreaterThan(0);
      for (const paragraph of initiative.full) expect(paragraph.trim().length).toBeGreaterThan(0);
      expect(initiative.short.trim().length).toBeGreaterThan(0);
      expect(initiative.cta.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("the mission, by the phrases it is recognisable by", () => {
  /**
   * These three are the load-bearing vocabulary. "Human infrastructure" is what
   * the company says it builds, "Human Advantage" is what it says that
   * infrastructure produces, and "four connected initiatives" is the sentence
   * this entire piece of work exists to make visible. A rewrite that loses any
   * of them has changed the positioning, not the wording.
   */
  test("retains 'human infrastructure'", () => {
    expect(MISSION.lede.join(" ")).toContain("human infrastructure");
  });

  test("retains 'Human Advantage'", () => {
    expect(MISSION.missionLine).toContain("Human Advantage");
  });

  test("retains 'four connected initiatives'", () => {
    expect(MISSION.transitionLine).toContain("four connected initiatives");
  });

  test("the closing keeps the sign-off", () => {
    expect(CLOSING.join(" ")).toContain("The Future Is Human.");
  });

  test("what's next has a heading and a body", () => {
    expect(WHATS_NEXT.heading.trim().length).toBeGreaterThan(0);
    expect(WHATS_NEXT.body.length).toBeGreaterThan(0);
  });
});

describe("the perspectives figure — the mechanical gate", () => {
  /**
   * This repo cannot corroborate "more than 200". There is no archive document
   * type in Sanity, `content.ts` holds four entries, and all four detail pages
   * are unwritten. The figure is the founder's own claim about his own archive
   * and it ships — but it ships behind a constant with a date on it, not behind
   * a checkbox in a plan file.
   *
   * BOTH directions are asserted, and the second one is what makes the
   * unconfirmed default actually hold. A confirmation date with no claim is as
   * wrong as a claim with no date: the first means someone withdrew the
   * sentence and left the provenance behind, the second is the failure the gate
   * exists to prevent.
   */
  test("a confirmation date means the figure is present", () => {
    if (ARCHIVE_FIGURE_CONFIRMED === null) return;

    const archive = INITIATIVES.find((initiative) => initiative.id === "the-human-archive");
    expect(archive).toBeDefined();
    expect(archive!.full.join(" ")).toContain(String(ARCHIVE_PERSPECTIVES_MIN));
  });

  test("no confirmation date means the claim appears nowhere", () => {
    if (ARCHIVE_FIGURE_CONFIRMED !== null) return;

    for (const value of ALL_STRINGS) expect(value).not.toContain("more than 200");
  });

  test("the confirmation date is an ISO date, so it can be traced to a day", () => {
    if (ARCHIVE_FIGURE_CONFIRMED === null) return;

    expect(ARCHIVE_FIGURE_CONFIRMED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(ARCHIVE_FIGURE_CONFIRMED))).toBe(false);
  });

  test("the constant cannot drift from the copy that states it", () => {
    // Every string that talks about perspectives must carry the number, so the
    // sentence and `ARCHIVE_PERSPECTIVES_MIN` cannot be edited apart. The
    // constant is a provenance anchor and an assertion target — deliberately
    // not a template variable, because interpolating it would mean the approved
    // copy is no longer reproduced as approved.
    const mentioning = ALL_STRINGS.filter((value) => value.includes("perspectives"));

    if (ARCHIVE_FIGURE_CONFIRMED !== null) {
      // Floor: with the figure shipped, at least one string must mention it, or
      // the assertion below passes over an empty list.
      expect(mentioning.length).toBeGreaterThan(0);
    }

    for (const value of mentioning) expect(value).toContain(String(ARCHIVE_PERSPECTIVES_MIN));
  });
});

describe("the figure cannot be re-typed into a component", () => {
  /**
   * A source-text scan, the technique `index.test.ts` and `layering.test.ts`
   * already use here. `positioning.ts` is the one place the sentence may live;
   * the failure this prevents is someone pasting "more than 200" straight into
   * JSX, where the gate above has no reach and the constant cannot see it.
   *
   * Matched on the phrase rather than on the bare number, deliberately: `200`
   * alone appears in Tailwind scale values (`duration-200`), HTTP statuses and
   * pixel sizes, so a numeric grep would be noise.
   */
  const SRC_DIR = path.join(import.meta.dir, "..");
  const SCANNED_DIRS = [path.join(SRC_DIR, "routes"), path.join(SRC_DIR, "components")];

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else out.push(full);
    }
    return out;
  }

  const scanned = SCANNED_DIRS.flatMap(walk).filter((file) => /\.(ts|tsx)$/.test(file));

  test("the scan finds a realistic number of files", () => {
    // Floor first: "no file contains X" is vacuous against an empty walk.
    expect(scanned.length).toBeGreaterThanOrEqual(20);
  });

  test("the walker reads content, not just names", () => {
    const combined = scanned.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(combined).toContain("createFileRoute");
  });

  test("no route or component file states the figure as a literal", () => {
    const offenders = scanned.filter((file) =>
      readFileSync(file, "utf8").includes("more than 200"),
    );
    expect(offenders).toEqual([]);
  });
});

describe("short does not drift from the paragraph it summarises", () => {
  /**
   * `short` is authored, not derived — see the drift note in `positioning.ts`.
   * Nothing can catch PARTIAL drift, where `full` is rewritten around the token
   * while `short` keeps saying the old thing. What this catches is TOTAL drift:
   * a paragraph replaced wholesale while its summary is left behind.
   *
   * The tokens are named here rather than computed, because a computed
   * "longest shared word" would quietly settle on "the" and assert nothing.
   */
  const SHARED_TOKEN: Record<string, string> = {
    "be-human-ai": "governance",
    "the-new-human-era": "worldview",
    "the-human-archive": "question",
    podcast: "innovators",
  };

  test("every initiative has a named token, so none is skipped silently", () => {
    for (const initiative of INITIATIVES) {
      expect(Object.keys(SHARED_TOKEN)).toContain(initiative.id);
    }
  });

  test("each summary shares its token with its own opening paragraph", () => {
    for (const initiative of INITIATIVES) {
      const token = SHARED_TOKEN[initiative.id];
      expect(initiative.full[0].toLowerCase()).toContain(token);
      expect(initiative.short.toLowerCase()).toContain(token);
    }
  });
});
