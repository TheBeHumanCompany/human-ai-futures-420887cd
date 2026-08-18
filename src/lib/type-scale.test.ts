/**
 * The type scale, guarded (AC-4.1, AC-4.2, AC-4.5).
 *
 * Nothing else in this repo reads `src/styles.css`, so before this file the
 * scale could be edited to anything — or deleted — and every test would stay
 * green. That is the gap R5 names: "the scale regresses pages, and no test
 * renders a page".
 *
 * ── The self-matching trap ──────────────────────────────────────────────────
 * `src/lib/layering.test.ts` walks ALL of `src/`, tests included, and filters
 * tests back out per rule. Any "this token must not appear in src" assertion
 * has to be scoped to NON-TEST files, or this very file — which necessarily
 * spells out the tokens it is banning — matches its own rule and the gate can
 * never pass. Every scan below uses `srcNonTestFiles`.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const SRC_DIR = join(REPO_ROOT, "src");
const STYLES = readFileSync(join(SRC_DIR, "styles.css"), "utf8");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const isSourceFile = (f: string) => /\.(ts|tsx)$/.test(f);
const isTestFile = (f: string) => /\.test\.tsx?$/.test(f);

const srcNonTestFiles = walk(SRC_DIR)
  .filter(isSourceFile)
  .filter((f) => !isTestFile(f));

/** The one file excluded from the migration — see `scripts/type-inventory.ts`. */
const SPECIMEN = join(SRC_DIR, "routes", "type-specimen.tsx");

const utilityBlock = (name: string) => {
  const m = new RegExp(`@utility\\s+${name}\\s*\\{([^}]*)\\}`).exec(STYLES);
  return m ? m[1] : null;
};

describe("fixture sanity — non-vacuity floors", () => {
  test("the src walk finds a realistic number of non-test files", () => {
    expect(srcNonTestFiles.length).toBeGreaterThanOrEqual(15);
  });

  test("styles.css was actually read", () => {
    expect(STYLES).toContain("@utility");
    expect(STYLES.length).toBeGreaterThan(2000);
  });
});

describe("AC-4.1 — the scale is defined, in every register", () => {
  const REGISTERS = ["caps", "condensed", "prose"] as const;
  const LEVELS = ["h1", "h2", "h3", "h4"] as const;

  for (const register of REGISTERS) {
    for (const level of LEVELS) {
      const name = `type-${level}-${register}`;
      test(`${name} declares family, weight, size and line-height`, () => {
        const body = utilityBlock(name);
        expect(body).not.toBeNull();
        expect(body).toContain("font-family: var(--font-");
        expect(body).toMatch(/font-weight:\s*\d+/);
        expect(body).toMatch(/font-size:/);
        expect(body).toMatch(/line-height:/);
      });
    }
  }

  test("body and the eyebrow+rule role are defined", () => {
    for (const name of ["type-body", "type-body-lg", "type-body-sm", "type-eyebrow-rule"]) {
      expect(utilityBlock(name)).not.toBeNull();
    }
    // `eyebrow` is extended in place, never duplicated (V25) — a second
    // `type-eyebrow` beside it would be the fifth competing utility.
    expect(utilityBlock("eyebrow")).not.toBeNull();
    expect(utilityBlock("type-eyebrow")).toBeNull();
  });

  test("the uppercase register is uppercase and the other two are not", () => {
    for (const level of LEVELS) {
      expect(utilityBlock(`type-${level}-caps`)).toContain("text-transform: uppercase");
      expect(utilityBlock(`type-${level}-condensed`)).toContain("text-transform: none");
      expect(utilityBlock(`type-${level}-prose`)).toContain("text-transform: none");
    }
  });

  test("at least one register renders light — the mockups' reflective voice", () => {
    // R19: a scale that only expresses the bold uppercase voice satisfies the
    // approval gate in form and voids it in fact, because half the mockups
    // cannot be built from it.
    const light = (["condensed", "prose"] as const).flatMap((r) =>
      LEVELS.map((l) => utilityBlock(`type-${l}-${r}`) ?? ""),
    );
    expect(light.filter((b) => /font-weight:\s*[123]00\b/.test(b)).length).toBeGreaterThanOrEqual(
      4,
    );
  });

  test("the two family axes are both used", () => {
    expect(utilityBlock("type-h1-caps")).toContain("--font-display");
    expect(utilityBlock("type-h1-condensed")).toContain("--font-display");
    expect(utilityBlock("type-h1-prose")).toContain("--font-sans");
  });

  /**
   * The uppercase register carries a WEIGHT axis as well as a size ladder.
   *
   * Without it, migrating `display` (Oswald 200, 24 call sites including the
   * company Wordmark) has only one destination — the 700 steps — and the
   * migration silently restyles the logotype and every light editorial headline.
   * That failure passes every other gate in this repo: the class name is valid,
   * types check, and the "every heading carries a type-* class" proof gets
   * *greener*. This is the only assertion that can catch it.
   */
  describe("the uppercase register has a weight axis", () => {
    const CAPS_LEVELS = ["hero", "h1", "h2", "h3", "h4"] as const;

    for (const level of CAPS_LEVELS) {
      test(`type-${level}-caps is 700 and type-${level}-caps-light is 200`, () => {
        expect(utilityBlock(`type-${level}-caps`)).toMatch(/font-weight:\s*700\b/);
        expect(utilityBlock(`type-${level}-caps-light`)).toMatch(/font-weight:\s*200\b/);
      });

      test(`type-${level}-caps and its light twin are the same size`, () => {
        // A weight axis that also changes size is not an axis, it is two
        // different steps wearing related names — and migrating for weight
        // would quietly resize as well.
        const size = (n: string) => /font-size:\s*([^;]+)/.exec(utilityBlock(n) ?? "")?.[1];
        expect(size(`type-${level}-caps-light`)).toBe(size(`type-${level}-caps`));
      });
    }

    test("the label step is bold only — every one of its call sites was 700", () => {
      expect(utilityBlock("type-label-caps")).toMatch(/font-weight:\s*700\b/);
      expect(utilityBlock("type-label-caps-light")).toBeNull();
    });
  });
});

describe("AC-4.2 — the legacy utilities are gone", () => {
  const RETIRED = [
    "display",
    "archive-question",
    "section-label",
    "section-label-dark",
    "section-label-light",
    "section-label-rule",
    "display-strong",
  ];

  for (const name of RETIRED) {
    test(`styles.css no longer defines ${name}`, () => {
      expect(utilityBlock(name)).toBeNull();
    });
  }

  /**
   * Counts call sites the way `scripts/type-inventory.ts` does, by an
   * independent implementation — read the contents of every quoted span, split
   * those on whitespace, drop the variant prefix, then match EXACTLY.
   *
   * Two details matter and both have bitten this repo before. Tokenising the raw
   * file rather than the string contents leaves `className="display` glued
   * together, so the first class in every attribute goes uncounted — which is
   * how a scan can report zero for a file that plainly uses the utility. And
   * substring matching would count `--font-display` as a use of `display`.
   */
  const callSites = (file: string, token: string) => {
    const text = readFileSync(file, "utf8");
    const spans = text.match(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g) ?? [];
    let count = 0;
    for (const span of spans) {
      for (const word of span.slice(1, -1).split(/\s+/)) {
        let depth = 0;
        let cut = -1;
        for (let i = 0; i < word.length; i++) {
          const c = word[i];
          if (c === "[") depth++;
          else if (c === "]") depth--;
          else if (c === ":" && depth === 0) cut = i;
        }
        if (word.slice(cut + 1) === token) count++;
      }
    }
    return count;
  };

  test("the counter is not simply blind", () => {
    // Non-vacuity floor. Every assertion below is of the form "this token
    // appears nowhere", which passes trivially if the counter always returns 0.
    // Point it at a class that IS present and require a hit.
    const index = join(SRC_DIR, "routes", "index.tsx");
    expect(callSites(index, "type-label-caps")).toBeGreaterThanOrEqual(1);
    expect(callSites(index, "type-hero-caps-light")).toBeGreaterThanOrEqual(1);
  });

  for (const name of RETIRED) {
    test(`no non-test source file references ${name}`, () => {
      const offenders = srcNonTestFiles
        .filter((f) => f !== SPECIMEN)
        .filter((f) => callSites(f, name) > 0);
      expect(offenders).toEqual([]);
    });
  }

  test("all four AC-4.2 names are retired — definitions and call sites both", () => {
    for (const name of RETIRED) {
      expect(utilityBlock(name)).toBeNull();
    }
    const offenders = srcNonTestFiles
      .filter((f) => f !== SPECIMEN)
      .flatMap((f) => RETIRED.filter((n) => callSites(f, n) > 0).map((n) => `${f}: ${n}`));
    expect(offenders).toEqual([]);
  });

  test("the migration reached the site an attribute regex cannot see", () => {
    // `podcast_.$slug.tsx` holds its class list in a bare `const`, with no
    // `className=` anywhere near it. A `className="…"` scanner is structurally
    // blind to it, which is how it survived an earlier count. Assert positively
    // that it now carries a scale class.
    const text = readFileSync(join(SRC_DIR, "routes", "podcast_.$slug.tsx"), "utf8");
    expect(text).toMatch(/const SECTION_HEADING\s*=\s*\n?\s*"type-label-caps /);
  });
});

describe("AC-4.5 — the rebuilt pages carry no bespoke sizes", () => {
  const PAGES = [join(SRC_DIR, "routes", "the-new-human-era.tsx")];

  for (const page of PAGES) {
    const name = page.replace(`${REPO_ROOT}/`, "");
    const text = readFileSync(page, "utf8");

    test(`${name} has a realistic number of headings`, () => {
      expect((text.match(/<h[1-6]/g) ?? []).length).toBeGreaterThanOrEqual(12);
    });

    test(`${name} sets no size by hand`, () => {
      // Built from fragments so this assertion does not match its own source.
      const banned = new RegExp(
        ["clamp" + "\\(", "text-\\[", "\\btext-(xs|sm|base|lg|xl|[2-9]xl)\\b"].join("|"),
      );
      const hits = text
        .split("\n")
        .map((line, i) => [i + 1, line] as const)
        .filter(([, line]) => banned.test(line));
      expect(hits).toEqual([]);
    });

    test(`${name} gives every heading a scale class`, () => {
      const headings = text.match(/<h[1-6][^>]*>/g) ?? [];
      expect(headings.length).toBeGreaterThanOrEqual(12);
      expect(headings.filter((h) => !h.includes("type-"))).toEqual([]);
    });
  }
});
