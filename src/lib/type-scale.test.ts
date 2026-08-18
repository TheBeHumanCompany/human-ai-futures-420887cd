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

/**
 * The Blueprint page is being rewritten on the scale from scratch in Phase 6 and
 * was deliberately left out of the Phase 4 migration. It is the ONLY remaining
 * holder of a legacy utility. Named explicitly so that when it is migrated this
 * test fails and forces the exception — and the `display` block — to be deleted,
 * rather than the exception quietly outliving its reason.
 */
const PHASE_6_PENDING = join(SRC_DIR, "routes", "be-human-ai", "index.tsx");

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
});

describe("AC-4.2 — the legacy utilities are gone", () => {
  const RETIRED = [
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

  test("the counter sees the utility the Phase 6 file plainly uses", () => {
    // Floor for the two assertions below: if the counter returns 0 here it is
    // broken, and "no file references X" would pass vacuously everywhere.
    expect(callSites(PHASE_6_PENDING, "display")).toBeGreaterThanOrEqual(1);
  });

  for (const name of RETIRED) {
    test(`no non-test source file references ${name}`, () => {
      const offenders = srcNonTestFiles
        .filter((f) => f !== SPECIMEN)
        .filter((f) => callSites(f, name) > 0);
      expect(offenders).toEqual([]);
    });
  }

  test("`display` survives only in the one Phase 6 file, and nowhere else", () => {
    const offenders = srcNonTestFiles
      .filter((f) => f !== SPECIMEN && f !== PHASE_6_PENDING)
      .filter((f) => callSites(f, "display") > 0);
    expect(offenders).toEqual([]);
  });

  test("when the Phase 6 file is migrated, the `display` block must go too", () => {
    // This is the tripwire. `display` is still defined ONLY because
    // be-human-ai/index.tsx still calls it. The moment that stops being true,
    // this fails and the definition has to be deleted — so the exception cannot
    // outlive its justification.
    const stillCalled = callSites(PHASE_6_PENDING, "display") > 0;
    const stillDefined = utilityBlock("display") !== null;
    expect(stillDefined).toBe(stillCalled);
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
