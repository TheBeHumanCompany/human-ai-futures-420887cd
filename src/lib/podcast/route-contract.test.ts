import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The throws-versus-catches asymmetry, pinned structurally.
 *
 * > `/` catches. `/podcast` and `/podcast/$slug` throw.
 *
 * The rule is short and the reason is not. A Sanity outage must take the
 * podcast surfaces to an honest 5xx — a 200 with an empty catalogue, or a 404,
 * both claim something untrue about a permanent URL. But the same outage must
 * NOT take the homepage down: a bare loader swap there would error the root
 * match and send the entire front door to 500, a self-inflicted outage caused
 * by a podcast section.
 *
 * That asymmetry lives in prose in a plan and in the shape of three files. This
 * test is what makes it a property of the repo: a route that quietly gains a
 * try/catch, or loses its errorComponent, goes red here rather than in
 * production during the one incident it was written for.
 *
 * Asserted over source text because the thing being pinned is the presence of a
 * declaration, and a route module cannot be imported and inspected for the
 * ABSENCE of a catch block any other way.
 */

const ROUTES_DIR = path.join(import.meta.dir, "..", "..", "routes");

const read = (file: string) => readFileSync(path.join(ROUTES_DIR, file), "utf8");

/**
 * Routes that read Sanity and must fail loudly.
 *
 * `podcast.tsx` and `index.tsx` join this file as their own tasks convert them —
 * `podcast.tsx` into this list, `index.tsx` into the catcher block below. Listed
 * here rather than hard-coded into each test so adding one is a single line.
 */
const MUST_THROW = ["podcast_.$slug.tsx"];

describe("Sanity-backed routes fail loudly", () => {
  test("the list is non-empty — otherwise every row below is vacuous", () => {
    expect(MUST_THROW.length).toBeGreaterThan(0);
  });

  for (const file of MUST_THROW) {
    test(`${file} declares an errorComponent`, () => {
      // Without one, the boundary falls to the router library's built-in bare
      // panel — NOT the branded component in __root.tsx, which only fires when
      // the root match itself errors.
      expect(read(file)).toMatch(/errorComponent\s*:/);
    });

    test(`${file} declares a headers option`, () => {
      expect(read(file)).toMatch(/headers\s*:/);
    });

    test(`${file} discriminates on match.status, never on !loaderData`, () => {
      const source = read(file);
      // The specific bug this forbids: `loaderData` is undefined on BOTH the
      // error and not-found paths, so a `!loaderData` guard collapses them and
      // emits noindex on an outage.
      expect(source).toContain('match.status === "error"');
    });

    test(`${file}'s loader does not catch`, () => {
      const source = read(file);
      const start = source.indexOf("loader:");
      const end = source.indexOf("headers:", start);

      expect(start).toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(start);
      expect(source.slice(start, end)).not.toContain("catch");
    });
  }
});
